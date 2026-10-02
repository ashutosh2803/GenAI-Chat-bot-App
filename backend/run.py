import os
import socket
import sys
from pathlib import Path


def use_project_venv():
    try:
        import uvicorn  # noqa: F401
        return
    except ModuleNotFoundError:
        pass

    if sys.platform == "win32":
        venv_python = Path(__file__).resolve().parent / ".venv" / "Scripts" / "python.exe"
    else:
        venv_python = Path(__file__).resolve().parent / ".venv" / "bin" / "python"

    current = Path(sys.executable)
    try:
        already_using_venv = current.resolve() == venv_python.resolve()
    except OSError:
        already_using_venv = False

    if venv_python.exists() and not already_using_venv:
        os.execv(str(venv_python), [str(venv_python), str(Path(__file__).resolve()), *sys.argv[1:]])

    raise SystemExit(
        "uvicorn is not installed for this Python. From the backend folder run:\n"
        "python -m venv .venv\n"
        ".\\.venv\\Scripts\\Activate.ps1\n"
        "pip install -r requirements.txt"
    )


def free_port(start: int = 8000, end: int = 8020) -> int:
    for port in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    raise SystemExit(f"No free port found between {start} and {end}.")


if __name__ == "__main__":
    use_project_venv()
    import uvicorn

    port = free_port()
    if port != 8000:
        print(f"Port 8000 was in use. Using port {port} instead.")
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=True)
