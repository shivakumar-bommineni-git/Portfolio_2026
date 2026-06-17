const http = require('http');
const { SYSTEM_PROMPT } = require('../data/shivakumar');

const OLLAMA_HOST  = process.env.OLLAMA_HOST  || 'localhost';
const OLLAMA_PORT  = parseInt(process.env.OLLAMA_PORT || '11434', 10);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL  || 'llama3.2:latest';

exports.chat = (req, res) => {
  const { messages = [] } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Cap conversation history to last 10 exchanges to keep prompt size manageable
  const trimmed = messages.slice(-20);

  const payload = JSON.stringify({
    model: OLLAMA_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...trimmed,
    ],
    stream: true,
    options: {
      temperature: 0.5,   // focused, not too creative
      top_p: 0.9,
      num_predict: 512,   // max tokens per reply
    },
  });

  // Stream headers so frontend receives chunks immediately
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');

  const ollamaReq = http.request(
    {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (ollamaRes) => {
      ollamaRes.on('data', (chunk) => res.write(chunk));
      ollamaRes.on('end', () => res.end());
      ollamaRes.on('error', () => res.end());
    }
  );

  ollamaReq.on('error', () => {
    if (!res.headersSent) {
      res.status(503).json({
        error: 'AI service is unavailable. Make sure Ollama is running locally.',
      });
    } else {
      res.end();
    }
  });

  req.on('close', () => ollamaReq.destroy()); // client disconnected — abort upstream
  ollamaReq.write(payload);
  ollamaReq.end();
};

exports.status = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      const ping = http.get(
        { hostname: OLLAMA_HOST, port: OLLAMA_PORT, path: '/api/tags', timeout: 2000 },
        (r) => { resolve(r.statusCode); }
      );
      ping.on('error', reject);
      ping.on('timeout', () => { ping.destroy(); reject(new Error('timeout')); });
    });
    res.json({ online: true, model: OLLAMA_MODEL });
  } catch {
    res.json({ online: false, model: OLLAMA_MODEL });
  }
};
