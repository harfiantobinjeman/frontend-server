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

  const [username] = useState(localStorage.getItem("username") || null);
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

  const sortTasks = (list) => {
    const order = {
      "Sedang Dikerjakan": 1,
      "Menunggu": 2,
      "Selesai": 3,
      "Ditolak": 4,
    };

    return (list || [])
      .filter(Boolean)
      .sort((a, b) => (order[a.status] || 99) - (order[b.status] || 99));
  };

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      const data = await res.json();
      setTasks(sortTasks(data));
    } catch {
      toast.error("Gagal memuat data tugas!");
    }
  };

  useEffect(() => {
    loadTasks();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("taskAdded", (task) => {
      if (!task) return;
      setTasks((prev) => sortTasks([...prev, task]));
      if (soundEnabled) infoSound.current.play();
    });

    socket.on("taskUpdated", (task) => {
      if (!task) return;
      setTasks((prev) =>
        sortTasks(prev.map((t) => (t.id === task.id ? task : t)))
      );
      if (soundEnabled)
        (task.status === "Ditolak" ? errorSound : successSound).current.play();
    });

    return () => socket.disconnect();
  }, [soundEnabled, volume]);

  const handleStatusChange = async (
    id,
    status,
    username,
    fotoAfterFile,
    keteranganTugas = ""
  ) => {
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("username", username);

      if (status === "Selesai") {
        if (!fotoAfterFile) return toast.error("Foto sesudah wajib diunggah!");
        if (!keteranganTugas.trim())
          return toast.error("Keterangan wajib diisi!");
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
      if (!res.ok) throw new Error(result.message);

      if (result.updatedTask) {
        setTasks((prev) =>
          sortTasks(prev.map((t) => (t.id === id ? result.updatedTask : t)))
        );
      }

      toast.success(`Status berhasil diubah ke "${status}"`);
      successSound.current.play();
    } catch (err) {
      toast.error(err.message);
      errorSound.current.play();
    }
  };

  const filtered = tasks
    .filter((t) => t?.title?.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => {
      const [start, end] = dateRange;
      if (!start || !end) return true;
      const taskDate = new Date(t.tanggalTugas);
      return taskDate >= start && taskDate <= end;
    });

  const totalPages = Math.ceil(filtered.length / tasksPerPage) || 1;
  const paginated = filtered.slice(
    (page - 1) * tasksPerPage,
    page * tasksPerPage
  );

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
      let rowIndex = 2;

      for (const t of filtered) {
        sheet.addRow({
          Judul: t.title,
          Deskripsi: t.description || "-",
          Status: t.status,
          Pekerja: t.dikerjakanOleh || "-",
          Tanggal: t.tanggalTugas
            ? new Date(t.tanggalTugas).toLocaleDateString()
            : "-",
          Keterangan: t.keteranganTugas || "-",
        });

        sheet.getRow(rowIndex).height = 65;

        const insertImg = async (url, col) => {
          if (!url) return;

          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const buf = await blob.arrayBuffer();
            const ext = blob.type.includes("png") ? "png" : "jpeg";

            const img = workbook.addImage({
              buffer: buf,
              extension: ext,
            });

            sheet.addImage(img, {
              tl: { col: col - 1 + 0.9, row: rowIndex - 1 + 0.05 },
              ext: { width: 90, height: 60 },
            });
          } catch {}
        };

        await insertImg(normalizeUrl(t.fotoBefore), 7);
        await insertImg(normalizeUrl(t.fotoAfter), 8);

        rowIndex++;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "Daftar_Tugas.xlsx";
      link.click();

      toast.success("Excel berhasil diunduh!");
    } catch {
      toast.error("Gagal ekspor Excel!");
    }
  };

  const truncate = (txt, max) =>
    !txt ? "" : txt.length <= max ? txt : txt.slice(0, max).trim() + "...";

  const handleResetFilter = () => {
    setDateRange([null, null]);
    setPage(1);
    toast.info("Filter tanggal direset");
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

      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* Statistik */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total" value={tasks.length} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Aktif"
              value={tasks.filter(
                (t) =>
                  t.status === "Menunggu" || t.status === "Sedang Dikerjakan"
              ).length}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Selesai"
              color="#28a745"
              value={tasks.filter((t) => t.status === "Selesai").length}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Ditolak"
              color="#d9534f"
              value={tasks.filter((t) => t.status === "Ditolak").length}
            />
          </Grid>
        </Grid>

        <ProgressOverview tasks={tasks} />

        {/* Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
            >
              <DateRangePicker
                calendars={1}
                value={dateRange}
                onChange={(val) => setDateRange(val ?? [null, null])}
                localeText={{ start: "Dari", end: "Sampai" }}
                slotProps={{ textField: { size: "small" } }}
              />
              <Button variant="outlined" onClick={handleResetFilter}>
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
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => navigate("/tambah-tugas")}
          >
            Tambah Tugas
          </Button>
        </Paper>

        {/* Daftar Tugas */}
        <Grid
          container
          spacing={2}
          mb={3}
          justifyContent="center"
          alignItems="stretch"
        >
          {paginated.map((t) => (
            <Grid key={t.id} item xs={12} sm={10} md={6} lg={5} xl={4}>
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

        <Stack alignItems="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, v) => setPage(v)}
          />
        </Stack>
      </Container>
    </Box>
  );
}
