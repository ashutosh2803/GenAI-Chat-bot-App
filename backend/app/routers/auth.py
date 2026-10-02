import os

from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import User
from app.security import hash_password, sign_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterBody(BaseModel):
    name: str = ""
    email: str
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


class GoogleBody(BaseModel):
    credential: str = Field(min_length=1)


def public_user(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name or "",
        "provider": user.provider,
    }


def auth_response(user: User) -> dict:
    try:
        token = sign_token(str(user.id))
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    return {"token": token, "user": public_user(user)}


@router.post("/register", status_code=201)
def register(body: RegisterBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    password = body.password
    name = body.name.strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        message = (
            "This email is already registered with Google. Continue with Google."
            if existing.provider == "google" and not existing.password_hash
            else "An account with this email already exists. Sign in instead."
        )
        raise HTTPException(status_code=409, detail=message)

    user = User(email=email, name=name, password_hash=hash_password(password), provider="password")
    db.add(user)
    db.commit()
    db.refresh(user)
    return auth_response(user)


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    password = body.password
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.scalar(select(User).where(User.email == email))
    if user is None or not user.password_hash:
        message = "This account uses Google. Continue with Google." if user else "Email or password is incorrect"
        raise HTTPException(status_code=401, detail=message)
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return auth_response(user)


@router.post("/google")
def google_sign_in(body: GoogleBody, db: Session = Depends(get_db)):
    client_id = (os.getenv("GOOGLE_CLIENT_ID") or "").strip()
    if not client_id:
        raise HTTPException(
            status_code=503,
            detail="Set GOOGLE_CLIENT_ID in backend/.env to the same Web client ID as the frontend, then restart the backend.",
        )

    try:
        payload = id_token.verify_oauth2_token(body.credential, google_requests.Request(), client_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Google sign-in could not be verified")

    email = (payload.get("email") or "").lower()
    google_id = payload.get("sub")
    if not email or not google_id:
        raise HTTPException(status_code=400, detail="Google account did not include an email")

    name = payload.get("name") or payload.get("given_name") or ""
    user = db.scalar(select(User).where((User.google_id == google_id) | (User.email == email)))
    if user is None:
        user = User(email=email, name=name, google_id=google_id, provider="google")
        db.add(user)
    else:
        if not user.google_id:
            user.google_id = google_id
        if name and not user.name:
            user.name = name

    db.commit()
    db.refresh(user)
    return auth_response(user)
