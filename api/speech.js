const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const DEFAULT_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'shimmer';

function setCors(res, origin = '*') {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  setCors(res, origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).send('OPENAI_API_KEY is not configured on the server.');
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const input = String(body.input || '').trim();
  if (!input) {
    return res.status(400).send('input is required');
  }

  const model = String(body.model || DEFAULT_TTS_MODEL);
  const voice = String(body.voice || DEFAULT_TTS_VOICE);
  const format = String(body.format || 'mp3');

  const upstream = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      voice,
      input,
      format
    })
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return res.status(upstream.status).send(text.slice(0, 500));
  }

  const audioBuffer = Buffer.from(await upstream.arrayBuffer());
  res.setHeader('Content-Type', 'audio/mpeg');
  return res.status(200).send(audioBuffer);
}
