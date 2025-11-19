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

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
    ? `http://192.168.11.245:5000${task.fotoBefore}`
    : defaultImage;

  const fotoAfterSrc = task.fotoAfter
    ? `http://192.168.11.245:5000${task.fotoAfter}`
    : defaultImage;

  return (
    <>
      <Card
        sx={{
          borderLeft: "6px solid #2563eb",
          borderRadius: 2,
          p: 2,
          mb: 3,
          boxShadow: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 2,
          }}
        >
          {/* ==================== BAGIAN TEKS ==================== */}
          <Box sx={{ flex: 1 }}>
            <CardContent sx={{ p: 0 }}>
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

              <Box
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: "rgba(59,130,246,0.05)",
                  borderRadius: "10px",
                  border: "1px solid rgba(59,130,246,0.15)",
                }}
              >
                <Typography variant="body2">
                  <b>Deskripsi Tugas:</b> {task.description}
                </Typography>
              </Box>

              {showDikerjakanOleh && (
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  Dikerjakan oleh: <b>{task.dikerjakanOleh}</b>
                </Typography>
              )}

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

              <Box sx={{ mt: 1 }}>
                {task.jamMulai && (
                  <Typography variant="caption" sx={{ display: "block" }}>
                    ⏳ Mulai: <b>{formatDateTime(task.jamMulai)}</b>
                  </Typography>
                )}

                {task.jamSelesai && (
                  <Typography variant="caption" sx={{ display: "block" }}>
                    ✅ Selesai: <b>{formatDateTime(task.jamSelesai)}</b>
                  </Typography>
                )}
              </Box>

              <Stack
                direction={isMobile ? "column" : "row"}
                spacing={1}
                mt={2}
              >
                {task.status === "Menunggu" && (
                  <>
                    <Button
                      variant="contained"
                      onClick={() =>
                        onStatusChange(task.id, "Sedang Dikerjakan", username)
                      }
                    >
                      OTW Pengerjaan
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenDialog("Ditolak")}
                    >
                      Ditolak
                    </Button>
                  </>
                )}

                {task.status === "Sedang Dikerjakan" && (
                  <Button
                    variant="contained"
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
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Box
              sx={{
                width: 180,
                height: 150,
                borderRadius: "10px",
                overflow: "hidden",
                border: "2px solid #e0e0e0",
              }}
            >
              <img
                src={fotoBeforeSrc}
                alt="Before"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>

            {task.status === "Selesai" && (
              <Box
                sx={{
                  width: 180,
                  height: 150,
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "2px solid #e0e0e0",
                }}
              >
                <img
                  src={fotoAfterSrc}
                  alt="After"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}
          </Stack>
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
                style={{ marginBottom: "10px" }}
                onChange={handleFotoAfter}
              />

              {previewFotoAfter && (
                <img
                  src={previewFotoAfter}
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
