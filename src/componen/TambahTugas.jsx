import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ExcelJS from "exceljs";
import { Upload, Download } from "lucide-react";

const priorityOptions = ["Biasa", "Sedang", "Urgent"];

export default function TambahTugas() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "Menunggu",
    priority: "Biasa",
    tanggalTugas: "",
  });

  const [fotoBefore, setFotoBefore] = useState(null);
  const [previewBefore, setPreviewBefore] = useState(null);

  useEffect(() => {
    // cek login dari localStorage
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  const handleFotoBefore = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoBefore(file);
      setPreviewBefore(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!newTask.title.trim()) return toast.error("Judul tugas wajib diisi!");
    if (!newTask.tanggalTugas) return toast.error("Tanggal tugas wajib diisi!");

    try {
      const formData = new FormData();
      formData.append("title", newTask.title);
      formData.append("description", newTask.description);
      formData.append("priority", newTask.priority);
      formData.append("tanggalTugas", newTask.tanggalTugas);
      if (fotoBefore) formData.append("fotoBefore", fotoBefore);

      const response = await fetch("http://192.168.11.245:5000/api/tasks", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menyimpan tugas!");
      }

      toast.success("✅ Tugas berhasil ditambahkan!");

      // reset form tapi tetap di halaman ini
      setNewTask({
        title: "",
        description: "",
        status: "Menunggu",
        priority: "Biasa",
        tanggalTugas: "",
      });
      setFotoBefore(null);
      setPreviewBefore(null);
    } catch (err) {
      console.error("Tambah tugas error:", err);
      toast.error(err.message || "Terjadi kesalahan saat menambah tugas!");
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];

      const rows = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const [title, description, priority, tanggalTugas] = row.values.slice(1);
        if (title && tanggalTugas) {
          rows.push({
            title,
            description: description || "",
            priority: priority || "Biasa",
            tanggalTugas,
            status: "Menunggu",
          });
        }
      });

      if (rows.length === 0) return toast.warn("Tidak ada data tugas di file!");

      for (const task of rows) {
        const response = await fetch("http://192.168.11.245:5000/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });
        if (!response.ok) throw new Error("Gagal menyimpan salah satu tugas!");
      }

      toast.success(`Berhasil import ${rows.length} tugas!`);
    } catch (error) {
      console.error("Import Excel error:", error);
      toast.error("Gagal membaca atau menyimpan data dari Excel!");
    }
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template Tugas");

    worksheet.addRow(["title", "description", "priority", "tanggalTugas"]);
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    worksheet.addRow([
      "Contoh Judul",
      "Deskripsi singkat tugas",
      "Biasa",
      "2025-11-15",
    ]);

    worksheet.columns = [
      { width: 25 },
      { width: 40 },
      { width: 15 },
      { width: 15 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template_Tugas.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);

    toast.info("📄 Template Excel berhasil diunduh!");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f9fafb, #eef2ff)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: "20px",
            width: "100%",
            maxWidth: "520px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          {/* 📤 IMPORT EXCEL */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: "12px",
              border: "1px dashed #b0bec5",
              backgroundColor: "#f9fafc",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="primary"
              mb={1}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Upload size={20} /> Import dari Excel (.xlsx)
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                component="label"
                variant="contained"
                color="primary"
                size="small"
                startIcon={<Upload size={16} />}
              >
                Pilih File Excel
                <input
                  type="file"
                  accept=".xlsx"
                  hidden
                  onChange={handleImportExcel}
                />
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Download size={16} />}
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* 📝 FORM TAMBAH TUGAS */}
          <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
            ➕ Tambah Tugas Baru
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Judul Tugas"
              fullWidth
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
            />

            <TextField
              label="Deskripsi"
              fullWidth
              multiline
              rows={3}
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
            />

            <TextField
              label="Tanggal Tugas"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newTask.tanggalTugas}
              onChange={(e) =>
                setNewTask({ ...newTask, tanggalTugas: e.target.value })
              }
            />

            <TextField
              select
              label="Prioritas"
              fullWidth
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
            >
              {priorityOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>

            {/* Upload Foto Before */}
            <Box>
              <Typography variant="body2" fontWeight={600} mb={0.5}>
                Foto Sebelum (opsional)
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoBefore}
                style={{ marginBottom: "8px" }}
              />
              {previewBefore && (
                <img
                  src={previewBefore}
                  alt="Preview"
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    marginTop: "8px",
                  }}
                />
              )}
            </Box>
          </Stack>

          <Stack direction="row" justifyContent="space-between" mt={4}>
            {username && (
              <Button variant="outlined" onClick={() => navigate("/")}>
                Kembali
              </Button>
            )}
            <Button variant="contained" onClick={handleSave}>
              Simpan
            </Button>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
}
