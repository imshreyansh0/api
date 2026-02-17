import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "2mb" }));

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const NVAPI = process.env.NVAPI;

if (!NVAPI) {
  throw new Error("NVAPI is not set");
}

function isNvidiaFormat(body) {
  return body && (body.model || body.messages || body.input || body.prompt);
}

function simpleToNvidia(body) {
  return {
    model: body.model,
    messages: [
      { role: "user", content: body.prompt }
    ],
    max_tokens: body.max_tokens ?? 256,
    temperature: body.temperature ?? 0.7
  };
}

app.get("/__ping", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/v1/models", async (req, res) => {
  try {
    const r = await fetch(`${NVIDIA_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${NVAPI}`
      }
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/v1/chat/completions", async (req, res) => {
  try {
    let body;
    if (isNvidiaFormat(req.body)) {
      body = req.body;
    } else {
      body = simpleToNvidia(req.body);
    }

    const r = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVAPI}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("listening on " + port);
});
