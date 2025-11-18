import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Stack,
  Paper,
  Button,
  Pagination,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import io from "socket.io-client";
import ExcelJS from "exceljs";
import { useNavigate } from "react-router-dom";
import TaskCard from "../componen/TaskCard";
import StatCard from "../componen/StatCard";
import ProgressOverview from "../componen/ProgressOverview";
import HeaderBar from "../componen/HeaderBar";
import { LocalizationProvider } from "@mui/x-date-pickers-pro";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";

const API_BASE = "http://192.168.11.245:5000";
const SOCKET_URL = "http://192.168.11.245:5000";
const tasksPerPage = 12;

export default function TaskListPage() {
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);

  const infoSound = useRef(new Audio("/sounds/info.mp3"));
  const successSound = useRef(new Audio("/sounds/success.mp3"));
  const errorSound = useRef(new Audio("/sounds/error.mp3"));

  useEffect(() => {
    infoSound.current.volume = volume;
    successSound.current.volume = volume;
    errorSound.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!username) navigate("/login");
  }, [username, navigate]);

  // ===== Sorting & Load Tasks =====
  const sortTasks = (list) => {
    const order = { "Sedang Dikerjakan": 1, "Menunggu": 2, "Selesai": 3, "Ditolak": 4 };
    return (list || [])
      .filter(Boolean)
      .sort((a, b) => (order[a.status] || 99) - (order[b.status] || 99));
  };

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      const data = await res.json();
      setTasks(sortTasks(data));
    } catch (err) {
      toast.error("Gagal memuat data tugas!");
    }
  };

  useEffect(() => {
    loadTasks();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("taskAdded", (task) => {
      if (!task) return;
      setTasks((prev) => sortTasks([...prev.filter(Boolean), task]));
      if (soundEnabled) infoSound.current.play();
    });

    socket.on("taskUpdated", (task) => {
      if (!task || !task.id) return;
      setTasks((prev) =>
        sortTasks(prev.map((t) => (t.id === task.id ? task : t)).filter(Boolean))
      );
      if (soundEnabled)
        (task.status === "Ditolak" ? errorSound : successSound).current.play();
    });

    return () => socket.disconnect();
  }, [soundEnabled]);

  // ===== Status Change =====
  const handleStatusChange = async (id, status, username, fotoAfterFile, keteranganTugas = "") => {
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("username", username);

      if (status === "Selesai") {
        if (!fotoAfterFile) return toast.error("Foto sesudah wajib diunggah!");
        if (!keteranganTugas.trim()) return toast.error("Keterangan wajib diisi!");
        formData.append("fotoAfter", fotoAfterFile);
        formData.append("keteranganTugas", keteranganTugas);
      }

      if (status === "Ditolak") {
        if (!keteranganTugas.trim()) return toast.error("Alasan wajib diisi!");
        formData.append("keteranganTugas", keteranganTugas);
      }

      const res = await fetch(`${API_BASE}/api/tasks/${id}/status`, {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal update tugas.");

      if (result.updatedTask) {
        setTasks((prev) =>
          sortTasks(prev.map((t) => (t.id === id ? result.updatedTask : t)))
        );
      }

      toast.success(`Status tugas berhasil diubah menjadi "${status}"`);
      successSound.current.play();
    } catch (err) {
      toast.error(err.message || "Terjadi kesalahan!");
      errorSound.current.play();
    }
  };

  // ===== Filter =====
  const filtered = (tasks || [])
    .filter((t) => t && t.title)
    .filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const [start, end] = dateRange;
      const taskDate = new Date(t.tanggalTugas);
      const matchesDate =
        start && end ? taskDate >= start && taskDate <= end : true;
      return matchesSearch && matchesDate;
    });

  const totalPages = Math.ceil(filtered.length / tasksPerPage) || 1;
  const paginated = filtered.slice((page - 1) * tasksPerPage, page * tasksPerPage);

  // ===== Download Excel =====
  const normalizeUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}/${url.replace(/^\/+/, "")}`;
  };

  const downloadExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Daftar Tugas");

      sheet.columns = [
        { header: "Judul", key: "Judul", width: 25 },
        { header: "Deskripsi", key: "Deskripsi", width: 30 },
        { header: "Status", key: "Status", width: 15 },
        { header: "Pekerja", key: "Pekerja", width: 20 },
        { header: "Tanggal", key: "Tanggal", width: 15 },
        { header: "Keterangan", key: "Keterangan", width: 30 },
        { header: "Foto Before", key: "Before", width: 18 },
        { header: "Foto After", key: "After", width: 18 },
      ];

      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      let currentRow = 2;
      for (const t of filtered) {
        sheet.addRow({
          Judul: t.title,
          Deskripsi: t.description || "-",
          Status: t.status,
          Pekerja: t.dikerjakanOleh || "-",
          Tanggal: t.tanggalTugas ? new Date(t.tanggalTugas).toLocaleDateString() : "-",
          Keterangan: t.keteranganTugas || "-",
        });
        sheet.getRow(currentRow).height = 65;

        const imgBeforeUrl = normalizeUrl(t.fotoBefore);
        const imgAfterUrl = normalizeUrl(t.fotoAfter);

        const insertImage = async (url, colIndex) => {
          if (!url) return;
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const buffer = await blob.arrayBuffer();
            const imageId = workbook.addImage({
              buffer,
              extension: "jpeg",
            });
            sheet.addImage(imageId, {
              tl: { col: colIndex - 1 + 0.9, row: currentRow - 1 + 0.05 },
              ext: { width: 90, height: 60 },
            });
          } catch {
            console.warn("Gagal menambahkan gambar:", url);
          }
        };

        await insertImage(imgBeforeUrl, 7);
        await insertImage(imgAfterUrl, 8);
        currentRow++;
      }

      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "Daftar_Tugas.xlsx";
      link.click();

      toast.success("Excel berhasil diunduh!");
    } catch (err) {
      console.error("Gagal ekspor Excel:", err);
      toast.error("Gagal ekspor Excel!");
    }
  };

  // ===== Helper: Batasi Huruf =====
  const truncate = (text, max) => {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max).trim() + "...";
  };

  // ===== Reset Filter =====
  const handleResetFilter = () => {
    setDateRange([null, null]);
    toast.info("Filter tanggal direset — semua tugas ditampilkan.");
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f7fbff", pb: 6 }}>
      <ToastContainer position="bottom-right" autoClose={2500} />
      <HeaderBar
        search={search}
        setSearch={setSearch}
        username={username}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        volume={volume}
        setVolume={setVolume}
      />

      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Statistik */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total" value={tasks.filter(Boolean).length} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Aktif"
              value={tasks.filter(
                (t) => t && (t.status === "Menunggu" || t.status === "Sedang Dikerjakan")
              ).length}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Selesai" value={tasks.filter((t) => t && t.status === "Selesai").length} color="#28a745" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Ditolak" value={tasks.filter((t) => t && t.status === "Ditolak").length} color="#d9534f" />
          </Grid>
        </Grid>

        <ProgressOverview tasks={tasks.filter(Boolean)} />

        {/* Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              <DateRangePicker
                calendars={1}
                value={dateRange}
                onChange={(newValue) => setDateRange(newValue)}
                localeText={{ start: "Dari Tanggal", end: "Sampai" }}
                slotProps={{
                  textField: { size: "small" },
                }}
              />
              <Button variant="outlined" color="secondary" onClick={handleResetFilter}>
                Reset Filter
              </Button>
              <Button variant="outlined" onClick={downloadExcel}>
                Download Excel
              </Button>
            </Stack>
          </LocalizationProvider>
        </Paper>

        {/* Tambah Tugas */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Button fullWidth variant="contained" onClick={() => navigate("/tambah-tugas")}>
            Tambah Tugas
          </Button>
        </Paper>

        {/* Daftar Tugas */}
        <Grid container spacing={2} mb={3}>
          {paginated.filter(Boolean).map((t) => (
            <Grid key={t.id} item xs={12} sm={6} md={4} lg={3}>
              <TaskCard
                task={{
                  ...t,
                  title: truncate(t.title, 30),
                  description: truncate(t.description, 160),
                }}
                onStatusChange={handleStatusChange}
                username={username}
              />
            </Grid>
          ))}
        </Grid>

        <Stack alignItems="center">
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} />
        </Stack>
      </Container>
    </Box>
  );
}
