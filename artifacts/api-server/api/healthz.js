export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    status: "ok",
    system: "Kenya Forensic Intelligence Network (KFIN)",
    service: "kfin-api-server",
    subPhase: "Phase 0 — Development Foundation",
    timestamp: new Date().toISOString()
  });
}
