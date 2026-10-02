# GenAI Chat-bot App

A chat page with login and register. Guests can send 3 messages. After that, sign in with email and password or Google to keep chatting. Replies are still mock replies from the backend. Accounts and signed-in chats are stored in PostgreSQL. The UI uses **Material UI**.

![Chat page with a mock reply](docs/screenshot.png)

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

## Environment files

Copy both example files. `.env` is gitignored. Do not commit it.

```powershell
cd backend
copy .env.example .env
cd ..\frontend
copy .env.example .env
```

`backend/.env` needs three values:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/genai_chat
JWT_SECRET=dev-only-change-this-secret
GOOGLE_CLIENT_ID=
```

`JWT_SECRET` signs login sessions. Change it before sharing the app.

Google sign-in is optional. Email and password work with `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` left empty. The Google button stays on the page and tells you to fill both in.

To enable Google:

1. In Google Cloud Console, create an OAuth client ID of type **Web application**.
2. Add `http://localhost:5173` as an authorized JavaScript origin. If Vite prints another port, add that origin too.
3. Put the same client ID in both files, then restart Vite and the backend:

- `frontend/.env` → `VITE_GOOGLE_CLIENT_ID`
- `backend/.env` → `GOOGLE_CLIENT_ID`

## Database

Accounts, chats, and a placeholder for embeddings share one **PostgreSQL** database. SQLAlchemy creates `users`, `conversations`, and `messages`. Each message has a nullable `embedding` column (`pgvector`) so retrieval can be added later without a second database. Nothing writes embeddings yet.

The simplest setup is the official pgvector image, which already includes the extension:

```powershell
docker run -d --name genai-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=genai_chat -p 5432:5432 pgvector/pgvector:pg16
```

That matches the `DATABASE_URL` in `backend/.env.example`.

To use PostgreSQL installed on Windows instead:

1. Install PostgreSQL 16 and the pgvector extension.
2. Create a database named `genai_chat`.
3. Put your user, password, and host in `DATABASE_URL` in `backend/.env`.

Restart the backend. [http://localhost:8000/health](http://localhost:8000/health) should show `"database":"connected"`. If the extension or the database is missing, the health check stays `disconnected` and the server log names the error. Guest chat still works. Sign-in and saved chats do not.

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

Restart the frontend after you change `frontend/.env`.

## How to try it

Type a message and press **Send** (or Enter). After a short pause you should get a reply like:

`[mock] You said: hello`

A guest can send 3 messages. The next send is blocked until you use **Login** or **Register**.

**Register** stores the account in PostgreSQL (password at least 6 characters). The browser only keeps the session token. After sign-in, chats are saved and listed under **New chat**. **Log out** clears that session.

The first Google sign-in creates the user. Later sign-ins use that same account. An email already used with Google cannot register a password on top of it.

If the backend is not running, the page shows an error bubble instead.

## Roadmap (not built yet)

- Real LLM (OpenAI, Gemini, or similar)
- Writing and searching message embeddings
- Streaming replies
