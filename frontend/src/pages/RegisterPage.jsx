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

export default function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    if (!trimmedEmail || !password.trim()) return;

    if (password !== confirmPassword) {
      setMismatch(true);
      return;
    }

    setMismatch(false);
    signIn({
      email: trimmedEmail,
      name: trimmedName,
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
            <Typography variant="h5">Create account</Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            Frontend capture only — nothing is sent to the backend yet.
          </Typography>
          <TextField
            label="Name"
            autoComplete="name"
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
          <Button type="submit" variant="contained" size="large">
            Register
          </Button>
          <Divider>or</Divider>
          <GoogleSignInButton />
          <Typography variant="body2" textAlign="center">
            Already have an account?{" "}
            <Link component={RouterLink} to="/login">
              Sign in
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
