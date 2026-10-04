import os
import time
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

MODEL = (os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile").strip()
MAX_OUTPUT_TOKENS = int(os.getenv("GROQ_MAX_OUTPUT_TOKENS") or "1024")
DEFAULT_CONTEXT_LIMIT = int(os.getenv("GROQ_CONTEXT_LIMIT") or "128000")
SYSTEM_INSTRUCTION = "Reply in plain text. Be direct and concise."

_client = None


class GroqError(RuntimeError):
    pass


def _client_or_raise() -> Groq:
    global _client
    api_key = (os.getenv("GROQ_API_KEY") or "").strip()
    if not api_key:
        raise GroqError("GROQ_API_KEY is missing in backend/.env")
    if _client is None:
        _client = Groq(api_key=api_key)
    return _client


def input_token_limit() -> int:
    return DEFAULT_CONTEXT_LIMIT


def usage_from_tokens(used: int) -> dict:
    limit = input_token_limit()
    percent = round((used / limit) * 100, 1) if limit else 0
    return {"used": int(used), "limit": limit, "percent": percent}


def _for_model(turns: list[tuple[str, str]]) -> list[tuple[str, str]]:
    usable = []
    for role, text in turns:
        if role != "user" and (text.startswith("[mock]") or text.startswith("You said:")):
            continue
        usable.append((role, text))
    return usable


def _estimate(turns: list[tuple[str, str]]) -> int:
    return sum(len(text) for _, text in turns) // 4


def _trim(turns: list[tuple[str, str]], limit: int) -> list[tuple[str, str]]:
    kept = list(turns)
    if not kept or _estimate(kept) <= int(limit * 0.7):
        return kept
    target = int(limit * 0.6)
    while len(kept) > 1 and _estimate(kept) > target:
        kept.pop(0)
    while len(kept) > 1 and kept[0][0] != "user":
        kept.pop(0)
    return kept or [turns[-1]]


def _messages(turns: list[tuple[str, str]]) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
    for role, text in turns:
        messages.append({"role": "user" if role == "user" else "assistant", "content": text})
    return messages


def generate_reply(turns: list[tuple[str, str]]) -> tuple[str, dict]:
    if not turns:
        raise GroqError("Message is required")

    api_key = (os.getenv("GROQ_API_KEY") or "").strip()

    if not api_key:
        last_user = ""
        for role, text in reversed(turns):
            if role == "user":
                last_user = (text or "").strip()
                break
        if not last_user:
            last_user = "hello"

        reply = f"[mock] You said: {last_user}"
        usage = usage_from_tokens(max(len(reply), 32))
        return reply, usage

    limit = input_token_limit()
    kept = _trim(_for_model(turns), limit)
    response = None
    for attempt in range(2):
        try:
            response = _client_or_raise().chat.completions.create(
                model=MODEL,
                messages=_messages(kept),
                max_tokens=MAX_OUTPUT_TOKENS,
                temperature=0.7,
            )
            break
        except Exception as error:
            status = getattr(error, "status_code", None)
            busy = status in (429, 500, 502, 503)
            if busy and attempt == 0:
                time.sleep(1.5)
                continue
            if busy:
                raise GroqError("Groq is busy right now. Try again in a moment.") from error
            detail = getattr(error, "message", None) or str(error) or "Groq request failed"
            raise GroqError(detail) from error

    choice = response.choices[0] if response.choices else None
    reply = ((choice.message.content if choice and choice.message else None) or "").strip()
    if not reply:
        raise GroqError("Groq returned no reply")

    usage = response.usage
    prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0)
    answer_tokens = int(getattr(usage, "completion_tokens", 0) or 0)
    return reply, usage_from_tokens(prompt_tokens + answer_tokens)
