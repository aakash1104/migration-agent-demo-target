import express from "express";
import {
  formatOrderDate,
  durationFromMinutes,
  timezoneFromUser,
  mutableChainWorkflow
} from "./lib";

const app = express();
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok", ts: formatOrderDate("2026-05-03T15:45:00Z") });
});

app.get("/duration/:minutes", (req, res) => {
  const minutes = Number(req.params.minutes ?? "0");
  res.json({ duration: durationFromMinutes(minutes) });
});

app.get("/tz", (req, res) => {
  const tz = typeof req.query.tz === "string" ? req.query.tz : null;
  res.json({ value: timezoneFromUser("2026-05-03T15:45:00Z", tz) });
});

app.get("/workflow", (_, res) => {
  res.json(mutableChainWorkflow("2026-05-03T00:00:00Z"));
});

if (require.main === module) {
  const port = 3100;
  app.listen(port, () => {
    console.log(`target-app listening on ${port}`);
  });
}

export default app;
