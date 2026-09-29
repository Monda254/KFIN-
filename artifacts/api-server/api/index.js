export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    name: "KFIN API Gateway",
    version: "0.1.0",
    status: "operational",
    system: "Kenya Forensic Intelligence Network",
    phase: "Phase 0 — Foundation Architecture",
    endpoints: {
      health: "/api/healthz"
    },
    timestamp: new Date().toISOString()
  });
}
