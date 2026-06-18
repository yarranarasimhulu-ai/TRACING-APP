import httpx
import json
from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime, timezone
try:
    from langchain_core.callbacks import BaseCallbackHandler
except ImportError:
    from langchain.callbacks.base import BaseCallbackHandler

class LocalTracer(BaseCallbackHandler):
    def __init__(self, api_key: str, project_id: str, endpoint_url: str = "http://localhost:8000"):
        self.api_key = api_key
        self.project_id = project_id
        self.endpoint_url = endpoint_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {api_key}"}
        self.client = httpx.Client(headers=self.headers, timeout=10.0)

    def _serialize(self, obj: Any) -> Any:
        try:
            # Test if it's already JSON serializable
            json.dumps(obj)
            return obj
        except (TypeError, OverflowError):
            pass

        if isinstance(obj, dict):
            return {str(k): self._serialize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._serialize(i) for i in obj]
        
        # LangChain specific
        if hasattr(obj, "to_json"):
            try: return self._serialize(obj.to_json())
            except: pass
        if hasattr(obj, "dict"):
            try: return self._serialize(obj.dict())
            except: pass
        
        # Fallback
        return str(obj)

    def _start_run(self, run_id: UUID, parent_run_id: Optional[UUID], name: str, run_type: str, inputs: Dict[str, Any], tags: Optional[List[str]] = None):
        data = {
            "id": str(run_id),
            "parent_run_id": str(parent_run_id) if parent_run_id else None,
            "name": name,
            "run_type": run_type,
            "inputs": self._serialize(inputs),
            "start_time": datetime.now(timezone.utc).isoformat(),
            "tags": tags or []
        }
        try:
            self.client.post(f"{self.endpoint_url}/runs", json=data)
        except Exception as e:
            print(f"LocalTracer Error (start): {e}")

    def _patch_run(self, run_id: UUID, outputs: Optional[Dict[str, Any]] = None, error: Optional[str] = None, status: str = "success"):
        data = {
            "outputs": self._serialize(outputs) if outputs else {},
            "error": error,
            "status": status,
            "end_time": datetime.now(timezone.utc).isoformat()
        }
        try:
            self.client.patch(f"{self.endpoint_url}/runs/{run_id}", json=data)
        except Exception as e:
            print(f"LocalTracer Error (patch): {e}")

    # --- Chains ---
    def on_chain_start(self, serialized: Optional[Dict[str, Any]], inputs: Dict[str, Any], *, run_id: UUID, parent_run_id: Optional[UUID] = None, tags: Optional[List[str]] = None, **kwargs: Any) -> None:
        name = (serialized or {}).get("name") or kwargs.get("name") or "Chain"
        self._start_run(run_id, parent_run_id, name, "chain", inputs, tags)

    def on_chain_end(self, outputs: Dict[str, Any], *, run_id: UUID, **kwargs: Any) -> None:
        self._patch_run(run_id, outputs=outputs, status="success")

    def on_chain_error(self, error: BaseException, *, run_id: UUID, **kwargs: Any) -> None:
        self._patch_run(run_id, error=str(error), status="error")

    # --- LLMs ---
    def on_llm_start(self, serialized: Optional[Dict[str, Any]], prompts: List[str], *, run_id: UUID, parent_run_id: Optional[UUID] = None, tags: Optional[List[str]] = None, **kwargs: Any) -> None:
        inv_params = kwargs.get("invocation_params", {})
        model_name = inv_params.get("model", inv_params.get("model_name", "LLM"))
        inputs = {"prompts": prompts, "model": model_name}
        if "temperature" in inv_params:
            inputs["temperature"] = inv_params["temperature"]
        name = (serialized or {}).get("name") or model_name
        self._start_run(run_id, parent_run_id, name, "llm", inputs, tags)

    def on_llm_end(self, response: Any, *, run_id: UUID, **kwargs: Any) -> None:
        output_data = {}
        if hasattr(response, "generations"):
            output_data = {"generations": self._serialize(response.generations)}
        elif hasattr(response, "dict"):
            output_data = response.dict()
        else:
            output_data = {"output": str(response)}
            
        if hasattr(response, "llm_output") and response.llm_output:
            output_data["llm_output"] = response.llm_output
        self._patch_run(run_id, outputs=output_data, status="success")

    def on_llm_error(self, error: BaseException, *, run_id: UUID, **kwargs: Any) -> None:
        self._patch_run(run_id, error=str(error), status="error")

    # --- Tools ---
    def on_tool_start(self, serialized: Optional[Dict[str, Any]], input_str: str, *, run_id: UUID, parent_run_id: Optional[UUID] = None, tags: Optional[List[str]] = None, **kwargs: Any) -> None:
        name = (serialized or {}).get("name") or "Tool"
        inputs_data = {"input_str": input_str}
        if "inputs" in kwargs:
            inputs_data["inputs"] = kwargs["inputs"]
        self._start_run(run_id, parent_run_id, name, "tool", inputs_data, tags)

    def on_tool_end(self, output: str, *, run_id: UUID, **kwargs: Any) -> None:
        self._patch_run(run_id, outputs={"output": output}, status="success")

    def on_tool_error(self, error: BaseException, *, run_id: UUID, **kwargs: Any) -> None:
        self._patch_run(run_id, error=str(error), status="error")
