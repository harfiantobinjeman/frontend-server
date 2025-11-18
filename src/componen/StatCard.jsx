import { Paper, Stack, Typography } from "@mui/material";

export default function StatCard({ title, value }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="caption">{title}</Typography>
        <Typography variant="h6">{value}</Typography>
      </Stack>
    </Paper>
  );
}
