import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.deps import get_current_user, get_db
from app.models import Conversation, Message, User

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class MessageBody(BaseModel):
    message: str


def title_from_text(text: str) -> str:
    trimmed = " ".join(text.split())
    return f"{trimmed[:48]}…" if len(trimmed) > 48 else trimmed


def map_message(message: Message) -> dict:
    return {
        "id": str(message.id),
        "role": message.role,
        "text": message.text,
        "createdAt": message.created_at.isoformat() if message.created_at else None,
    }


def map_conversation(conversation: Conversation, include_messages: bool) -> dict:
    payload = {
        "id": str(conversation.id),
        "title": conversation.title,
        "updatedAt": conversation.updated_at.isoformat() if conversation.updated_at else None,
    }
    if include_messages:
        payload["messages"] = [map_message(message) for message in conversation.messages]
    return payload


def add_exchange(conversation: Conversation, message: str) -> str:
    reply = f"[mock] You said: {message}"
    conversation.messages.append(Message(role="user", text=message))
    conversation.messages.append(Message(role="assistant", text=reply))
    if conversation.title == "New chat":
        conversation.title = title_from_text(message)
    conversation.updated_at = datetime.now(timezone.utc)
    return reply


@router.get("")
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = db.scalars(
        select(Conversation).where(Conversation.user_id == user.id).order_by(Conversation.updated_at.desc())
    ).all()
    return {"conversations": [map_conversation(item, False) for item in conversations]}


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = load_owned(db, user, conversation_id)
    return {"conversation": map_conversation(conversation, True)}


@router.post("", status_code=201)
def start_conversation(
    body: MessageBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    conversation = Conversation(user_id=user.id, title=title_from_text(message))
    reply = add_exchange(conversation, message)
    conversation.title = title_from_text(message)
    db.add(conversation)
    db.commit()
    conversation = load_owned(db, user, str(conversation.id))
    return {"conversation": map_conversation(conversation, True), "reply": reply}


@router.post("/{conversation_id}/messages")
def append_message(
    conversation_id: str,
    body: MessageBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    conversation = load_owned(db, user, conversation_id)
    reply = add_exchange(conversation, message)
    db.commit()
    conversation = load_owned(db, user, conversation_id)
    return {"conversation": map_conversation(conversation, True), "reply": reply}


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = load_owned(db, user, conversation_id)
    db.delete(conversation)
    db.commit()
    return {"ok": True}


def load_owned(db: Session, user: User, conversation_id: str) -> Conversation:
    try:
        parsed_id = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")

    conversation = db.scalar(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == parsed_id, Conversation.user_id == user.id)
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation
