const chatWindow = document.getElementById('chatWindow');
const composerForm = document.getElementById('composerForm');
const messageInput = document.getElementById('messageInput');
const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackContent = document.getElementById('feedbackContent');
const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
const avatarFace = document.getElementById('avatarFace');
const themeSelect = document.getElementById('themeSelect');
const difficultySelect = document.getElementById('difficultySelect');
const modeBadge = document.getElementById('modeBadge');
const apiKeyInput = document.getElementById('apiKeyInput');
const baseUrlInput = document.getElementById('baseUrlInput');
const modelInput = document.getElementById('modelInput');

const STATE = {
  messages: [],
  lastAssistantText: '',
  scenarioPrompted: false,
  settings: loadSettings(),
};

const THEME_OPENERS = {
  daily: 'Hi! I am your English tutor. Let\'s have a simple daily conversation. Tell me how your day is going.',
  cafe: 'Welcome to the cafe! What would you like to order today?',
  travel: 'Hello! You\'re at the airport check-in counter. How can I help you today?',
  church: 'Hi! I\'m visiting your church for the first time. Could you introduce your church to me?',
  worship: 'Hey! I\'m on the worship team with you. Can you explain today\'s set and rehearsal plan in English?',
  pastoral: 'Hi pastor! Can we talk for a minute? I\'d like to ask about your ministry and church community.'
};

const QUICK_GUIDES = {
  hint: '힌트를 드릴게요. 짧고 쉬운 문장으로 먼저 말해보세요. 필요하면 제가 바로 자연스럽게 다듬어드릴게요.',
  answer: '정답 예문을 드릴게요. 이 상황에서 쓸 수 있는 자연스러운 문장을 하나 만들어드릴게요.',
  natural: '더 원어민처럼 자연스러운 표현으로 바꿔드릴게요.',
  idiom: '상황에 맞는 숙어/표현도 함께 알려드릴게요.',
  grammar: '왜 그렇게 말하는지 한국어로 쉽게 설명해드릴게요.',
  retry: '좋아요. 방금 표현을 조금 바꿔서 다시 말해보세요. 제가 다시 체크해드릴게요.'
};

applySettingsUI();
seedWelcome();
wireEvents();

function wireEvents() {
  composerForm.addEventListener('submit', onSubmit);
  document.getElementById('startScenarioBtn').addEventListener('click', startScenario);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettingsFromUI);
  document.getElementById('demoModeBtn').addEventListener('click', enableDemoMode);
  document.getElementById('translateMyKoreanBtn').addEventListener('click', () => runHelperPrompt('translate'));
  document.getElementById('correctMyEnglishBtn').addEventListener('click', () => runHelperPrompt('correct'));
  document.getElementById('voiceBtn').addEventListener('click', startSpeechRecognition);
  document.getElementById('speakLastBtn').addEventListener('click', speakLastAssistant);
  closeFeedbackBtn.addEventListener('click', () => feedbackPanel.classList.add('hidden'));
  document.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      appendAssistant(`💡 ${QUICK_GUIDES[btn.dataset.quick]}`);
      if (btn.dataset.quick === 'answer') {
        const theme = themeSelect.value;
        appendAssistant(`예문: ${sampleAnswerForTheme(theme)}`);
      }
      if (btn.dataset.quick === 'idiom') {
        appendAssistant(`추천 표현\n- break the ice: 어색함을 풀다\n- go over: 다시 검토하다\n- be on the same page: 서로 이해가 같다`);
      }
    });
  });
}

function seedWelcome() {
  appendAssistant(
`안녕하세요! 저는 **ANNA 영어쌤**이에요 😊\n\n할 수 있는 것:\n- 영어로 대화 연습\n- 한국어로 질문하면 영어 정답 제시\n- 내가 쓴 영어 문장 교정\n- 더 자연스러운 표현 추천\n- 숙어/표현/문법 설명\n\n먼저 왼쪽에서 테마를 고르고 **오늘의 대화 시작**을 눌러보세요.\nAPI 키가 없으면 데모 모드로도 체험 가능합니다.`);
}

async function onSubmit(e) {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  appendUser(text);
  messageInput.value = '';
  setAvatar('🤔');
  try {
    const reply = await generateTutorReply(text);
    appendAssistant(reply.text);
    if (reply.feedback) renderFeedback(reply.feedback);
  } catch (err) {
    appendAssistant(`오류가 있었어요: ${err.message}\n데모 모드로 전환해서 다시 시도해보셔도 됩니다.`);
  } finally {
    setAvatar('😊');
  }
}

function startScenario() {
  const theme = themeSelect.value;
  const opener = THEME_OPENERS[theme];
  STATE.scenarioPrompted = true;
  appendAssistant(`🎯 오늘의 테마: ${themeLabel(theme)}\n\n${opener}\n\n영어로 먼저 답해보셔도 좋고, 한국어로 '이걸 영어로 어떻게 말해?'라고 물으셔도 돼요.`);
}

function runHelperPrompt(kind) {
  const text = messageInput.value.trim();
  if (!text) {
    appendAssistant('먼저 아래 입력창에 문장을 적어주세요 🙂');
    return;
  }
  const payloadMap = {
    translate: `다음 한국어를 자연스러운 영어로 바꿔줘: ${text}`,
    correct: `다음 영어 문장을 교정하고 한국어 설명도 해줘: ${text}`,
  };
  appendUser(text);
  messageInput.value = '';
  generateTutorReply(payloadMap[kind]).then((reply) => {
    appendAssistant(reply.text);
    if (reply.feedback) renderFeedback(reply.feedback);
  });
}

function appendUser(text) {
  STATE.messages.push({ role: 'user', content: text });
  appendMessage('user', '나', text);
}

function appendAssistant(text) {
  STATE.messages.push({ role: 'assistant', content: text });
  STATE.lastAssistantText = text;
  appendMessage('assistant', 'ANNA 영어쌤', text);
}

function appendMessage(role, meta, text) {
  const tpl = document.getElementById('messageTemplate');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  node.querySelector('.bubble-meta').textContent = meta;
  node.querySelector('.bubble').textContent = text;
  chatWindow.appendChild(node);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderFeedback(feedback) {
  feedbackPanel.classList.remove('hidden');
  const chips = (feedback.vocabulary || []).map((item) => `<span class="inline-chip">${escapeHtml(item)}</span>`).join('');
  feedbackContent.innerHTML = `
    <div class="feedback-grid">
      <div class="feedback-card">
        <h4>정답 / 추천 문장</h4>
        <p>${escapeHtml(feedback.answer || '-')}</p>
      </div>
      <div class="feedback-card">
        <h4>교정 포인트</h4>
        <p>${escapeHtml(feedback.correction || '-')}</p>
      </div>
      <div class="feedback-card">
        <h4>한국어 설명</h4>
        <p>${escapeHtml(feedback.explanation || '-')}</p>
      </div>
      <div class="feedback-card">
        <h4>배우면 좋은 표현</h4>
        <div>${chips || '<span class="muted">아직 없음</span>'}</div>
      </div>
    </div>
  `;
}

async function generateTutorReply(userText) {
  if (STATE.settings.apiKey) {
    return realAiReply(userText);
  }
  return demoReply(userText);
}

async function realAiReply(userText) {
  const system = [
    'You are a warm English speaking tutor for a Korean learner.',
    'Always answer in a structured way that is easy for Korean speakers.',
    'If the user writes in Korean, provide: 1) natural English answer, 2) simpler alternative, 3) Korean explanation.',
    'If the user writes in English, provide: 1) corrected version if needed, 2) more natural version, 3) short Korean explanation.',
    'When relevant, include 2-4 useful idioms or expressions.',
    'Be concise but practical. Use Korean for explanations and English for examples.',
    'Return valid JSON with keys: reply, answer, correction, explanation, vocabulary.'
  ].join(' ');

  const messages = [
    { role: 'system', content: system },
    ...STATE.messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userText }
  ];

  const res = await fetch(`${STATE.settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STATE.settings.apiKey}`,
    },
    body: JSON.stringify({
      model: STATE.settings.model || 'gpt-4.1-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages,
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI 요청 실패 (${res.status}): ${text.slice(0, 180)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  const parsed = safeJsonParse(content);
  return {
    text: parsed.reply || '응답을 받았지만 내용을 해석하지 못했어요.',
    feedback: {
      answer: parsed.answer,
      correction: parsed.correction,
      explanation: parsed.explanation,
      vocabulary: parsed.vocabulary || [],
    }
  };
}

async function demoReply(userText) {
  const theme = themeSelect.value;
  const lower = userText.toLowerCase();
  const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(userText);

  if (isKorean) {
    const answer = translateKoreanHeuristically(userText, theme);
    return {
      text: `좋아요! 이렇게 말해볼 수 있어요:\n\n**영어 추천**\n${answer}\n\n**더 쉬운 버전**\n${simplifySentence(answer)}\n\n**한국어 설명**\n이 상황에서 너무 직역하지 말고, 회화에서 자주 쓰는 자연스러운 틀로 말하는 게 좋아요. 필요하면 제가 더 공손한 버전도 드릴게요.`,
      feedback: {
        answer,
        correction: '한국어 질문이어서 교정 대신 추천 문장을 드렸어요.',
        explanation: '영어 회화에서는 짧고 분명한 문장이 가장 먼저 유용합니다.',
        vocabulary: vocabForTheme(theme),
      }
    };
  }

  const corrected = correctEnglishHeuristically(userText);
  const natural = makeMoreNatural(corrected, theme);
  const explanation = corrected === userText
    ? '문장이 크게 어색하지 않아요. 조금 더 자연스러운 회화 톤으로만 다듬었어요.'
    : '전치사, 관사, 동사 형태를 조금 다듬으면 더 자연스럽습니다.';

  let reply = `좋아요! 먼저 확인해볼게요.\n\n**내 문장 교정**\n${corrected}\n\n**더 자연스러운 표현**\n${natural}\n\n**한국어 설명**\n${explanation}`;

  if (lower.includes('church') || theme === 'church' || theme === 'pastoral' || theme === 'worship') {
    reply += `\n\n**사역/교회 표현 팁**\n- fellowship = 교제\n- worship service = 예배\n- ministry = 사역`;
  }

  return {
    text: reply,
    feedback: {
      answer: natural,
      correction: corrected,
      explanation,
      vocabulary: vocabForTheme(theme),
    }
  };
}

function translateKoreanHeuristically(text, theme) {
  const rules = [
    [/아이스 아메리카노.*주세요/, "I'd like an iced Americano, please."],
    [/오늘 교회.*모임/, 'I had a meeting at church today.'],
    [/주말.*교회.*쉬/, 'I usually go to church and rest on weekends.'],
    [/찬양팀.*연습/, 'We have worship team practice today.'],
    [/처음.*교회/, 'This is my first time visiting this church.'],
    [/기도.*부탁/, 'Could you pray for me?'],
  ];
  for (const [pattern, out] of rules) if (pattern.test(text)) return out;

  const fallbacks = {
    daily: 'I usually spend my day quietly and take care of my work.',
    cafe: 'I\'d like to order a drink, please.',
    travel: 'I need some help with my flight and check-in.',
    church: 'Let me introduce our church to you.',
    worship: 'Today we are preparing for worship and rehearsal.',
    pastoral: 'I would like to share about my ministry and church community.'
  };
  return fallbacks[theme] || 'Could you help me say this in English?';
}

function simplifySentence(text) {
  return text
    .replace("I would like to", "I'd like to")
    .replace('Let me introduce our church to you.', 'Our church is very welcoming.');
}

function correctEnglishHeuristically(text) {
  return text
    .replace(/\bi want go\b/gi, 'I want to go')
    .replace(/\bi go church\b/gi, 'I go to church')
    .replace(/\bi am pastor\b/gi, 'I am a pastor')
    .replace(/\bi have meeting at church today\b/gi, 'I had a meeting at church today')
    .replace(/\bcan you pray me\b/gi, 'Can you pray for me')
    .replace(/\bi want iced americano one\b/gi, "I'd like an iced Americano")
    .replace(/\s+/g, ' ')
    .trim();
}

function makeMoreNatural(text, theme) {
  if (theme === 'cafe' && /Americano/i.test(text)) return `${text.replace(/\.$/, '')}, please.`;
  if (theme === 'church') return text.replace('I am a pastor', 'I serve as a pastor at our church');
  if (theme === 'worship') return text.replace('practice', 'rehearsal');
  return text;
}

function vocabForTheme(theme) {
  const map = {
    daily: ['How was your day?', 'I usually...', 'That makes sense'],
    cafe: ['I\'d like...', 'For here or to go?', 'Could I also get...?'],
    travel: ['check in', 'boarding pass', 'carry-on'],
    church: ['fellowship', 'worship service', 'small group'],
    worship: ['set list', 'rehearsal', 'key change'],
    pastoral: ['ministry', 'encourage', 'pray for'],
  };
  return map[theme] || [];
}

function sampleAnswerForTheme(theme) {
  const samples = {
    daily: 'I had a busy day, but I am doing well.',
    cafe: 'I\'d like an iced Americano, please.',
    travel: 'I need to check in for my flight.',
    church: 'Our church is a warm community that loves worship and fellowship.',
    worship: 'Today\'s set starts in G, and we will modulate to A at the end.',
    pastoral: 'I serve people through preaching, prayer, and pastoral care.',
  };
  return samples[theme] || 'Could you help me with this?';
}

function themeLabel(theme) {
  return {
    daily: '일상 대화', cafe: '카페 주문', travel: '여행 / 공항',
    church: '교회 소개', worship: '찬양팀 / 예배', pastoral: '목회 / 교제'
  }[theme] || theme;
}

function saveSettingsFromUI() {
  STATE.settings = {
    apiKey: apiKeyInput.value.trim(),
    baseUrl: baseUrlInput.value.trim() || 'https://api.openai.com/v1',
    model: modelInput.value.trim() || 'gpt-4.1-mini',
  };
  localStorage.setItem('englishTutorSettings', JSON.stringify(STATE.settings));
  updateModeBadge();
  appendAssistant(STATE.settings.apiKey
    ? 'API 설정을 저장했어요. 이제 실제 AI 응답을 시도합니다.'
    : 'API 키가 비어 있어서 계속 데모 모드로 동작합니다.');
}

function enableDemoMode() {
  STATE.settings.apiKey = '';
  apiKeyInput.value = '';
  localStorage.setItem('englishTutorSettings', JSON.stringify(STATE.settings));
  updateModeBadge();
  appendAssistant('데모 모드로 전환했어요. 실제 AI 없이도 회화 흐름과 교정 UX를 체험할 수 있어요.');
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('englishTutorSettings')) || {
      apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini'
    };
  } catch {
    return { apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' };
  }
}

function applySettingsUI() {
  apiKeyInput.value = STATE.settings.apiKey || '';
  baseUrlInput.value = STATE.settings.baseUrl || 'https://api.openai.com/v1';
  modelInput.value = STATE.settings.model || 'gpt-4.1-mini';
  updateModeBadge();
}

function updateModeBadge() {
  modeBadge.textContent = STATE.settings.apiKey ? `현재: 실제 AI 모드 (${STATE.settings.model})` : '현재: 데모 모드';
}

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return {}; }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function speakLastAssistant() {
  if (!STATE.lastAssistantText) return;
  if (!('speechSynthesis' in window)) {
    appendAssistant('이 브라우저는 음성 읽기를 지원하지 않아요.');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(STATE.lastAssistantText);
  utterance.lang = 'ko-KR';
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendAssistant('이 브라우저에서는 음성 인식을 지원하지 않아요. Chrome 계열 브라우저에서 시도해보세요.');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  appendAssistant('🎤 듣고 있어요... 영어로 말해보세요.');
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    appendAssistant(`들린 문장: ${transcript}`);
  };
  recognition.onerror = (event) => {
    appendAssistant(`음성 인식 오류: ${event.error}`);
  };
  recognition.start();
}

function setAvatar(face) {
  const img = avatarFace.querySelector('img');
  if (!img) {
    avatarFace.textContent = face;
    return;
  }

  const filters = {
    '😊': 'none',
    '🤔': 'saturate(0.9) brightness(0.95)',
    '🎤': 'drop-shadow(0 0 8px rgba(113,209,255,.45))',
  };
  img.style.filter = filters[face] || 'none';
}
