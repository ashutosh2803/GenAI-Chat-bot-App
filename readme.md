# GenAI Chat-bot App

A simple chat page: you send a message, a mock backend replies. No API key is required for this milestone. The UI uses **Material UI**.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

Check with:

```powershell
node -v
npm -v
```

## How to run

Use two terminals (PowerShell). Start the backend first.

### 1. Backend (default port 8000)

```powershell
cd backend
npm install
npm run dev
```

`npm run dev` uses **nodemon**, which restarts the server when you change backend files. That is the usual Node.js alternative to a Unix daemon while you develop.

To run without auto-restart:

```powershell
npm start
```

Confirm it is up: open [http://localhost:8000/health](http://localhost:8000/health). You should see `{"status":"ok"}`.

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

## Roadmap (not built yet)

- Real LLM (OpenAI, Gemini, or similar)
- Saved conversations / history
- Streaming replies
