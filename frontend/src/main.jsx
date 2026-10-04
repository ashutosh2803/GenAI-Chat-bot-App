import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { GOOGLE_CLIENT_ID } from "./auth/google.js";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { lightTheme, darkTheme } from "./theme.js";
import { ThemeProvider, useTheme } from "./theme/ThemeContext.jsx";
import "./index.css";

function AppWrapper() {
  const { isDarkMode } = useTheme();
  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "placeholder.apps.googleusercontent.com"}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </MuiThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper />
    </ThemeProvider>
  </StrictMode>
);
