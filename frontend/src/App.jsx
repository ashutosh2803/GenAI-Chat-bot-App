import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "./api";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isWaiting]);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isWaiting) {
      return;
    }

    const userMessage = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsWaiting(true);

    try {
      const reply = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "error",
          text: error.message || "Something went wrong. Is the backend running?",
        },
      ]);
    } finally {
      setIsWaiting(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>GenAI Chat-bot</h1>
        <p>Milestone 1 — mock replies (no API key)</p>
      </header>

      <main className="messages" ref={listRef}>
        {messages.length === 0 && !isWaiting ? (
          <p className="empty">Send a message to start chatting.</p>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={`bubble ${message.role}`}>
            <span className="label">
              {message.role === "user"
                ? "You"
                : message.role === "error"
                  ? "Error"
                  : "Assistant"}
            </span>
            <p>{message.text}</p>
          </div>
        ))}

        {isWaiting ? (
          <div className="bubble assistant typing">
            <span className="label">Assistant</span>
            <p>Assistant is typing…</p>
          </div>
        ) : null}
      </main>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a message"
          disabled={isWaiting}
          aria-label="Message"
        />
        <button type="submit" disabled={isWaiting || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
