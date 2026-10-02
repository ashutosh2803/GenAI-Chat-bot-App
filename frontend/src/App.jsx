import { useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { sendChatMessage, listConversations, getConversation, startConversation, appendConversationMessage } from "./api";
import { useAuth } from "./auth/AuthContext";

const GUEST_MESSAGE_LIMIT = 3;
const GUEST_COUNT_KEY = "genai-guest-user-messages";

function readGuestCount() {
  const raw = Number(sessionStorage.getItem(GUEST_COUNT_KEY) || "0");
  return Number.isFinite(raw) ? raw : 0;
}

function MessageRow({ role, text, typing = false }) {
  const isUser = role === "user";
  const isError = role === "error";

  return (
    <Stack
      direction="row"
      spacing={1.5}
      justifyContent={isUser ? "flex-end" : "flex-start"}
      alignItems="flex-end"
    >
      {!isUser ? (
        <Avatar sx={{ bgcolor: isError ? "error.main" : "secondary.main" }}>
          <SmartToyIcon />
        </Avatar>
      ) : null}

      {isError ? (
        <Alert severity="error" sx={{ maxWidth: "75%" }}>
          {text}
        </Alert>
      ) : (
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.25,
            maxWidth: "75%",
            bgcolor: isUser ? "primary.main" : "grey.100",
            color: isUser ? "primary.contrastText" : "text.primary",
          }}
        >
          {typing ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2">Assistant is typing…</Typography>
            </Stack>
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {text}
            </Typography>
          )}
        </Paper>
      )}

      {isUser ? (
        <Avatar sx={{ bgcolor: "primary.main" }}>
          <PersonIcon />
        </Avatar>
      ) : null}
    </Stack>
  );
}

function App() {
  const { user, signOut } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [guestUserCount, setGuestUserCount] = useState(readGuestCount);
  const listRef = useRef(null);
  const guestLimitReached = !user && guestUserCount >= GUEST_MESSAGE_LIMIT;

  useEffect(() => {
    if (!user?.token) {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      try {
        const { conversations: list } = await listConversations(user.token);
        if (cancelled) return;
        setConversations(list);
        if (!list[0]) {
          setActiveConversationId(null);
          setMessages([]);
          return;
        }
        const { conversation } = await getConversation(user.token, list[0].id);
        if (cancelled) return;
        setActiveConversationId(conversation.id);
        setMessages(conversation.messages);
      } catch (error) {
        if (error.status === 401) signOut();
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user, signOut]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isWaiting]);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isWaiting || guestLimitReached) return;

    if (!user) {
      const nextCount = guestUserCount + 1;
      setGuestUserCount(nextCount);
      sessionStorage.setItem(GUEST_COUNT_KEY, String(nextCount));
    }

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    setIsWaiting(true);

    try {
      if (user) {
        const data = activeConversationId
          ? await appendConversationMessage(user.token, activeConversationId, text)
          : await startConversation(user.token, text);
        setActiveConversationId(data.conversation.id);
        setMessages(data.conversation.messages);
        setConversations((prev) => [
          {
            id: data.conversation.id,
            title: data.conversation.title,
            updatedAt: data.conversation.updatedAt,
          },
          ...prev.filter((item) => item.id !== data.conversation.id),
        ]);
      } else {
        const reply = await sendChatMessage(text);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text: reply },
        ]);
      }
    } catch (error) {
      if (error.status === 401) signOut();
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
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" elevation={1}>
        <Toolbar sx={{ py: 1.25, gap: 1, minHeight: 72 }}>
          <SmartToyIcon sx={{ mr: 1.5 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">GenAI Chat-bot</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Milestone 1 — mock replies
            </Typography>
          </Box>
          <Chip label="Mock" color="secondary" size="small" />
          {user ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={user.email} size="small" variant="outlined" sx={{ color: "inherit", borderColor: "rgba(255,255,255,0.5)" }} />
              <Button color="inherit" size="small" onClick={signOut}>
                Log out
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register" variant="outlined">
                Register
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{ flex: 1, py: 2, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, minHeight: 0 }}
      >
        {user ? (
          <Paper
            elevation={2}
            sx={{
              width: { xs: "100%", md: 240 },
              maxHeight: { xs: 160, md: "none" },
              overflowY: "auto",
              p: 1.5,
              flexShrink: 0,
            }}
          >
            <Button
              fullWidth
              variant="contained"
              sx={{ mb: 1 }}
              onClick={() => {
                setActiveConversationId(null);
                setMessages([]);
              }}
            >
              New chat
            </Button>
            <Stack spacing={0.5}>
              {conversations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Saved chats show up here.
                </Typography>
              ) : (
                conversations.map((conversation) => (
                  <Button
                    key={conversation.id}
                    fullWidth
                    size="small"
                    variant={conversation.id === activeConversationId ? "contained" : "text"}
                    sx={{ justifyContent: "flex-start", textTransform: "none" }}
                    onClick={async () => {
                      try {
                        const { conversation: loaded } = await getConversation(user.token, conversation.id);
                        setActiveConversationId(loaded.id);
                        setMessages(loaded.messages);
                      } catch (error) {
                        if (error.status === 401) signOut();
                      }
                    }}
                  >
                    {conversation.title}
                  </Button>
                ))
              )}
            </Stack>
          </Paper>
        ) : null}
        <Paper
          elevation={2}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            ref={listRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.length === 0 && !isWaiting ? (
              <Box sx={{ m: "auto", textAlign: "center" }}>
                <SmartToyIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                <Typography color="text.secondary">
                  Send a message to start chatting.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {messages.map((message) => (
                  <MessageRow key={message.id} role={message.role} text={message.text} />
                ))}
                {isWaiting ? <MessageRow role="assistant" typing /> : null}
              </Stack>
            )}
          </Box>

          {guestLimitReached ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(255, 255, 255, 0.82)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
                zIndex: 1,
              }}
            >
              <Paper elevation={4} sx={{ p: 3, maxWidth: 360, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>
                  Continue chatting
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Guests can send {GUEST_MESSAGE_LIMIT} messages. Sign in or create an account to keep going.
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button component={RouterLink} to="/login" variant="contained">
                    Login
                  </Button>
                  <Button component={RouterLink} to="/register" variant="outlined">
                    Register
                  </Button>
                </Stack>
              </Paper>
            </Box>
          ) : null}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ p: 2, borderTop: 1, borderColor: "divider" }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                size="small"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message"
                disabled={isWaiting || guestLimitReached}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <IconButton
                type="submit"
                color="primary"
                disabled={isWaiting || guestLimitReached || !input.trim()}
                aria-label="Send"
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
