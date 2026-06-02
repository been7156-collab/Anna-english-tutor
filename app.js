const chatWindow = document.getElementById('chatWindow');
const composerForm = document.getElementById('composerForm');
const messageInput = document.getElementById('messageInput');
const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackContent = document.getElementById('feedbackContent');
const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
const avatarFace = document.getElementById('avatarFace');
const avatarStatusText = document.getElementById('avatarStatusText');
const themeSelect = document.getElementById('themeSelect');
const difficultySelect = document.getElementById('difficultySelect');
const modeBadge = document.getElementById('modeBadge');
const apiKeyInput = document.getElementById('apiKeyInput');
const baseUrlInput = document.getElementById('baseUrlInput');
const modelInput = document.getElementById('modelInput');
const callStatusBadge = document.getElementById('callStatusBadge');
const annaSubtitle = document.getElementById('annaSubtitle');
const annaStage = document.getElementById('annaStage');
const annaSpeakingBars = document.getElementById('annaSpeakingBars');
const userVideo = document.getElementById('userVideo');
const selfVideoFallback = document.getElementById('selfVideoFallback');

const STATE = {
  messages: [],
  lastAssistantText: '',
  scenarioPrompted: false,
  settings: loadSettings(),
  call: {
    active: false,
    stream: null,
    listening: false,
    recognition: null,
  },
};

const THEME_OPENERS = {
  daily: 'Hi! Tell me something about your day.',
  cafe: 'Hi! What would you like to order today?',
  travel: 'Hello! How can I help you with your trip today?',
  church: 'Hi! Could you introduce your church to me?',
  worship: 'Hey! Tell me about today\'s worship rehearsal.',
  pastoral: 'Hi pastor! How would you describe your ministry in English?'
};

const QUICK_GUIDES = {
  hint: '힌트만 짧게 드릴게요. 먼저 쉬운 문장으로 말해보세요.',
  answer: '바로 쓸 수 있는 자연스러운 예문을 하나 드릴게요.',
  natural: '더 자연스럽게 들리도록 다듬어드릴게요.',
  idiom: '이 상황에서 외국인이 자주 쓰는 표현을 알려드릴게요.',
  grammar: '틀린 이유를 짧고 쉽게 설명해드릴게요.',
  retry: '좋아요. 이번엔 조금 더 짧고 자연스럽게 다시 말해보세요.'
};

applySettingsUI();
seedWelcome();
wireEvents();
updateCallStatus('통화 전');

function wireEvents() {
  composerForm.addEventListener('submit', onSubmit);
  document.getElementById('startScenarioBtn').addEventListener('click', startScenario);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettingsFromUI);
  document.getElementById('demoModeBtn').addEventListener('click', enableDemoMode);
  document.getElementById('translateMyKoreanBtn').addEventListener('click', () => runHelperPrompt('translate'));
  document.getElementById('correctMyEnglishBtn').addEventListener('click', () => runHelperPrompt('correct'));
  document.getElementById('voiceBtn').addEventListener('click', startSpeechRecognition);
  document.getElementById('speakLastBtn').addEventListener('click', speakLastAssistant);
  document.getElementById('startVideoLessonBtn').addEventListener('click', startVideoLesson);
  document.getElementById('enableCameraBtn').addEventListener('click', enableCamera);
  document.getElementById('talkToAnnaBtn').addEventListener('click', startCallSpeechRecognition);
  document.getElementById('repeatAnnaBtn').addEventListener('click', speakLastAssistant);
  document.getElementById('endVideoLessonBtn').addEventListener('click', endVideoLesson);
  closeFeedbackBtn.addEventListener('click', () => feedbackPanel.classList.add('hidden'));
  document.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', () => onQuickAction(btn.dataset.quick));
  });
}

function seedWelcome() {
  appendAssistant(
`안녕하세요! 저는 **ANNA 영어쌤**이에요 😊

이제는 더 자연스럽게 대화할게요.
- 먼저 편하게 대화하기
- 필요할 때만 짧게 교정하기
- 막히면 바로 따라 말할 문장 주기

원하시면 위의 **📹 화상 회화 시작**으로 더 실제 대화처럼 연습할 수 있어요.`
  );
}

function onQuickAction(kind) {
  appendAssistant(`💡 ${QUICK_GUIDES[kind]}`);
  if (kind === 'answer') {
    appendAssistant(`예문: ${sampleAnswerForTheme(themeSelect.value)}`);
  }
  if (kind === 'idiom') {
    appendAssistant('추천 표현: That makes sense. / Fair enough. / I see what you mean.');
  }
}

async function onSubmit(e) {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  await handleUserTurn(text, { autoSpeak: STATE.call.active, source: 'text' });
  messageInput.value = '';
}

async function handleUserTurn(text, options = {}) {
  appendUser(text);
  setAvatar('🤔');
  setTutorMood('thinking');
  try {
    const reply = await generateTutorReply(text);
    appendAssistant(reply.text);
    updateAnnaSubtitle(reply.subtitle || reply.text);
    if (reply.feedback && hasVisibleFeedback(reply.feedback)) {
      renderFeedback(reply.feedback);
    } else {
      clearFeedback();
    }
    if (options.autoSpeak) {
      speakText(reply.speakText || reply.text);
    }
  } catch (err) {
    appendAssistant(`오류가 있었어요: ${err.message}`);
    updateAnnaSubtitle('잠시 오류가 있었어요. 다시 한 번 말해볼까요?');
  } finally {
    setAvatar('😊');
    setTutorMood('idle');
  }
}

function startScenario() {
  const theme = themeSelect.value;
  STATE.scenarioPrompted = true;
  const opener = THEME_OPENERS[theme];
  appendAssistant(`🎯 오늘의 테마: ${themeLabel(theme)}\n\n${opener}\n\n짧게 영어로 대답해보세요. 막히면 한국어로 물어보셔도 돼요.`);
  updateAnnaSubtitle(opener);
}

function runHelperPrompt(kind) {
  const text = messageInput.value.trim();
  if (!text) {
    appendAssistant('먼저 아래 입력창에 문장을 적어주세요 🙂');
    return;
  }

  const payloadMap = {
    translate: `다음 한국어를 외국인이 실제로 말할 자연스러운 영어로 바꿔줘: ${text}`,
    correct: `다음 영어 문장을 짧게 고쳐주고 더 자연스럽게 바꿔줘: ${text}`,
  };

  messageInput.value = '';
  handleUserTurn(payloadMap[kind], { autoSpeak: false, source: kind });
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
  const correction = feedback.correction ? `<div class="feedback-card"><h4>짧은 교정</h4><p>${escapeHtml(feedback.correction)}</p></div>` : '';
  const natural = feedback.answer ? `<div class="feedback-card"><h4>자연스러운 표현</h4><p>${escapeHtml(feedback.answer)}</p></div>` : '';
  const tip = feedback.explanation ? `<div class="feedback-card"><h4>짧은 설명</h4><p>${escapeHtml(feedback.explanation)}</p></div>` : '';
  const chips = (feedback.vocabulary || []).map((item) => `<span class="inline-chip">${escapeHtml(item)}</span>`).join('');
  const vocab = chips ? `<div class="feedback-card"><h4>쓸 만한 표현</h4><div>${chips}</div></div>` : '';
  feedbackContent.innerHTML = `<div class="feedback-grid">${natural}${correction}${tip}${vocab}</div>`;
}

function clearFeedback() {
  feedbackPanel.classList.add('hidden');
  feedbackContent.innerHTML = '';
}

function hasVisibleFeedback(feedback) {
  return Boolean(feedback.answer || feedback.correction || feedback.explanation || (feedback.vocabulary || []).length);
}

async function generateTutorReply(userText) {
  if (STATE.settings.apiKey) {
    return realAiReply(userText);
  }
  return demoReply(userText);
}

async function realAiReply(userText) {
  const system = [
    'You are ANNA, a warm native-speaker style English conversation partner for a Korean learner.',
    'The user dislikes AI-sounding phrasing and long analysis.',
    'Sound like a real friendly native speaker in everyday conversation.',
    'Lead with the natural conversational reply first, not a lesson.',
    'Only correct briefly when needed, and keep the correction casual and short.',
    'If the user says they do not know, give one simple line they can copy and then keep the conversation moving.',
    'Use Korean only for very short support when helpful.',
    'Return valid JSON with keys: reply, answer, correction, explanation, vocabulary, subtitle, speakText.'
  ].join(' ');

  const messages = [
    { role: 'system', content: system },
    ...STATE.messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
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
      temperature: 0.8,
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
    text: parsed.reply || 'Sure. Tell me a little more.',
    subtitle: parsed.subtitle || parsed.reply || '',
    speakText: parsed.speakText || parsed.answer || parsed.reply || '',
    feedback: {
      answer: parsed.answer || '',
      correction: parsed.correction || '',
      explanation: parsed.explanation || '',
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.slice(0, 4) : [],
    }
  };
}

async function demoReply(userText) {
  const theme = themeSelect.value;
  const isKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(userText);
  const normalized = userText.trim();
  const lower = normalized.toLowerCase();

  if (/^(i don't know|i dont know|모르겠|잘 모르겠)/i.test(lower) || /모르겠/.test(normalized)) {
    const answer = sampleAnswerForTheme(theme);
    return {
      text: `No worries — you can just say, "${answer}"`,
      subtitle: answer,
      speakText: answer,
      feedback: {
        answer,
        correction: '',
        explanation: '모를 때는 먼저 짧은 문장 하나를 그대로 따라 말하면 됩니다.',
        vocabulary: [],
      }
    };
  }

  if (isKorean) {
    const answer = translateKoreanHeuristically(normalized, theme);
    const natural = makeMoreNatural(answer, theme);
    return {
      text: `${natural}`,
      subtitle: natural,
      speakText: natural,
      feedback: {
        answer: natural,
        correction: '',
        explanation: '이 문장 그대로 말하시면 자연스럽습니다.',
        vocabulary: vocabForTheme(theme).slice(0, 3),
      }
    };
  }

  const corrected = correctEnglishHeuristically(normalized);
  const natural = makeMoreNatural(corrected, theme);
  const needsCorrection = corrected !== normalized || natural !== corrected;
  const partnerReply = conversationalFollowUp(natural, theme);
  const correctionLine = needsCorrection ? `You could also say, "${natural}"` : '';
  const explanation = needsCorrection ? '이렇게만 바꾸면 훨씬 자연스러워요.' : '';

  return {
    text: `${partnerReply}${correctionLine ? `\n\n${correctionLine}` : ''}`,
    subtitle: partnerReply,
    speakText: partnerReply,
    feedback: needsCorrection ? {
      answer: natural,
      correction: corrected,
      explanation,
      vocabulary: vocabForTheme(theme).slice(0, 3),
    } : null,
  };
}

function conversationalFollowUp(natural, theme) {
  const lower = natural.toLowerCase();
  if (theme === 'daily') return 'Nice! What did you do after that?';
  if (theme === 'cafe') return lower.includes('americano') ? 'Great choice. Would you like anything else?' : 'Sounds good. What would you like next?';
  if (theme === 'travel') return 'Got it. When is your flight?';
  if (theme === 'church') return 'That sounds lovely. What is your church known for?';
  if (theme === 'worship') return 'Nice. What songs are you doing today?';
  if (theme === 'pastoral') return 'I see. What part of ministry do you enjoy the most?';
  return 'I see. Can you tell me a little more?';
}

function translateKoreanHeuristically(text, theme) {
  const rules = [
    [/아이스 아메리카노.*주세요/, "I'd like an iced Americano, please."],
    [/오늘 교회.*모임/, 'I had a meeting at church today.'],
    [/주말.*교회.*쉬/, 'I usually go to church and rest on weekends.'],
    [/찬양팀.*연습/, 'We have worship team rehearsal today.'],
    [/처음.*교회/, 'This is my first time visiting this church.'],
    [/기도.*부탁/, 'Could you pray for me?'],
    [/잘 지냈/, 'I\'ve been doing well. How about you?'],
    [/오늘.*바빴/, 'I was pretty busy today.'],
  ];
  for (const [pattern, out] of rules) {
    if (pattern.test(text)) return out;
  }

  const fallbacks = {
    daily: 'I had a pretty normal day, but it was good.',
    cafe: "I'd like a drink, please.",
    travel: 'I need some help with my flight.',
    church: 'Let me tell you a little about our church.',
    worship: 'We are getting ready for worship today.',
    pastoral: 'I serve people through ministry and prayer.'
  };

  return fallbacks[theme] || 'Could you help me say this in English?';
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
  let out = text;
  if (theme === 'cafe' && /Americano/i.test(out) && !/please/i.test(out)) out = `${out.replace(/\.$/, '')}, please.`;
  if (theme === 'church') out = out.replace('I am a pastor', 'I serve as a pastor at our church');
  if (theme === 'worship') out = out.replace('practice', 'rehearsal');
  return out;
}

function vocabForTheme(theme) {
  const map = {
    daily: ['pretty good', 'not bad', 'how about you?'],
    cafe: ["I'd like...", 'Anything else?', 'For here or to go?'],
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
    cafe: "I'd like an iced Americano, please.",
    travel: 'I need to check in for my flight.',
    church: 'Our church is a warm community that loves worship and fellowship.',
    worship: 'Today\'s set starts in G, and we move up at the end.',
    pastoral: 'I serve people through preaching, prayer, and pastoral care.',
  };
  return samples[theme] || 'Could you help me with this?';
}

function themeLabel(theme) {
  return {
    daily: '일상 대화',
    cafe: '카페 주문',
    travel: '여행 / 공항',
    church: '교회 소개',
    worship: '찬양팀 / 예배',
    pastoral: '목회 / 교제'
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
    ? 'API 설정 저장 완료. 이제 더 자연스러운 실제 AI 대화를 시도할게요.'
    : 'API 키가 비어 있어서 데모 모드로 동작합니다.');
}

function enableDemoMode() {
  STATE.settings.apiKey = '';
  apiKeyInput.value = '';
  localStorage.setItem('englishTutorSettings', JSON.stringify(STATE.settings));
  updateModeBadge();
  appendAssistant('데모 모드로 전환했어요. 짧고 자연스럽게 대화하는 흐름 위주로 보여드릴게요.');
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('englishTutorSettings')) || {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1-mini'
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
  modeBadge.textContent = STATE.settings.apiKey
    ? `현재: 실제 AI 대화 모드 (${STATE.settings.model})`
    : '현재: 데모 모드';
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function detectSpeechLang(text) {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text) ? 'ko-KR' : 'en-US';
}

function stripForSpeech(text) {
  return String(text)
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function speakLastAssistant() {
  if (!STATE.lastAssistantText) return;
  speakText(STATE.lastAssistantText);
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    appendAssistant('이 브라우저는 음성 읽기를 지원하지 않아요.');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
  utterance.lang = detectSpeechLang(text);
  utterance.rate = 0.98;
  utterance.onstart = () => setTutorMood('speaking');
  utterance.onend = () => setTutorMood('idle');
  utterance.onerror = () => setTutorMood('idle');
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

async function startVideoLesson() {
  STATE.call.active = true;
  updateCallStatus('화상 회화 중');
  updateAvatarStatus('ANNA가 화상 회화 준비중');
  annaStage.classList.add('call-active');
  updateAnnaSubtitle('Hi! Let\'s talk naturally. You can start with one short sentence.');
  appendAssistant('📹 화상 회화 모드를 시작했어요. 먼저 한 문장만 영어로 말해보세요. 막히면 “I don\'t know”라고 해도 제가 이어서 도와드릴게요.');
  speakText('Hi! Let\'s talk naturally. You can start with one short sentence.');
}

async function enableCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    appendAssistant('이 브라우저에서는 카메라 접근을 지원하지 않아요.');
    return;
  }

  try {
    if (!STATE.call.stream) {
      STATE.call.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      userVideo.srcObject = STATE.call.stream;
    }
    userVideo.classList.add('active');
    selfVideoFallback.classList.add('hidden');
    updateAvatarStatus('카메라 연결됨');
    appendAssistant('📷 카메라를 켰어요. 이제 ANNA와 마주 보고 연습하는 느낌으로 말해보세요.');
  } catch (err) {
    appendAssistant(`카메라를 켜지 못했어요: ${err.message}`);
  }
}

function startCallSpeechRecognition() {
  if (!STATE.call.active) {
    startVideoLesson();
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendAssistant('이 브라우저에서는 음성 인식을 지원하지 않아요. Safari/Chrome 최신 버전에서 시도해보세요.');
    return;
  }

  if (STATE.call.listening) return;

  const recognition = new SpeechRecognition();
  STATE.call.recognition = recognition;
  STATE.call.listening = true;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  annaStage.classList.add('call-listening');
  updateCallStatus('듣는 중');
  updateAnnaSubtitle('I am listening... Go ahead.');
  setAvatar('🎤');

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript.trim();
    messageInput.value = transcript;
    updateAnnaSubtitle(`You said: ${transcript}`);
    STATE.call.listening = false;
    annaStage.classList.remove('call-listening');
    updateCallStatus('화상 회화 중');
    await handleUserTurn(transcript, { autoSpeak: true, source: 'voice-call' });
  };

  recognition.onerror = (event) => {
    STATE.call.listening = false;
    annaStage.classList.remove('call-listening');
    updateCallStatus('화상 회화 중');
    updateAnnaSubtitle(`음성 인식 오류: ${event.error}`);
    appendAssistant(`음성 인식 오류: ${event.error}`);
    setAvatar('😊');
  };

  recognition.onend = () => {
    STATE.call.listening = false;
    annaStage.classList.remove('call-listening');
    if (STATE.call.active) updateCallStatus('화상 회화 중');
    setAvatar('😊');
  };

  recognition.start();
}

function endVideoLesson() {
  if (STATE.call.recognition) {
    try { STATE.call.recognition.stop(); } catch {}
    STATE.call.recognition = null;
  }
  if (STATE.call.stream) {
    STATE.call.stream.getTracks().forEach((track) => track.stop());
    STATE.call.stream = null;
  }
  STATE.call.active = false;
  STATE.call.listening = false;
  userVideo.srcObject = null;
  userVideo.classList.remove('active');
  selfVideoFallback.classList.remove('hidden');
  annaStage.classList.remove('call-active', 'call-listening');
  updateCallStatus('통화 종료');
  updateAvatarStatus('AI 튜터 대기중');
  updateAnnaSubtitle('화상 회화를 종료했어요. 다시 시작할 수 있어요.');
  speechSynthesis?.cancel?.();
  appendAssistant('📴 화상 회화를 종료했어요. 채팅으로 계속 연습하셔도 됩니다.');
}

function updateCallStatus(text) {
  callStatusBadge.textContent = text;
}

function updateAnnaSubtitle(text) {
  annaSubtitle.textContent = stripForSpeech(text).slice(0, 220);
}

function updateAvatarStatus(text) {
  if (avatarStatusText) avatarStatusText.textContent = text;
}

function setTutorMood(mode) {
  if (mode === 'speaking') {
    annaSpeakingBars.classList.remove('hidden');
    annaStage.classList.add('call-active');
    updateAvatarStatus('ANNA가 말하는 중');
    return;
  }
  if (mode === 'thinking') {
    annaSpeakingBars.classList.add('hidden');
    updateAvatarStatus('ANNA가 생각하는 중');
    return;
  }
  annaSpeakingBars.classList.add('hidden');
  updateAvatarStatus(STATE.call.active ? '화상 회화 준비 완료' : 'AI 튜터 대기중');
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
