# GenAI Chat-bot App

A simple chat page: you send a message, a mock backend replies. No API key is required for this milestone. The UI uses **Material UI**.

## Prerequisites

- Python 3.9 or higher (backend)
- Node.js 18 or higher and npm (frontend)
- PostgreSQL with the pgvector extension

Check with:

```powershell
python --version
node -v
npm -v
```

## How to run

Use two terminals (PowerShell). Start the backend first.

### 1. Backend (default port 8000)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

`python run.py` starts FastAPI with auto-reload. Confirm it is up: open [http://localhost:8000/health](http://localhost:8000/health). You should see `{"status":"ok","database":"connected"}` once PostgreSQL is running.

If 8000 is already in use, the server tries 8001, then 8002, and so on (up to 8020). Check the terminal for the URL it actually used. The chat page looks up `/health` on those ports, so it still finds the API.

### 2. Frontend (default port 5173)

```powershell
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173). If 5173 is taken, Vite prints the next free port (5174, 5175, …) in the terminal. Use that URL instead.

## How to try it

Type a message and press **Send** (or Enter). After a short pause you should get a reply like:

`[mock] You said: hello`

If the backend is not running, the page shows an error bubble instead.

## Database

Accounts, chats, and future embeddings share one **PostgreSQL** database. SQLAlchemy creates `users`, `conversations`, and `messages`. Each message has a nullable `embedding` column (`pgvector`) so retrieval can be added later without a second database.

### Enable it

The simplest setup is the official pgvector image, which already includes the extension:

```powershell
docker run -d --name genai-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=genai_chat -p 5432:5432 pgvector/pgvector:pg16
```

`backend/.env` already points at `postgresql+psycopg://postgres:postgres@localhost:5432/genai_chat`.

To use PostgreSQL installed on Windows instead:

1. Install PostgreSQL 16 and the pgvector extension.
2. Create a database named `genai_chat`.
3. Put your user, password, and host in `DATABASE_URL` in `backend/.env`.

Restart the backend. [http://localhost:8000/health](http://localhost:8000/health) should show `"database":"connected"`. If the extension is missing, the health check stays `disconnected` and the server log names the error.

### Google sign-up

Put the same Web client ID in both places, then restart Vite and the backend:

- `frontend/.env` → `VITE_GOOGLE_CLIENT_ID`
- `backend/.env` → `GOOGLE_CLIENT_ID`

The first Google sign-in creates the user. Later sign-ins use that same account. Signed-in chats are saved and listed under **New chat**.

## Roadmap (not built yet)

- Real LLM (OpenAI, Gemini, or similar)
- Streaming replies
