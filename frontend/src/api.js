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
    "Could not reach the backend. Start it with npm run dev in the backend folder."
  );
}

function getApiBaseUrl() {
  if (!apiBaseUrlPromise) {
    apiBaseUrlPromise = resolveApiBaseUrl();
  }
  return apiBaseUrlPromise;
}

export async function sendChatMessage(message) {
  const apiUrl = await getApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to get a reply");
  }

  return data.reply;
}
