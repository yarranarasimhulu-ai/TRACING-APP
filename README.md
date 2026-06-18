# LangChain Tracer

A self-hosted, LangSmith-style tracing and monitoring app for your LangChain agents.

## Features
- **Real-time Tracing**: Monitor your LangChain chains, LLMs, and tools.
- **Trace Tree View**: Visualize the nested structure of your agent's execution.
- **Project Management**: Organize traces into different projects.
- **Simple API Key Auth**: Secure your ingestion endpoints with per-project API keys.

## Setup

### 1. Requirements
- Python 3.10+
- Node.js & npm (for building the dashboard)
- PostgreSQL (or Supabase)

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key (for running the dummy agent)
```

### 3. Installation
```bash
# Install Python dependencies
pip install -r requirements.txt

# Build the frontend
cd frontend
npm install
npm run build
cd ..
```

### 4. Running the Server
```bash
uvicorn main:app --port 8000
```
The dashboard will be available at `http://localhost:8000`.

## Usage

### 1. Create a Project & API Key
You can use the dashboard to create a project, or use the `dummy_agent.py` as a reference to create them programmatically.

### 2. Attach the Tracer
```python
from local_tracer import LocalTracer
from langchain_openai import ChatOpenAI

# Initialize tracer
tracer = LocalTracer(
    api_key="your_api_key", 
    project_id="your_project_id",
    endpoint_url="http://localhost:8000"
)

# Use in your chain or agent
llm = ChatOpenAI()
result = llm.invoke("Hello!", config={"callbacks": [tracer]})
```

## Running the Demo
```bash
python dummy_agent.py
```
This will automatically create a demo project, generate an API key, and run a simple LangChain invocation that you can see in the dashboard.
