import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { loginAccount } from "../api";
import { useAuth } from "../auth/AuthContext";
import GoogleSignInButton from "../auth/GoogleSignInButton";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;

    setPending(true);
    setError("");
    try {
      const session = await loginAccount({ email: trimmedEmail, password });
      signIn(session);
      navigate("/");
    } catch (err) {
      setError(err.message || "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper sx={{ width: "100%", maxWidth: 420, p: 4 }} elevation={3}>
        <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SmartToyIcon color="primary" />
            <Typography variant="h5">Sign in</Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            Chat is open without an account. Sign in to keep going after 3 messages.
          </Typography>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button type="submit" variant="contained" size="large" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <Divider>or</Divider>
          <GoogleSignInButton />
          <Typography variant="body2" textAlign="center">
            New here?{" "}
            <Link component={RouterLink} to="/register">
              Create an account
            </Link>
          </Typography>
          <Link component={RouterLink} to="/" variant="body2" textAlign="center">
            Back to chat
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
}
