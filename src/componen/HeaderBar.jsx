// src/componen/HeaderBar.jsx
import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, TextField, IconButton,
  Slider, Popover, Stack, Button, Box, InputAdornment
} from "@mui/material";
import { Search, VolumeUp, VolumeOff, Logout } from "@mui/icons-material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


export default function HeaderBar({
  search,
  setSearch,
  username,
  soundEnabled,
  setSoundEnabled,
  volume,
  setVolume
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);
const navigate = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("rememberMe");
  toast.info("Anda telah logout!");
  navigate("/login");
};


  return (
    <AppBar position="sticky" sx={{ background: "#2563eb", boxShadow: 2 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        
        {/* Judul */}
        <Typography variant="h6" fontWeight={700}>
          Monitoring Tugas
        </Typography>

        {/* Pencarian */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Cari tugas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: "gray" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            background: "white",
            borderRadius: 1,
            width: { xs: "100%", sm: 250 },
          }}
        />

        {/* Profil dan Kontrol */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" sx={{ color: "white", fontWeight: 500 }}>
            Hi, {username}
          </Typography>

          {/* Tombol Volume */}
          <IconButton onClick={handleOpen} sx={{ color: "white" }}>
            {soundEnabled ? <VolumeUp /> : <VolumeOff />}
          </IconButton>

          {/* Tombol Logout */}
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{
              borderColor: "white",
              color: "white",
              textTransform: "none",
              "&:hover": { background: "rgba(255,255,255,0.1)" },
            }}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>

      {/* Popup Pengaturan Suara */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ p: 2, width: 220 }}>
          <Typography variant="body2" fontWeight={700} mb={1}>
            Pengaturan Suara
          </Typography>

          <Stack spacing={1}>
            <Typography variant="caption">Volume</Typography>
            <Slider
              value={volume}
              onChange={(e, v) => setVolume(v)}
              min={0}
              max={1}
              step={0.05}
            />

            <Button
              variant="contained"
              color={soundEnabled ? "success" : "error"}
              onClick={() => setSoundEnabled(!soundEnabled)}
              sx={{ textTransform: "none" }}
            >
              {soundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
            </Button>
          </Stack>
        </Box>
      </Popover>
    </AppBar>
  );
}
