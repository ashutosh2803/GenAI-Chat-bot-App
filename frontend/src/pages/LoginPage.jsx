import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
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
import { useAuth } from "../auth/AuthContext";
import GoogleSignInButton from "../auth/GoogleSignInButton";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) return;

    signIn({
      email: trimmedEmail,
      name: "",
      provider: "password",
    });
    navigate("/");
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
          <Button type="submit" variant="contained" size="large">
            Sign in
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
