import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
    secondary: { main: "#00897b" },
    background: { default: "#e8eef5", paper: "#ffffff" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", sans-serif',
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1e88e5" },
    secondary: { main: "#26a69a" },
    background: { default: "#121212", paper: "#1e1e1e" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", sans-serif',
  },
});

export default lightTheme;