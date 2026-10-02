import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app import database
from app.routers import auth, conversations


@asynccontextmanager
async def lifespan(_app: FastAPI):
    database.init_db()
    yield


app = FastAPI(title="GenAI Chat-bot API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(conversations.router)


class ChatBody(BaseModel):
    message: str = ""


@app.exception_handler(HTTPException)
async def http_error(_request, exc: HTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content={"error": message})


@app.get("/health")
def health():
    return {
        "status": "ok",
        "database": "connected" if database.db_ready else "disconnected",
    }


@app.post("/api/chat")
async def chat(body: ChatBody):
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    await asyncio.sleep(0.6)
    return {"reply": f"[mock] You said: {message}"}
