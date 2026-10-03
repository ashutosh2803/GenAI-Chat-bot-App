import { useEffect, useState } from "react";
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
import { registerAccount } from "../api";
import { useAuth } from "../auth/AuthContext";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import { isAltLetter, isClearShortcut } from "../keyboard";

export default function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function onKeyDown(event) {
      if (isClearShortcut(event)) {
        event.preventDefault();
        navigate("/");
        return;
      }
      if (isAltLetter(event, "l")) {
        event.preventDefault();
        navigate("/login");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    if (!trimmedEmail || !password) return;

    if (password !== confirmPassword) {
      setMismatch(true);
      return;
    }

    setMismatch(false);
    setPending(true);
    setError("");
    try {
      const session = await registerAccount({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      signIn(session);
      navigate("/");
    } catch (err) {
      setError(err.message || "Could not create the account");
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
            <Typography variant="h5">Create account</Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            Email sign-up and Google both create an account saved in the database.
          </Typography>
          <TextField
            label="Name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={mismatch}
            helperText={mismatch ? "Passwords do not match" : " "}
            required
            fullWidth
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button type="submit" variant="contained" size="large" disabled={pending} aria-keyshortcuts="Enter">
            {pending ? "Creating account…" : "Register"}
          </Button>
          <Divider>or</Divider>
          <GoogleSignInButton label="Sign up with Google" />
          <Typography variant="body2" textAlign="center">
            Already have an account?{" "}
            <Link component={RouterLink} to="/login">
              Sign in
            </Link>
          </Typography>
          <Link component={RouterLink} to="/" variant="body2" textAlign="center">
            Back to chat
          </Link>
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Enter register · Esc back to chat · Alt+L sign in
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
