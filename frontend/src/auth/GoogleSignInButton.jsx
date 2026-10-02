import { useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../api";
import { useAuth } from "./AuthContext";
import { GOOGLE_CLIENT_ID } from "./google";

export default function GoogleSignInButton({ label = "Continue with Google" }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function handlePlaceholderClick() {
    setError("Set VITE_GOOGLE_CLIENT_ID in frontend/.env and GOOGLE_CLIENT_ID in backend/.env, then restart both servers.");
  }

  async function handleSuccess(response) {
    setError("");
    setPending(true);
    try {
      const session = await loginWithGoogle(response.credential);
      signIn(session);
      navigate("/");
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Box>
        <Button fullWidth variant="outlined" onClick={handlePlaceholderClick} disabled={pending}>
          {label}
        </Button>
        {error ? (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        ) : null}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          setError("Google sign-in was cancelled or failed.");
        }}
        text={label.toLowerCase().includes("sign up") ? "signup_with" : "continue_with"}
      />
      {error ? (
        <Alert severity="error" sx={{ mt: 1.5, width: "100%" }}>
          {error}
        </Alert>
      ) : null}
    </Box>
  );
}
