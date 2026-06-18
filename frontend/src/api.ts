export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface Run {
  id: string;
  parent_run_id: string | null;
  project_id: string;
  name: string;
  run_type: 'chain' | 'llm' | 'tool' | 'agent' | 'retriever' | 'embedding';
  inputs: any;
  outputs: any | null;
  error: string | null;
  status: 'running' | 'success' | 'error';
  start_time: string;
  end_time: string | null;
  tags: string[] | null;
  children?: Run[];
}

const API_BASE = '';

export async function fetchProjects(): Promise<Project[]> {
  const resp = await fetch(`${API_BASE}/projects`);
  if (!resp.ok) throw new Error('Failed to fetch projects');
  return resp.json();
}

export async function fetchRuns(
  projectId: string, 
  filters: { 
    status?: string; 
    run_type?: string; 
    min_latency?: number; 
    start_date?: string; 
    end_date?: string; 
    tags?: string 
  } = {}
): Promise<Run[]> {
  const params = new URLSearchParams({ project_id: projectId });
  if (filters.status) params.append('status', filters.status);
  if (filters.run_type) params.append('run_type', filters.run_type);
  if (filters.min_latency) params.append('min_latency', filters.min_latency.toString());
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.tags) params.append('tags', filters.tags);
  
  const resp = await fetch(`${API_BASE}/runs?${params.toString()}`);
  if (!resp.ok) throw new Error('Failed to fetch runs');
  return resp.json();
}

export async function fetchTrace(traceId: string): Promise<Run> {
  const resp = await fetch(`${API_BASE}/traces/${traceId}`);
  if (!resp.ok) throw new Error('Failed to fetch trace');
  return resp.json();
}

export interface ApiKey {
  id: string;
  key: string;
  created_at: string;
}

export async function fetchApiKeys(projectId: string): Promise<ApiKey[]> {
  const resp = await fetch(`${API_BASE}/api-keys?project_id=${projectId}`);
  if (!resp.ok) throw new Error('Failed to fetch api keys');
  return resp.json();
}

export async function createApiKey(projectId: string): Promise<ApiKey> {
  const resp = await fetch(`${API_BASE}/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  });
  if (!resp.ok) throw new Error('Failed to create api key');
  return resp.json();
}

export async function createProject(name: string): Promise<Project> {
  const resp = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!resp.ok) throw new Error('Failed to create project');
  return resp.json();
}

export async function deleteProject(projectId: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'DELETE',
  });
  if (!resp.ok) throw new Error('Failed to delete project');
}
