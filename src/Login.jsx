import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [checking, setChecking] = useState(true); // 👈 tambahkan ini

  // 🔐 Cek apakah user sudah login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (token && isLoggedIn === "true") {
      navigate("/"); // langsung ke dashboard
    } else {
      setChecking(false); // selesai cek, tampilkan form login
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://192.168.11.245:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Login gagal!");
        return;
      }

      // ✅ Simpan data login
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("isLoggedIn", "true");

      if (remember) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      toast.success(`Selamat datang, ${data.user.username}!`);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi ke server!");
    }
  };

  // 🕓 Jika masih mengecek status login → tampilkan loading
  if (checking) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #eef2ff, #f9fafb)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ✅ Jika tidak login → tampilkan form
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #eef2ff, #f9fafb)",
      }}
    >
      <Card
        sx={{
          width: 350,
          p: 3,
          borderRadius: "20px",
          boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent>
          <Typography variant="h5" align="center" fontWeight={700} mb={3}>
            🔐 Login
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((prev) => !prev)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
              }
              label="Ingat saya"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
