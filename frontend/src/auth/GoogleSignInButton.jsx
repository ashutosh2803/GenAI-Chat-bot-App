import { useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { decodeJwtPayload, GOOGLE_CLIENT_ID } from "./google";

export default function GoogleSignInButton() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function handlePlaceholderClick() {
    setError("Set VITE_GOOGLE_CLIENT_ID in frontend/.env, then restart the Vite server.");
  }

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Box>
        <Button fullWidth variant="outlined" onClick={handlePlaceholderClick}>
          Continue with Google
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
        onSuccess={(response) => {
          const payload = decodeJwtPayload(response.credential);
          signIn({
            email: payload.email || "google-user@example.com",
            name: payload.name || payload.given_name || "",
            provider: "google",
          });
          navigate("/");
        }}
        onError={() => {
          setError("Google sign-in was cancelled or failed.");
        }}
      />
      {error ? (
        <Alert severity="error" sx={{ mt: 1.5, width: "100%" }}>
          {error}
        </Alert>
      ) : null}
    </Box>
  );
}
