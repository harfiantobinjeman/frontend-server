import React, { useEffect, useState } from "react";
import { Box, Grid, Card, Typography, LinearProgress } from "@mui/material";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://192.168.11.245:5000");

export default function Monitoring() {
  const [tasks, setTasks] = useState([]);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  const fetchTasks = async () => {
    const res = await axios.get("http://192.168.11.245:5000/api/tasks");
    setTasks(res.data);
  };

  useEffect(() => {
    fetchTasks();
    socket.on("task-update", fetchTasks);
    return () => socket.off("task-update");
  }, []);

  // Deteksi orientasi otomatis
  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const total = tasks.length;
  const selesai = tasks.filter((t) => t.status === "Selesai").length;
  const aktif = total - selesai;
  const progress = total > 0 ? Math.round((selesai / total) * 100) : 0;

  const today = new Date().toISOString().split("T")[0];
  const tugasHariIni = tasks.filter((t) => t.tanggalTugas === today);
  const tugasTerlambat = tasks.filter((t) => t.tanggalTugas < today && t.status !== "Selesai");
  const tugasSelanjutnya = tasks.filter((t) => t.tanggalTugas > today);

  return (
    <Box
      sx={{
        background: "#0B1120",
        width: "100vw",
        height: "100vh",
        color: "white",
        p: isPortrait ? 2 : 4,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant={isPortrait ? "h4" : "h3"}
        fontWeight={700}
        textAlign="center"
        mb={isPortrait ? 2 : 4}
      >
        MONITORING PROGRESS TUGAS
      </Typography>

      {/* Bagian Statistik */}
      <Grid
        container
        spacing={isPortrait ? 2 : 4}
        mb={isPortrait ? 3 : 5}
        direction={isPortrait ? "column" : "row"}
      >
        {[{label:"Total Tugas",val:total},
          {label:"Sedang Berjalan",val:aktif,color:"#FACC15"},
          {label:"Selesai",val:selesai,color:"#4ADE80"}].map((item, i) => (
          <Grid item xs={isPortrait ? 12 : 4} key={i}>
            <Card sx={{ p: isPortrait ? 2 : 3, textAlign: "center", background: "#1E293B" }}>
              <Typography variant={isPortrait ? "h4" : "h3"} fontWeight={700} color={item.color || "white"}>
                {item.val}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.7 }}>{item.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Progress Bar */}
      <Box mb={isPortrait ? 3 : 5}>
        <Typography variant="h6" textAlign="center" mb={1}>
          Progress Penyelesaian: {progress}%
        </Typography>
        <LinearProgress value={progress} variant="determinate"
          sx={{
            height: isPortrait ? 10 : 16,
            borderRadius: 3,
            background: "#334155"
          }}
        />
      </Box>

      {/* Daftar Tugas */}
      <Grid container spacing={isPortrait ? 2 : 3} sx={{ flexGrow: 1 }}
        direction={isPortrait ? "column" : "row"}
      >
        {[
          {title:"HARI INI",data:tugasHariIni},
          {title:"TERLAMBAT",data:tugasTerlambat,color:"#F87171"},
          {title:"MENDATANG",data:tugasSelanjutnya}
        ].map((group, i) => (
          <Grid item xs={isPortrait ? 12 : 4} key={i} sx={{ height:"100%" }}>
            <Card sx={{ p: 2, background: "#1E293B", height: "100%" }}>
              <Typography variant={isPortrait ? "h5" : "h4"} textAlign="center" mb={1}>
                {group.title} ({group.data.length})
              </Typography>
              <Box sx={{ fontSize: isPortrait ? 18 : 22, color: group.color || "white" }}>
                {group.data.length === 0 ? "Tidak ada tugas"
                  : group.data.map((t, idx) => (
                      <Typography key={idx}>• {t.title}</Typography>
                    ))
                }
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
