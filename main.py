import os
import secrets
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from uuid import UUID

load_dotenv(override=True)

DATABASE_URL = os.environ["DATABASE_URL"]

app = FastAPI(title="LangChain Tracer")
bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def get_conn():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


@contextmanager
def db():
    conn = get_conn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

def require_api_key(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT project_id FROM api_keys WHERE key = %s", (credentials.credentials,))
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return str(row["project_id"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ProjectCreate(BaseModel):
    name: str

class ApiKeyCreate(BaseModel):
    project_id: UUID

class RunCreate(BaseModel):
    id: UUID
    parent_run_id: Optional[UUID] = None
    name: str
    run_type: str
    inputs: dict = {}
    start_time: datetime
    tags: Optional[list] = None

class RunPatch(BaseModel):
    outputs: Optional[dict] = None
    error: Optional[str] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.delete("/projects/{project_id}")
def delete_project(project_id: str):
    with db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM projects WHERE id = %s RETURNING id", (project_id,))
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


@app.get("/projects")
def list_projects():
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM projects ORDER BY created_at DESC")
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.post("/projects", status_code=201)
def create_project(body: ProjectCreate):
    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO projects (name) VALUES (%s) RETURNING id, name, created_at",
            (body.name,),
        )
        row = cur.fetchone()
    return dict(row)


@app.post("/api-keys", status_code=201)
def create_api_key(body: ApiKeyCreate):
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM projects WHERE id = %s", (str(body.project_id),))
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Project not found")
        key = secrets.token_urlsafe(32)
        cur.execute(
            "INSERT INTO api_keys (key, project_id) VALUES (%s, %s) RETURNING id, key, project_id, created_at",
            (key, str(body.project_id)),
        )
        row = cur.fetchone()
    return dict(row)

@app.get("/api-keys")
def list_api_keys(project_id: str = Query(...)):
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, key, created_at FROM api_keys WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.post("/runs", status_code=201)
def create_run(body: RunCreate, project_id: str = Depends(require_api_key)):
    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO runs (id, parent_run_id, project_id, name, run_type, inputs, status, start_time, tags)
            VALUES (%s, %s, %s, %s, %s, %s, 'running', %s, %s)
            RETURNING id
            """,
            (
                str(body.id),
                str(body.parent_run_id) if body.parent_run_id else None,
                project_id,
                body.name,
                body.run_type,
                Jsonb(body.inputs),
                body.start_time,
                Jsonb(body.tags) if body.tags else None,
            ),
        )
        row = cur.fetchone()
    return {"id": str(row["id"])}


@app.patch("/runs/{run_id}")
def patch_run(run_id: str, body: RunPatch, project_id: str = Depends(require_api_key)):
    fields = []
    values = []

    if body.outputs is not None:
        fields.append("outputs = %s")
        values.append(Jsonb(body.outputs))
    if body.error is not None:
        fields.append("error = %s")
        values.append(body.error)
    if body.end_time is not None:
        fields.append("end_time = %s")
        values.append(body.end_time)
    if body.status is not None:
        fields.append("status = %s")
        values.append(body.status)

    if not fields:
        raise HTTPException(status_code=400, detail="Nothing to update")

    values.extend([run_id, project_id])
    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            f"UPDATE runs SET {', '.join(fields)} WHERE id = %s AND project_id = %s RETURNING id",
            values,
        )
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Run not found")
    return {"ok": True}


@app.get("/runs")
def list_runs(
    project_id: str = Query(...),
    status: Optional[str] = Query(None),
    run_type: Optional[str] = Query(None),
    min_latency: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    tags: Optional[str] = Query(None), # comma separated
    limit: int = Query(100, le=500),
):
    conditions = ["project_id = %s"]
    values: list = [project_id]

    if status:
        conditions.append("status = %s")
        values.append(status)
    if run_type:
        conditions.append("run_type = %s")
        values.append(run_type)
    if min_latency is not None:
        conditions.append("extract(epoch from (end_time - start_time)) * 1000 >= %s")
        values.append(min_latency)
    if start_date:
        conditions.append("start_time >= %s")
        values.append(start_date)
    if end_date:
        conditions.append("start_time <= %s")
        values.append(end_date)
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            conditions.append("tags ?| %s")
            values.append(tag_list)

    where = " AND ".join(conditions)
    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            f"SELECT * FROM runs WHERE {where} ORDER BY start_time DESC LIMIT %s",
            values + [limit],
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/traces/{trace_id}")
def get_trace(trace_id: str):
    with db() as conn:
        cur = conn.cursor()
        # Fetch the root run
        cur.execute("SELECT * FROM runs WHERE id = %s", (trace_id,))
        root = cur.fetchone()
        if root is None:
            raise HTTPException(status_code=404, detail="Trace not found")

        # Fetch all descendants via recursive CTE
        cur.execute(
            """
            WITH RECURSIVE tree AS (
                SELECT * FROM runs WHERE id = %s
                UNION ALL
                SELECT r.* FROM runs r
                JOIN tree t ON r.parent_run_id = t.id
            )
            SELECT * FROM tree ORDER BY start_time ASC
            """,
            (trace_id,),
        )
        all_runs = [dict(r) for r in cur.fetchall()]

    # Build nested tree
    by_id = {str(r["id"]): {**r, "children": []} for r in all_runs}
    root_node = None
    for r in by_id.values():
        pid = str(r["parent_run_id"]) if r["parent_run_id"] else None
        if pid and pid in by_id:
            by_id[pid]["children"].append(r)
        else:
            root_node = r

    return root_node


# ---------------------------------------------------------------------------
# Serve React build (added in Phase 3)
# ---------------------------------------------------------------------------

frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str = ""):
        index = os.path.join(frontend_dist, "index.html")
        return FileResponse(index)
