
import os
import httpx
from local_tracer import LocalTracer
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv

load_dotenv(override=True)

BASE_URL = "http://localhost:8000"

def setup_project():
    print("Creating project...")
    resp = httpx.post(f"{BASE_URL}/projects", json={"name": "Demo Project"})
    project = resp.json()
    project_id = project["id"]
    
    print("Creating API key...")
    resp = httpx.post(f"{BASE_URL}/api-keys", json={"project_id": project_id})
    api_key = resp.json()["key"]
    
    return project_id, api_key

@tool
def get_current_weather(location: str) -> str:
    """Get the current weather in a given location"""
    if "tokyo" in location.lower():
        return "It is currently 75 degrees and sunny in Tokyo."
    elif "new york" in location.lower():
        return "It is currently 60 degrees and raining in New York."
    else:
        return f"It is 70 degrees and clear in {location}."

@tool
def calculate_travel_time(distance: int, speed: int) -> str:
    """Calculate travel time given distance (miles) and speed (mph)."""
    return f"It will take {distance / speed} hours."

def run_agent(project_id, api_key):
    print("Starting agent run with OpenRouter...")
    tracer = LocalTracer(api_key=api_key, project_id=project_id, endpoint_url=BASE_URL)
    
    llm = ChatOpenAI(
        model="openai/gpt-oss-120b:free",
        openai_api_key="your_openrouter_api_key_here",
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "LangChain Tracer"
        }
    )
    
    tools = [get_current_weather, calculate_travel_time]
    agent = create_react_agent(llm, tools)
    
    print("Invoking agent...")
    result = agent.invoke(
        {"messages": [("user", "Use your tools to find the weather in Tokyo and then USE the calculation tool to figure out how long it takes to travel 300 miles at 60 mph. You MUST call the tools for both questions.")]}, 
        config={"callbacks": [tracer]}
    )
    print("Result generated!")

if __name__ == "__main__":
    try:
        pid, key = setup_project()
        run_agent(pid, key)
    except Exception as e:
        print(f"Error: {e}")
