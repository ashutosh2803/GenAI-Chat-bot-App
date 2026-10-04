# Local setup

Chat UI: http://localhost:5173  
API health: http://localhost:8000/health — expect `{"status":"ok","database":"connected"}`

A working guest send returns a short reply from Groq.

## 1. Prerequisites

| Tool | Required | This machine |
| --- | --- | --- |
| Python | 3.9+ | 3.9.13 |
| Node.js | 18+ | v22.18.0 |
| npm | with Node | 10.8.2 |
| Docker | Postgres | 29.8.1 |

Check with:

```powershell
python --version
node -v
npm -v
docker --version
```

Python 3.9 is past end of life. Google Auth prints a warning on startup. The app still runs. Upgrade Python later to clear that warning.

## 2. Database

Use the official pgvector image. It matches `DATABASE_URL` in `backend/.env.example` (user `postgres`, password `postgres`, database `genai_chat`, port 5432).

```powershell
docker run -d --name genai-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=genai_chat -p 5432:5432 pgvector/pgvector:pg16
```

Start it again later with `docker start genai-postgres`.

## 3. Environment files

Copy the examples once. `.env` is gitignored. Do not commit it.

```powershell
cd backend
copy .env.example .env
cd ..\frontend
copy .env.example .env
```

`backend/.env` needs:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/genai_chat
JWT_SECRET=dev-only-change-this-secret
GOOGLE_CLIENT_ID=
EMBEDDING_DIMENSIONS=1536
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MAX_OUTPUT_TOKENS=1024
GROQ_CONTEXT_LIMIT=128000
```

`frontend/.env` needs:

```env
VITE_GOOGLE_CLIENT_ID=
```

Google sign-in is optional. Email and password work with both client ID values empty. On this machine both files already share the same Google Web client ID. Restart Vite and the backend after any `.env` change. Change `JWT_SECRET` before sharing the app.

## 4. Install dependencies

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If `.venv` already exists, skip `python -m venv` and run:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Frontend:

```powershell
cd frontend
npm install
```

## 5. Run

Use two terminals. Start the backend first.

Backend (default port 8000):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python run.py
```

If 8000 is busy, the server tries 8001 through 8020. Use the URL printed in the terminal.

Frontend (default port 5173):

```powershell
cd frontend
npm run dev
```

If 5173 is busy, Vite prints the next free port. Open that URL.

## 6. Try it

- Type a message and press Send or Enter.
- A guest can send 3 messages. The next send is blocked until Login or Register.
- Register needs a password of at least 6 characters. Accounts and signed-in chats are stored in PostgreSQL.
- Log out clears the browser session token.
