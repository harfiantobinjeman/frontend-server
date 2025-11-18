import { Paper, Stack, Typography, LinearProgress } from "@mui/material";

export default function ProgressOverview({ tasks }) {
  const total = tasks.length || 1;
  const done = tasks.filter(t => t.status === "Selesai").length;
  const percent = Math.round((done / total) * 100);

  return (
    <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">Progress Penyelesaian</Typography>
        <LinearProgress variant="determinate" value={percent} sx={{ height: 10, borderRadius: 4 }} />
        <Typography variant="caption">{percent}% selesai</Typography>
      </Stack>
    </Paper>
  );
}
