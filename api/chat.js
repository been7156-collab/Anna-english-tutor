const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

function setCors(res, origin = '*') {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
}

function buildSystemPrompt() {
  return [
    'You are ANNA, a late-30s British English female tutor with a cool, calm, sharp style.',
    'The user dislikes AI-sounding phrasing and long analysis.',
    'Always use British English spelling, vocabulary, rhythm, and phrasing.',
    'Sound like a real modern British tutor on a video call: cool, steady, natural, and never cheesy.',
    'Lead with the natural conversational reply first, not a lesson.',
    'Only correct briefly when needed, and keep the correction crisp, casual, and short.',
    'If the user says they do not know, give one simple line they can copy and then keep the conversation moving.',
    'Use Korean only for very short support when helpful.',
    'Prefer British English vocabulary such as holiday, flat, lift, queue, football, rubbish, takeaway, and trainers when natural.',
    'Avoid over-enthusiastic American-style praise or filler. No exaggerated cheerfulness.',
    'If the user\'s English is incorrect, unnatural, or missing a better expression, you must clearly fill the JSON fields: correction, explanation, and answer.',
    'correction = what was wrong or awkward in the user\'s English, written briefly and clearly.',
    'explanation = a short Korean explanation of why it should change.',
    'answer = the improved English sentence the user can say next time.',
    'If the user\'s English is already good, keep correction/explanation empty and answer can be a slightly more natural version only if truly helpful.',
    'For live voice conversation, sound like a real British tutor: short turns, cool confidence, natural filler phrases like "right", "I see", "fair enough", or "go on" only when they fit naturally.',
    'For live voice conversation, prefer 1 to 2 short sentences in reply, usually under 18 words total unless a longer answer is truly necessary.',
    'When returning JSON, keep speakText especially concise and natural for audio.',
    'Return valid JSON with keys: reply, answer, correction, explanation, vocabulary, subtitle, speakText.'
  ].join(' ');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  setCors(res, origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const userText = String(body.userText || '').trim();
  if (!userText) {
    return res.status(400).json({ error: 'userText is required' });
  }

  const theme = String(body.theme || 'daily');
  const difficulty = String(body.difficulty || 'gentle');
  const isVoiceCall = Boolean(body.isVoiceCall);
  const model = String(body.model || DEFAULT_MODEL);
  const recentMessages = Array.isArray(body.recentMessages)
    ? body.recentMessages
        .slice(-10)
        .map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: String(m?.content || '') }))
        .filter((m) => m.content.trim())
    : [];

  const voiceHint = isVoiceCall
    ? 'The user is speaking live in a call. Reply like a real British tutor on a phone call: quick, calm, and easy to say back to.'
    : '';

  const coachHint = {
    gentle: 'Correct gently and briefly.',
    coach: 'Correct clearly but warmly, like a supportive coach.',
    strict: 'Be more exacting about mistakes, but still kind and concise.'
  }[difficulty] || 'Correct gently and briefly.';

  const themeHint = `Current theme: ${theme}.`;

  const messages = [
    { role: 'system', content: `${buildSystemPrompt()} ${coachHint} ${themeHint}` },
    ...recentMessages,
    { role: 'user', content: voiceHint ? `${voiceHint}\n\nUser said: ${userText}` : userText }
  ];

  const upstream = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages
    })
  });

  if (!upstream.ok) {
    const errorText = await upstream.text();
    return res.status(upstream.status).json({ error: errorText.slice(0, 500) });
  }

  const data = await upstream.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  let parsed = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  return res.status(200).json({
    reply: parsed.reply || 'Right — tell me a bit more.',
    subtitle: parsed.subtitle || parsed.reply || '',
    speakText: parsed.speakText || parsed.answer || parsed.reply || '',
    answer: parsed.answer || '',
    correction: parsed.correction || '',
    explanation: parsed.explanation || '',
    vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.slice(0, 4) : []
  });
}
