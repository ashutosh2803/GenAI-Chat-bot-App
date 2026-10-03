const DEFAULT_API_PORT = 8000;
const MAX_API_PORT = DEFAULT_API_PORT + 20;

let apiBaseUrlPromise;

async function resolveApiBaseUrl() {
  for (let port = DEFAULT_API_PORT; port <= MAX_API_PORT; port += 1) {
    const baseUrl = `http://localhost:${port}`;
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return baseUrl;
      }
    } catch {
      // Port not serving this API; try the next one.
    }
  }

  throw new Error(
    "Could not reach the backend. Start it with python run.py in the backend folder."
  );
}

function getApiBaseUrl() {
  if (!apiBaseUrlPromise) {
    apiBaseUrlPromise = resolveApiBaseUrl();
  }
  return apiBaseUrlPromise;
}

async function request(path, { method = "GET", body, token } = {}) {
  const apiUrl = await getApiBaseUrl();
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function sendChatMessage(message) {
  const data = await request("/api/chat", { method: "POST", body: { message } });
  return data.reply;
}

export function registerAccount({ name, email, password }) {
  return request("/api/auth/register", { method: "POST", body: { name, email, password } });
}

export function loginAccount({ email, password }) {
  return request("/api/auth/login", { method: "POST", body: { email, password } });
}

export function loginWithGoogle(credential) {
  return request("/api/auth/google", { method: "POST", body: { credential } });
}

export function listConversations(token) {
  return request("/api/conversations", { token });
}

export function getConversation(token, id) {
  return request(`/api/conversations/${id}`, { token });
}

export function startConversation(token, message) {
  return request("/api/conversations", { method: "POST", token, body: { message } });
}

export function appendConversationMessage(token, id, message) {
  return request(`/api/conversations/${id}/messages`, { method: "POST", token, body: { message } });
}

export function deleteConversation(token, id) {
  return request(`/api/conversations/${id}`, { method: "DELETE", token });
}
