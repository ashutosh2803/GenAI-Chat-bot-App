import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS") or "1536")

db_ready = False
db_error = ""

engine = None
SessionLocal = None


class Base(DeclarativeBase):
    pass


def init_db() -> bool:
    global engine, SessionLocal, db_ready, db_error

    if not DATABASE_URL:
        db_ready = False
        db_error = "DATABASE_URL is missing in backend/.env"
        print(db_error)
        return False

    try:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 5},
        )
        with engine.connect() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            connection.commit()

        from app import models  # noqa: F401

        Base.metadata.create_all(engine)
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        db_ready = True
        db_error = ""
        print("Connected to PostgreSQL")
        return True
    except Exception as error:
        db_ready = False
        db_error = str(error).splitlines()[0]
        print(f"PostgreSQL connection failed: {db_error}")
        return False
