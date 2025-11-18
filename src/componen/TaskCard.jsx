import React, { useState } from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const defaultImage = "https://via.placeholder.com/400x250?text=No+Image";

export default function TaskCard({ task, onStatusChange, username }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogStatus, setDialogStatus] = useState("");
  const [fotoAfterFile, setFotoAfterFile] = useState(null);
  const [previewFotoAfter, setPreviewFotoAfter] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const showDikerjakanOleh =
    task.dikerjakanOleh &&
    task.status !== "Menunggu" &&
    task.status !== "Ditolak";

  const handleFotoAfter = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoAfterFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewFotoAfter(reader.result);
    reader.readAsDataURL(file);
  };

  const handleOpenDialog = (status) => {
    setDialogStatus(status);
    setOpenDialog(true);
  };

  const handleSubmit = () => {
    if (dialogStatus === "Selesai" && !fotoAfterFile)
      return alert("Foto sesudah wajib diunggah!");
    if (!keterangan.trim()) return alert("Keterangan tugas wajib diisi!");

    onStatusChange(task.id, dialogStatus, username, fotoAfterFile, keterangan);
    setOpenDialog(false);
    setFotoAfterFile(null);
    setPreviewFotoAfter("");
    setKeterangan("");
  };

  const fotoBeforeSrc = task.fotoBefore
    ? `http://localhost:5000${task.fotoBefore}`
    : defaultImage;
  const fotoAfterSrc = task.fotoAfter
    ? `http://localhost:5000${task.fotoAfter}`
    : defaultImage;

  return (
    <>
      <Card
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "center" : "flex-start",
          borderLeft: "6px solid #2563eb",
          borderRadius: 2,
          p: 2,
          mb: 2,
          gap: 2,
          boxShadow: 2,
        }}
      >
        {/* ==================== BAGIAN TEKS ==================== */}
        <Box sx={{ flex: 1, width: "100%" }}>
          <CardContent sx={{ p: 0 }}>
            {/* --- Bagian Tugas --- */}
            <Box
              sx={{
                p: 1,
                mb: 1,
                bgcolor: "rgba(37,99,235,0.08)",
                borderRadius: "10px",
                border: "1px solid rgba(37,99,235,0.2)",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                📝 Tugas: {task.title}
              </Typography>
            </Box>

            {/* --- Deskripsi Tugas --- */}
            <Box
              sx={{
                p: 1,
                mb: 1,
                bgcolor: "rgba(59,130,246,0.05)",
                borderRadius: "10px",
                border: "1px solid rgba(59,130,246,0.15)",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <b>Deskripsi Tugas:</b> {task.description}
              </Typography>
            </Box>

            {/* Dikerjakan Oleh */}
            {showDikerjakanOleh && (
              <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                Dikerjakan oleh: <b>{task.dikerjakanOleh}</b>
              </Typography>
            )}

            {/* --- Keterangan Tugas atau Alasan Penolakan --- */}
            {(task.status === "Selesai" || task.status === "Ditolak") &&
              task.keteranganTugas && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1.5,
                    p: 1,
                    borderRadius: "10px",
                    bgcolor:
                      task.status === "Selesai"
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(239,68,68,0.1)",
                    border:
                      task.status === "Selesai"
                        ? "1px solid #22c55e"
                        : "1px solid #ef4444",
                  }}
                >
                  <b>
                    {task.status === "Selesai"
                      ? "Keterangan Tugas:"
                      : "Alasan Penolakan:"}
                  </b>{" "}
                  {task.keteranganTugas}
                </Typography>
              )}

            <Stack direction="row" spacing={1} mt={1}>
              <Chip label={task.status} size="small" color="primary" />
            </Stack>

            {/* Tombol Aksi */}
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={1}
              mt={2}
              sx={{ width: isMobile ? "100%" : "auto" }}
            >
              {task.status === "Menunggu" && (
                <>
                  <Button
                    fullWidth={isMobile}
                    variant="contained"
                    size="small"
                    onClick={() =>
                      onStatusChange(task.id, "Sedang Dikerjakan", username)
                    }
                  >
                    OTW Pengerjaan
                  </Button>
                  <Button
                    fullWidth={isMobile}
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleOpenDialog("Ditolak")}
                  >
                    Ditolak
                  </Button>
                </>
              )}

              {task.status === "Sedang Dikerjakan" && (
                <Button
                  fullWidth={isMobile}
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={() => handleOpenDialog("Selesai")}
                >
                  Selesai
                </Button>
              )}
            </Stack>
          </CardContent>
        </Box>

        {/* ==================== BAGIAN FOTO ==================== */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 1.5,
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            width: isMobile ? "100%" : "auto",
          }}
        >
          {/* Foto Before */}
          <Box
            sx={{
              width: isMobile ? "100%" : 180,
              height: isMobile ? 180 : 150,
              borderRadius: "10px",
              overflow: "hidden",
              border: "2px solid #e0e0e0",
            }}
          >
            <img
              src={fotoBeforeSrc}
              alt="Foto Before"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>

          {/* Foto After (hanya muncul jika selesai) */}
          {task.status === "Selesai" && (
            <Box
              sx={{
                width: isMobile ? "100%" : 180,
                height: isMobile ? 180 : 150,
                borderRadius: "10px",
                overflow: "hidden",
                border: "2px solid #e0e0e0",
              }}
            >
              <img
                src={fotoAfterSrc}
                alt="Foto After"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          )}
        </Box>
      </Card>

      {/* ==================== DIALOG ==================== */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>
          {dialogStatus === "Selesai" ? "Selesaikan Tugas" : "Tolak Tugas"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {dialogStatus === "Selesai"
              ? "Upload foto sesudah dan isi keterangan tugas."
              : "Isi alasan penolakan tugas."}
          </Typography>

          {dialogStatus === "Selesai" && (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoAfter}
                style={{ marginBottom: "10px" }}
              />
              {previewFotoAfter && (
                <img
                  src={previewFotoAfter}
                  alt="Preview Foto After"
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    marginBottom: "10px",
                    objectFit: "cover",
                  }}
                />
              )}
            </>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label={
              dialogStatus === "Selesai"
                ? "Keterangan Tugas"
                : "Alasan Penolakan"
            }
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
