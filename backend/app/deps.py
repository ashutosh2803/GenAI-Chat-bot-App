import uuid
from typing import Optional

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app import database
from app.models import User
from app.security import read_user_id

bearer = HTTPBearer(auto_error=False)


def get_db():
    if not database.db_ready or database.SessionLocal is None:
        detail = f" ({database.db_error})" if database.db_error else ""
        raise HTTPException(
            status_code=503,
            detail=f"Database is not connected. Set DATABASE_URL in backend/.env and restart the backend{detail}.",
        )

    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Sign in required")

    try:
        user_id = uuid.UUID(read_user_id(credentials.credentials))
    except (jwt.PyJWTError, RuntimeError, ValueError):
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.")
    return user
