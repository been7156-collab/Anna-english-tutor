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
const proxyUrlInput = document.getElementById('proxyUrlInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const baseUrlInput = document.getElementById('baseUrlInput');
const modelInput = document.getElementById('modelInput');
const ttsModeSelect = document.getElementById('ttsModeSelect');
const ttsModelInput = document.getElementById('ttsModelInput');
const ttsVoiceInput = document.getElementById('ttsVoiceInput');
const ultraFastModeToggle = document.getElementById('ultraFastModeToggle');
const oneLineReplyToggle = document.getElementById('oneLineReplyToggle');
const handsFreeModeToggle = document.getElementById('handsFreeModeToggle');
const ultraFastMirrorToggle = document.getElementById('ultraFastMirrorToggle');
const oneLineMirrorToggle = document.getElementById('oneLineMirrorToggle');
const handsFreeMirrorToggle = document.getElementById('handsFreeMirrorToggle');
const callStatusBadge = document.getElementById('callStatusBadge');
const annaSubtitle = document.getElementById('annaSubtitle');
const annaStage = document.getElementById('annaStage');
const annaSpeakingBars = document.getElementById('annaSpeakingBars');
const stageVoiceBadge = document.getElementById('stageVoiceBadge');
const callSpeedBadge = document.getElementById('callSpeedBadge');
const callReplyBadge = document.getElementById('callReplyBadge');
const callHandsFreeBadge = document.getElementById('callHandsFreeBadge');
const stageMoodText = document.getElementById('stageMoodText');
const browserHint = document.getElementById('browserHint');
const settingsDetails = document.getElementById('settingsDetails');
const userVideo = document.getElementById('userVideo');
const selfVideoFallback = document.getElementById('selfVideoFallback');

const STATE = {
  messages: [],
  lastAssistantText: '',
  scenarioPrompted: false,
  settings: loadSettings(),
  voices: [],
  call: {
    active: false,
    stream: null,
    listening: false,
    recognition: null,
    resumeTimer: null,
    turnInFlight: false,
    heardFinal: false,
    currentAudio: null,
    currentAudioUrl: '',
    currentUtterance: null,
    assistantSpeaking: false,
  },
};

const THEME_OPENERS = {
  daily: 'Alright — tell me about your day.',
  cafe: 'Right, what would you like to order?',
  travel: 'Okay, tell me what you need for your trip.',
  church: 'Go on, then — tell me about your church.',
  worship: 'Right — tell me about today\'s worship rehearsal.',
  pastoral: 'How would you describe your ministry in English?'
};

const QUICK_GUIDES = {
  hint: '힌트만 줄게. 짧고 분명하게 말해봐.',
  answer: '바로 쓸 수 있는 영국영어 예문 하나 줄게.',
  natural: '더 자연스러운 영국영어 느낌으로 다듬어줄게.',
  idiom: '이 상황에서 영국영어로 쓸 만한 표현을 줄게.',
  grammar: '왜 고치는지 짧고 분명하게 설명해줄게.',
  retry: '좋아. 이번엔 더 짧고 자연스럽게 다시 말해봐.'
};

applySettingsUI();
primeVoices();
seedWelcome();
wireEvents();
applyEnvironmentHints();
refreshTutorSurface();
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
  document.getElementById('startVideoLessonBtn').addEventListener('click', startVideoConversation);
  document.getElementById('enableCameraBtn').addEventListener('click', enableCamera);
  document.getElementById('talkToAnnaBtn').addEventListener('click', startVideoConversation);
  document.getElementById('repeatAnnaBtn').addEventListener('click', speakLastAssistant);
  document.getElementById('endVideoLessonBtn').addEventListener('click', endVideoLesson);
  ttsModeSelect.addEventListener('change', refreshTutorSurface);
  ttsVoiceInput.addEventListener('input', refreshTutorSurface);
  ultraFastModeToggle.addEventListener('change', onConversationModeToggleChange);
  oneLineReplyToggle.addEventListener('change', onConversationModeToggleChange);
  handsFreeModeToggle.addEventListener('change', onConversationModeToggleChange);
  ultraFastMirrorToggle.addEventListener('change', syncMirrorToggleToMain);
  oneLineMirrorToggle.addEventListener('change', syncMirrorToggleToMain);
  handsFreeMirrorToggle.addEventListener('change', syncMirrorToggleToMain);
  closeFeedbackBtn.addEventListener('click', () => feedbackPanel.classList.add('hidden'));
  document.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', () => onQuickAction(btn.dataset.quick));
  });
}

function getVoiceBadgeLabel() {
  const voice = (STATE.settings.ttsVoice || 'nova').trim();
  return STATE.settings.ttsMode === 'openai'
    ? `Voice · ${voice}`
    : 'Voice · Browser';
}

function isUltraFastModeEnabled() {
  return Boolean(STATE.settings.ultraFastMode);
}

function isOneLineReplyModeEnabled() {
  return Boolean(STATE.settings.oneLineReplyMode);
}

function isHandsFreeModeEnabled() {
  return Boolean(STATE.settings.handsFreeMode);
}

function syncConversationModeControls() {
  if (ultraFastModeToggle) ultraFastModeToggle.checked = isUltraFastModeEnabled();
  if (oneLineReplyToggle) oneLineReplyToggle.checked = isOneLineReplyModeEnabled();
  if (handsFreeModeToggle) handsFreeModeToggle.checked = isHandsFreeModeEnabled();
  if (ultraFastMirrorToggle) ultraFastMirrorToggle.checked = isUltraFastModeEnabled();
  if (oneLineMirrorToggle) oneLineMirrorToggle.checked = isOneLineReplyModeEnabled();
  if (handsFreeMirrorToggle) handsFreeMirrorToggle.checked = isHandsFreeModeEnabled();
}

function onConversationModeToggleChange() {
  STATE.settings.ultraFastMode = Boolean(ultraFastModeToggle?.checked);
  STATE.settings.oneLineReplyMode = Boolean(oneLineReplyToggle?.checked);
  STATE.settings.handsFreeMode = Boolean(handsFreeModeToggle?.checked);
  syncConversationModeControls();
  persistSettings();
  updateModeBadge();
  refreshTutorSurface();
}

function syncMirrorToggleToMain(event) {
  if (event.currentTarget === ultraFastMirrorToggle && ultraFastModeToggle) {
    ultraFastModeToggle.checked = ultraFastMirrorToggle.checked;
  }
  if (event.currentTarget === oneLineMirrorToggle && oneLineReplyToggle) {
    oneLineReplyToggle.checked = oneLineMirrorToggle.checked;
  }
  if (event.currentTarget === handsFreeMirrorToggle && handsFreeModeToggle) {
    handsFreeModeToggle.checked = handsFreeMirrorToggle.checked;
  }
  onConversationModeToggleChange();
}

function persistSettings() {
  localStorage.setItem('englishTutorSettings', JSON.stringify(STATE.settings));
}

function getReplyStyleHints({ isVoiceCall = false } = {}) {
  const hints = [];
  if (isUltraFastModeEnabled()) {
    hints.push('Ultra-fast conversation mode is enabled. Prioritise immediate response over explanation.');
  }
  if (isVoiceCall && isOneLineReplyModeEnabled()) {
    hints.push('For this live call turn, keep the reply to exactly one short sentence unless safety or clarity absolutely requires more.');
  }
  return hints.join(' ');
}

function getReplyMaxTokens({ isVoiceCall = false } = {}) {
  if (isVoiceCall && isOneLineReplyModeEnabled()) return 55;
  if (isVoiceCall) return isUltraFastModeEnabled() ? 90 : 140;
  return 220;
}

function getReplyTemperature({ isVoiceCall = false } = {}) {
  if (isVoiceCall && isUltraFastModeEnabled()) return 0.45;
  if (isVoiceCall) return 0.6;
  return 0.8;
}

function getCallResumeDelay() {
  if (!STATE.call.active) return 120;
  if (isUltraFastModeEnabled()) return 40;
  return 120;
}

function clearOpenAiAudioPlayback() {
  if (STATE.call.currentAudio) {
    try {
      STATE.call.currentAudio.pause();
      STATE.call.currentAudio.currentTime = 0;
    } catch {}
  }
  if (STATE.call.currentAudioUrl) {
    try { URL.revokeObjectURL(STATE.call.currentAudioUrl); } catch {}
  }
  STATE.call.currentAudio = null;
  STATE.call.currentAudioUrl = '';
}

function stopCurrentSpeechPlayback({ resumeListening = false } = {}) {
  try { speechSynthesis?.cancel?.(); } catch {}
  clearOpenAiAudioPlayback();
  STATE.call.currentUtterance = null;
  STATE.call.assistantSpeaking = false;
  if (STATE.call.active) {
    setTutorMood('idle');
    updateCallStatus('화상 회화 중');
  }
  if (resumeListening && STATE.call.active) {
    queueCallListeningResume();
  }
}

function refreshTutorSurface() {
  if (stageVoiceBadge) stageVoiceBadge.textContent = getVoiceBadgeLabel();
  if (callSpeedBadge) callSpeedBadge.textContent = isUltraFastModeEnabled() ? 'Ultra-fast ON' : 'Ultra-fast OFF';
  if (callReplyBadge) callReplyBadge.textContent = isOneLineReplyModeEnabled() ? '1-line ON' : '1-line OFF';
  if (callHandsFreeBadge) callHandsFreeBadge.textContent = isHandsFreeModeEnabled() ? 'Hands-free ON' : 'Hands-free OFF';
  syncConversationModeControls();
  if (!stageMoodText || STATE.call.active) return;
  stageMoodText.textContent = isUltraFastModeEnabled()
    ? 'Ready for a very fast, natural British-English call.'
    : 'Ready for a natural British-English chat.';
}

function applyEnvironmentHints() {
  if (!browserHint) return;
  if (isEmbeddedMobileBrowser()) {
    browserHint.classList.remove('hidden');
    browserHint.textContent = '텔레그램/인스타 앱 안 브라우저에서는 마이크 인식이 약할 수 있어요. iPhone에서는 Safari나 Chrome으로 열면 카메라·음성 인식이 더 안정적입니다.';
    return;
  }
  browserHint.classList.add('hidden');
}

function seedWelcome() {
  appendAssistant(
`안녕하세요. 저는 **ANNA**예요.

실제 사람과 통화하듯, *짧고 자연스럽고 영국식*으로 같이 연습해볼게요.
- 먼저 대화를 이어가기
- 꼭 필요할 때만 짧게 교정하기
- 더 자연스러운 영국식 표현으로 바로 바꿔주기
- 카메라 회화 모드에서는 더 짧고 사람처럼 답하기

원하면 위의 **📹 카메라+회화 시작**으로 바로 시작해봐.`
  );
}

function onQuickAction(kind) {
  appendAssistant(`💡 ${QUICK_GUIDES[kind]}`);
  if (kind === 'answer') {
    appendAssistant(`예문: ${sampleAnswerForTheme(themeSelect.value)}`);
  }
  if (kind === 'idiom') {
    appendAssistant('추천 표현: Fair enough. / That makes sense. / Go on, then.');
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
  STATE.call.turnInFlight = Boolean(STATE.call.active && options.source?.includes('voice'));
  setAvatar('🤔');
  setTutorMood('thinking');
  if (STATE.call.active && options.source?.includes('voice')) {
    updateCallStatus('ANNA 답변 준비 중');
    updateAnnaSubtitle(isUltraFastModeEnabled() ? 'Right — one sec.' : 'Right — give me a second.');
  }
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
      await speakText(reply.speakText || reply.text);
    }
    if (STATE.call.active && options.source === 'voice-call') {
      queueCallListeningResume();
    }
  } catch (err) {
    appendAssistant(`오류가 있었어요: ${err.message}`);
    updateAnnaSubtitle('잠시 오류가 있었어요. 다시 한 번 말해볼까요?');
  } finally {
    STATE.call.turnInFlight = false;
    setAvatar('😊');
    setTutorMood('idle');
  }
}

function startScenario() {
  const theme = themeSelect.value;
  STATE.scenarioPrompted = true;
  const opener = THEME_OPENERS[theme];
  appendAssistant(`🎯 오늘의 테마: ${themeLabel(theme)}\n\n${opener}\n\n짧게 영국영어 느낌으로 답해봐. 막히면 한국어로 물어봐도 돼.`);
  updateAnnaSubtitle(opener);
}

function runHelperPrompt(kind) {
  const text = messageInput.value.trim();
  if (!text) {
    appendAssistant('먼저 아래 입력창에 문장을 적어줘 🙂');
    return;
  }

  const payloadMap = {
    translate: `다음 한국어를 외국인이 실제로 말할 자연스러운 영어로 바꿔줘: ${text}`,
    correct: `다음 영어 문장을 짧게 고쳐주고 더 자연스럽게 바꿔줘: ${text}`,
  };

  messageInput.value = '';
  handleUserTurn(payloadMap[kind], { autoSpeak: false, source: kind });
}

async function startVideoConversation() {
  if (STATE.call.assistantSpeaking) {
    stopCurrentSpeechPlayback();
  }
  if (STATE.call.turnInFlight) return;

  if (!STATE.call.active) {
    await startVideoLesson();
  }

  if (!STATE.call.stream) {
    await enableCamera();
  }

  startCallSpeechRecognition();
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
  const correction = feedback.correction ? `<div class="feedback-card"><h4>틀린 부분 / 교정</h4><p>${escapeHtml(feedback.correction)}</p></div>` : '';
  const natural = feedback.answer ? `<div class="feedback-card"><h4>다시 말하면 좋은 영어</h4><p>${escapeHtml(feedback.answer)}</p></div>` : '';
  const tip = feedback.explanation ? `<div class="feedback-card"><h4>한국어 설명</h4><p>${escapeHtml(feedback.explanation)}</p></div>` : '';
  const chips = (feedback.vocabulary || []).map((item) => `<span class="inline-chip">${escapeHtml(item)}</span>`).join('');
  const vocab = chips ? `<div class="feedback-card"><h4>추가로 써먹을 표현</h4><div>${chips}</div></div>` : '';
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
  if (getProxyBaseUrl()) {
    return proxyAiReply(userText);
  }
  return demoReply(userText);
}

async function realAiReply(userText) {
  const isVoiceCall = STATE.call.active;
  const model = pickReplyModel({ isVoiceCall });
  const recentMessages = getRecentMessagesForReply({ isVoiceCall });
  const replyStyleHints = getReplyStyleHints({ isVoiceCall });
  const system = [
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

  const voiceHint = isVoiceCall
    ? 'The user is speaking live in a call. Reply like a real British tutor on a phone call: quick, calm, and easy to say back to.'
    : '';

  const messages = [
    { role: 'system', content: `${system} ${replyStyleHints}`.trim() },
    ...recentMessages,
    { role: 'user', content: voiceHint ? `${voiceHint}\n\nUser said: ${userText}` : userText }
  ];

  const res = await fetch(`${STATE.settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STATE.settings.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: getReplyTemperature({ isVoiceCall }),
      response_format: { type: 'json_object' },
      max_tokens: getReplyMaxTokens({ isVoiceCall }),
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
    text: parsed.reply || 'Right — tell me a bit more.',
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

async function proxyAiReply(userText) {
  const isVoiceCall = STATE.call.active;
  const endpoint = `${getProxyBaseUrl()}/chat`;
  const payload = {
    userText,
    theme: themeSelect.value,
    difficulty: difficultySelect.value,
    isVoiceCall,
    recentMessages: getRecentMessagesForReply({ isVoiceCall }),
    model: pickReplyModel({ isVoiceCall }),
    ultraFastMode: isUltraFastModeEnabled(),
    oneLineReplyMode: isOneLineReplyModeEnabled(),
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`공개 AI 요청 실패 (${res.status}): ${text.slice(0, 180)}`);
  }

  const parsed = await res.json();
  return {
    text: parsed.reply || 'Right — tell me a bit more.',
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
      text: `No problem — you can just say, "${answer}"`,
      subtitle: answer,
      speakText: answer,
      feedback: {
        answer,
        correction: '',
        explanation: '막히면 이 한 문장을 그대로 따라 말하면 돼.',
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
        explanation: '이 문장 그대로 말하면 자연스러워.',
        vocabulary: vocabForTheme(theme).slice(0, 3),
      }
    };
  }

  const corrected = correctEnglishHeuristically(normalized);
  const natural = makeMoreNatural(corrected, theme);
  const needsCorrection = corrected !== normalized || natural !== corrected;
  const partnerReply = conversationalFollowUp(natural, theme);
  const correctionLine = needsCorrection ? `In British English, you could say, "${natural}"` : '';
  const explanation = needsCorrection ? '이렇게 바꾸면 영국영어로 훨씬 자연스러워.' : '';

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

  if (theme === 'daily') {
    if (/(went to church|church)/i.test(lower)) {
      return pickVariant(natural, [
        'Right. What did you do at church?',
        'Was it for worship or a meeting, then?',
        'I see. Who did you go with?'
      ]);
    }
    if (/(met|friend)/i.test(lower)) {
      return pickVariant(natural, [
        'Right. What did you and your friend get up to?',
        'Where did you meet, then?',
        'Fair enough. Was it good fun?'
      ]);
    }
    if (/(busy|tired)/i.test(lower)) {
      return pickVariant(natural, [
        'Sounds like a long day. What made it so busy?',
        'Right. Are you getting a bit of rest now?',
        'What kept you busy, then?'
      ]);
    }
    return pickVariant(natural, [
      'Right. What happened after that?',
      'Go on, then — tell me a bit more.',
      'Alright. What happened next?'
    ]);
  }

  if (theme === 'cafe') {
    if (lower.includes('americano')) {
      return pickVariant(natural, [
        'Right. Anything else for you?',
        'Would you like that hot or iced?',
        'Do you want anything to eat as well?'
      ]);
    }
    return pickVariant(natural, [
      'Alright. What would you like next?',
      'Is that for here or takeaway?',
      'Anything else today?'
    ]);
  }

  if (theme === 'travel') {
    return pickVariant(natural, [
      'Right. When is your flight?',
      'Which city are you flying to, then?',
      'Do you already have your boarding pass?'
    ]);
  }

  if (theme === 'church') {
    return pickVariant(natural, [
      'Right. What is your church known for?',
      'What sort of community does your church have?',
      'What do people usually notice when they visit?'
    ]);
  }

  if (theme === 'worship') {
    return pickVariant(natural, [
      'Right. What songs are you doing today?',
      'Who is leading worship today, then?',
      'Did you rehearse already?'
    ]);
  }

  if (theme === 'pastoral') {
    return pickVariant(natural, [
      'What part of ministry do you enjoy most?',
      'Who are you serving most these days?',
      'What has been on your heart lately in ministry?'
    ]);
  }

  return pickVariant(natural, [
    'Go on, then.',
    'Right. What happened next?',
    'Tell me a bit more.'
  ]);
}

function pickVariant(seedText, options) {
  const seed = String(seedText || '');
  const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return options[hash % options.length];
}

function translateKoreanHeuristically(text, theme) {
  const rules = [
    [/아이스 아메리카노.*주세요/, "I'd like an iced Americano, please."],
    [/오늘 교회.*모임/, 'I had a meeting at church today.'],
    [/주말.*교회.*쉬/, 'I usually go to church and rest on weekends.'],
    [/찬양팀.*연습/, 'We have worship team rehearsal today.'],
    [/처음.*교회/, 'This is my first time visiting this church.'],
    [/기도.*부탁/, 'Could you pray for me?'],
    [/잘 지냈/, 'I\'ve been alright. How about you?'],
    [/오늘.*바빴/, 'I was pretty busy today.'],
  ];
  for (const [pattern, out] of rules) {
    if (pattern.test(text)) return out;
  }

  const fallbacks = {
    daily: 'My day was fairly ordinary, but quite good.',
    cafe: "I'd like a drink, please.",
    travel: 'I need a bit of help with my flight.',
    church: 'Let me tell you a bit about our church.',
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
  out = out.replace(/\bvacation\b/gi, 'holiday');
  out = out.replace(/\bapartment\b/gi, 'flat');
  out = out.replace(/\belevator\b/gi, 'lift');
  out = out.replace(/\bsoccer\b/gi, 'football');
  out = out.replace(/\btakeout\b/gi, 'takeaway');
  out = out.replace(/\bsneakers\b/gi, 'trainers');
  if (theme === 'church') out = out.replace('I am a pastor', 'I serve as a pastor at our church');
  if (theme === 'worship') out = out.replace('practice', 'rehearsal');
  return out;
}

function vocabForTheme(theme) {
  const map = {
    daily: ['quite nice', 'not too bad', 'how about you?'],
    cafe: ["I'd like...", 'Anything else?', 'Eat in or takeaway?'],
    travel: ['check-in', 'boarding pass', 'hand luggage'],
    church: ['fellowship', 'Sunday service', 'small group'],
    worship: ['set list', 'rehearsal', 'key change'],
    pastoral: ['ministry', 'encourage', 'pray for'],
  };
  return map[theme] || [];
}

function sampleAnswerForTheme(theme) {
  const samples = {
    daily: "I had a busy day, but I'm doing alright.",
    cafe: "I'd like an iced Americano, please.",
    travel: 'I need to check in for my flight.',
    church: 'Our church is a warm community that values worship and fellowship.',
    worship: 'Today\'s set starts in G, and we move up at the end.',
    pastoral: 'I serve people through preaching, prayer, and pastoral care.',
  };
  return samples[theme] || 'Could you help me with this, please?';
}

function pickReplyModel({ isVoiceCall = false } = {}) {
  const configured = String(STATE.settings.model || 'gpt-4.1-mini').trim();
  if (isVoiceCall && isUltraFastModeEnabled()) {
    return configured === 'gpt-4.1-mini' ? 'gpt-4.1-nano' : configured;
  }
  return configured || 'gpt-4.1-mini';
}

function getRecentMessagesForReply({ isVoiceCall = false } = {}) {
  const historySize = isVoiceCall ? 4 : 10;
  return STATE.messages
    .slice(-historySize)
    .map((m) => ({ role: m.role, content: m.content }));
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
    proxyUrl: normalizeProxyUrl(proxyUrlInput.value),
    apiKey: apiKeyInput.value.trim(),
    baseUrl: baseUrlInput.value.trim() || 'https://api.openai.com/v1',
    model: modelInput.value.trim() || 'gpt-4.1-mini',
    ttsMode: ttsModeSelect.value || 'browser',
    ttsModel: ttsModelInput.value.trim() || 'gpt-4o-mini-tts',
    ttsVoice: ttsVoiceInput.value.trim() || 'nova',
    ultraFastMode: Boolean(ultraFastModeToggle?.checked),
    oneLineReplyMode: Boolean(oneLineReplyToggle?.checked),
    handsFreeMode: Boolean(handsFreeModeToggle?.checked),
  };
  persistSettings();
  updateModeBadge();
  refreshTutorSurface();
  if (settingsDetails) settingsDetails.open = false;
  appendAssistant(
    STATE.settings.apiKey
      ? '개인 API 설정 저장 완료. 이제 실제 AI 대화를 시도할게요.'
      : getProxyBaseUrl()
        ? '공개 AI 서버 설정 저장 완료. 이제 API 키 없이 실제 AI 대화를 시도할게요.'
        : '설정된 AI 서버가 없어서 데모 모드로 동작합니다.'
  );
}

function enableDemoMode() {
  STATE.settings.proxyUrl = '';
  STATE.settings.apiKey = '';
  proxyUrlInput.value = '';
  apiKeyInput.value = '';
  persistSettings();
  updateModeBadge();
  refreshTutorSurface();
  appendAssistant('데모 모드로 전환했어. 영국영어 톤으로 짧고 자연스럽게 보여줄게.');
}

function loadSettings() {
  const defaults = {
    proxyUrl: '',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    ttsMode: 'browser',
    ttsModel: 'gpt-4o-mini-tts',
    ttsVoice: 'nova',
    ultraFastMode: true,
    oneLineReplyMode: true,
    handsFreeMode: true,
  };

  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem('englishTutorSettings')) || {}) };
  } catch {
    return defaults;
  }
}

function applySettingsUI() {
  proxyUrlInput.value = STATE.settings.proxyUrl || '';
  apiKeyInput.value = STATE.settings.apiKey || '';
  baseUrlInput.value = STATE.settings.baseUrl || 'https://api.openai.com/v1';
  modelInput.value = STATE.settings.model || 'gpt-4.1-mini';
  ttsModeSelect.value = STATE.settings.ttsMode || 'browser';
  ttsModelInput.value = STATE.settings.ttsModel || 'gpt-4o-mini-tts';
  ttsVoiceInput.value = STATE.settings.ttsVoice || 'nova';
  syncConversationModeControls();
  if (settingsDetails) settingsDetails.open = Boolean(STATE.settings.apiKey || STATE.settings.proxyUrl);
  updateModeBadge();
}

function updateModeBadge() {
  const callModeLabel = `${isUltraFastModeEnabled() ? '초고속' : '기본속도'} · ${isOneLineReplyModeEnabled() ? '1문장' : '자유응답'} · ${isHandsFreeModeEnabled() ? '핸즈프리' : '수동청취'}`;
  if (STATE.settings.apiKey) {
    modeBadge.textContent = `개인 API 연결 · ${STATE.settings.model} · ${STATE.settings.ttsMode === 'openai' ? `AI 음성 ${STATE.settings.ttsVoice || 'nova'}` : '브라우저 음성'} · ${callModeLabel}`;
    return;
  }
  if (getProxyBaseUrl()) {
    modeBadge.textContent = `공개 AI 서버 연결 · ${STATE.settings.model} · ${STATE.settings.ttsMode === 'openai' ? `AI 음성 ${STATE.settings.ttsVoice || 'nova'}` : '브라우저 음성'} · ${callModeLabel}`;
    return;
  }
  modeBadge.textContent = `데모 모드 · 브라우저에서 바로 체험 가능 · ${callModeLabel}`;
}

function normalizeProxyUrl(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function getDefaultProxyBaseUrl() {
  const host = window.location.hostname || '';
  if (host === 'localhost' || host === '127.0.0.1') return '';
  if (host.endsWith('github.io')) return '';
  return `${window.location.origin}/api`;
}

function getProxyBaseUrl() {
  return normalizeProxyUrl(STATE.settings.proxyUrl || getDefaultProxyBaseUrl());
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
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text) ? 'ko-KR' : 'en-GB';
}

function primeVoices() {
  if (!('speechSynthesis' in window)) return;
  STATE.voices = window.speechSynthesis.getVoices();
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      STATE.voices = window.speechSynthesis.getVoices();
    };
  }
}

function extractBestSpeechText(text) {
  const raw = stripForSpeech(text);
  const englishChunks = raw.match(/[A-Za-z0-9][A-Za-z0-9,.'?!\-:;" ]*/g) || [];
  const english = englishChunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => /[A-Za-z]{2,}/.test(chunk))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (english.length >= 6) return english;
  return raw;
}

function stripForSpeech(text) {
  return String(text)
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function pickBestVoice(lang) {
  const voices = STATE.voices?.length ? STATE.voices : (window.speechSynthesis?.getVoices?.() || []);
  const lowerLang = (lang || 'en-GB').toLowerCase();
  const preferredNames = lowerLang.startsWith('en')
    ? ['samantha', 'ava', 'allison', 'serena', 'karen', 'moira', 'kate', 'siri female', 'google uk english female', 'google british english female', 'female']
    : ['yuna', 'sora', 'siri', 'google 한국의', 'google korean'];
  const avoidNames = lowerLang.startsWith('en')
    ? ['daniel', 'oliver', 'arthur', 'fred', 'jorge', 'male']
    : [];

  const matching = voices.filter((voice) => (voice.lang || '').toLowerCase().startsWith(lowerLang.slice(0, 2)));
  const filtered = matching.filter((voice) => !avoidNames.some((name) => (voice.name || '').toLowerCase().includes(name)));
  for (const name of preferredNames) {
    const found = filtered.find((voice) => (voice.name || '').toLowerCase().includes(name))
      || matching.find((voice) => (voice.name || '').toLowerCase().includes(name));
    if (found) return found;
  }

  return filtered[0] || matching[0] || voices[0] || null;
}

function speakLastAssistant() {
  if (!STATE.lastAssistantText) return;
  speakText(STATE.lastAssistantText);
}

async function speakText(text) {
  const speechText = extractBestSpeechText(text);
  const preferLowLatencyBrowserTts = STATE.call.active;
  const canUseOpenAiTts = STATE.settings.ttsMode === 'openai' && (STATE.settings.apiKey || getProxyBaseUrl());

  stopCurrentSpeechPlayback();

  if (!preferLowLatencyBrowserTts && canUseOpenAiTts) {
    const played = await speakWithOpenAITts(speechText);
    if (played) return true;
  }

  if (!('speechSynthesis' in window)) {
    if (canUseOpenAiTts) {
      const played = await speakWithOpenAITts(speechText);
      if (played) return true;
    }
    appendAssistant('이 브라우저는 음성 읽기를 지원하지 않아요.');
    return false;
  }

  const lang = detectSpeechLang(speechText);
  const utterance = new SpeechSynthesisUtterance(speechText);
  STATE.call.currentUtterance = utterance;
  utterance.lang = lang;
  utterance.voice = pickBestVoice(lang);
  utterance.rate = lang.startsWith('en') ? 0.95 : 1;
  utterance.pitch = lang.startsWith('en') ? 1.04 : 1;
  return new Promise((resolve) => {
    utterance.onstart = () => {
      STATE.call.assistantSpeaking = true;
      setTutorMood('speaking');
      if (STATE.call.active) updateCallStatus('ANNA 답변 중');
    };
    utterance.onend = () => {
      STATE.call.currentUtterance = null;
      STATE.call.assistantSpeaking = false;
      setTutorMood('idle');
      if (STATE.call.active) updateCallStatus('화상 회화 중');
      resolve(true);
    };
    utterance.onerror = () => {
      STATE.call.currentUtterance = null;
      STATE.call.assistantSpeaking = false;
      setTutorMood('idle');
      if (STATE.call.active) updateCallStatus('화상 회화 중');
      resolve(false);
    };
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });
}

async function speakWithOpenAITts(text) {
  try {
    const res = STATE.settings.apiKey
      ? await fetch(`${STATE.settings.baseUrl.replace(/\/$/, '')}/audio/speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STATE.settings.apiKey}`,
          },
          body: JSON.stringify({
            model: STATE.settings.ttsModel || 'gpt-4o-mini-tts',
            voice: STATE.settings.ttsVoice || 'shimmer',
            input: text,
            format: 'mp3'
          })
        })
      : await fetch(`${getProxyBaseUrl()}/speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: STATE.settings.ttsModel || 'gpt-4o-mini-tts',
            voice: STATE.settings.ttsVoice || 'shimmer',
            input: text,
            format: 'mp3'
          })
        });

    if (!res.ok) {
      return false;
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    STATE.call.currentAudio = audio;
    STATE.call.currentAudioUrl = audioUrl;
    await new Promise((resolve) => {
      audio.onplay = () => {
        STATE.call.assistantSpeaking = true;
        setTutorMood('speaking');
        if (STATE.call.active) updateCallStatus('ANNA 답변 중');
      };
      audio.onended = () => {
        STATE.call.assistantSpeaking = false;
        clearOpenAiAudioPlayback();
        setTutorMood('idle');
        if (STATE.call.active) updateCallStatus('화상 회화 중');
        resolve(true);
      };
      audio.onerror = () => {
        STATE.call.assistantSpeaking = false;
        clearOpenAiAudioPlayback();
        setTutorMood('idle');
        if (STATE.call.active) updateCallStatus('화상 회화 중');
        resolve(false);
      };
      audio.play().catch(() => {
        STATE.call.assistantSpeaking = false;
        clearOpenAiAudioPlayback();
        setTutorMood('idle');
        if (STATE.call.active) updateCallStatus('화상 회화 중');
        resolve(false);
      });
    });
    return true;
  } catch {
    return false;
  }
}

function queueCallListeningResume() {
  if (!STATE.call.active || !isHandsFreeModeEnabled()) return;
  if (STATE.call.resumeTimer) {
    clearTimeout(STATE.call.resumeTimer);
  }
  STATE.call.resumeTimer = setTimeout(() => {
    STATE.call.resumeTimer = null;
    if (!STATE.call.active || STATE.call.listening || STATE.call.turnInFlight || STATE.call.assistantSpeaking) return;
    startCallSpeechRecognition();
  }, getCallResumeDelay());
}

function isEmbeddedMobileBrowser() {
  const ua = navigator.userAgent || '';
  return /Telegram|Instagram|FBAN|FBAV|Line|KAKAOTALK|NAVER|wv|WebView/i.test(ua);
}

function voiceSupportHint() {
  if (isEmbeddedMobileBrowser()) {
    return '지금은 앱 안 브라우저(예: 텔레그램 내부 브라우저)라서 음성 인식이 잘 안 될 수 있어요. Safari나 Chrome에서 링크를 직접 열어 다시 시도해보세요.';
  }
  return '이 브라우저의 음성 인식 지원이 약할 수 있어요. Safari나 Chrome 최신 버전에서 다시 시도해보세요.';
}

function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendAssistant(voiceSupportHint());
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-GB';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  appendAssistant('🎤 듣고 있어요... 영어로 말해보세요.');
  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript.trim();
    messageInput.value = transcript;
    appendAssistant(`들린 문장: ${transcript}`);
    await handleUserTurn(transcript, { autoSpeak: true, source: 'voice' });
    messageInput.value = '';
  };
  recognition.onerror = (event) => {
    appendAssistant(`음성 인식 오류: ${event.error}`);
  };
  recognition.start();
}

async function startVideoLesson() {
  STATE.call.active = true;
  STATE.call.turnInFlight = false;
  STATE.call.heardFinal = false;
  updateCallStatus('화상 회화 중');
  updateAvatarStatus('ANNA가 화상 회화 준비중');
  annaStage.classList.add('call-active');
  updateAnnaSubtitle('Right — start with one short sentence.');
  if (stageMoodText) {
    stageMoodText.textContent = isHandsFreeModeEnabled()
      ? 'Hands-free call mode is ready. Just keep talking naturally.'
      : 'Camera-call mode is ready. One short sentence is enough.';
  }
  appendAssistant(
    isHandsFreeModeEnabled()
      ? '📹 화상 회화 모드를 시작했어. 이제 핸즈프리로 갈게. 한 번 말하면 내가 답하고 다시 자동으로 들을게. 내가 말하는 중에 바로 끼어들고 싶으면 “🎙️ 지금 말하고 답받기”를 다시 누르면 돼.'
      : '📹 화상 회화 모드를 시작했어. 실제 통화처럼 짧고 자연스럽게 가보자. 먼저 한 문장만 영어로 말해봐. 막히면 “I don\'t know”라고 해도 내가 바로 이어줄게.'
  );
  if (!isHandsFreeModeEnabled()) {
    speakText('Right — start with one short sentence.');
  }
}

async function enableCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    appendAssistant('이 브라우저에서는 카메라 접근을 지원하지 않아요.');
    return;
  }

  try {
    if (!STATE.call.stream) {
      STATE.call.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      userVideo.srcObject = STATE.call.stream;
    }
    userVideo.classList.add('active');
    selfVideoFallback.classList.add('hidden');
    updateAvatarStatus('카메라 연결됨');
    appendAssistant('📷 카메라 켰어. 이제 ANNA랑 마주 보고 짧게 말해봐.');
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
    appendAssistant(voiceSupportHint());
    return;
  }

  if (STATE.call.assistantSpeaking) {
    stopCurrentSpeechPlayback();
  }

  if (STATE.call.listening || STATE.call.turnInFlight) return;

  const recognition = new SpeechRecognition();
  STATE.call.recognition = recognition;
  STATE.call.listening = true;
  STATE.call.heardFinal = false;
  recognition.lang = 'en-GB';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  annaStage.classList.add('call-listening');
  updateCallStatus('듣는 중');
  updateAnnaSubtitle("I'm listening. Go on.");
  setAvatar('🎤');
  setTutorMood('listening');

  recognition.onresult = async (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0]?.transcript?.trim() || '';
      if (!transcript) continue;
      if (result.isFinal) {
        finalTranscript += `${transcript} `;
      } else {
        interimTranscript += `${transcript} `;
      }
    }

    const liveTranscript = (interimTranscript || finalTranscript).trim();
    if (liveTranscript) {
      updateAnnaSubtitle(`You said: ${liveTranscript}`);
    }

    const transcript = finalTranscript.trim();
    if (!transcript) return;

    STATE.call.heardFinal = true;
    STATE.call.listening = false;
    annaStage.classList.remove('call-listening');
    updateCallStatus('화상 회화 중');
    setTutorMood('idle');
    messageInput.value = transcript;
    try { recognition.stop(); } catch {}
    await handleUserTurn(transcript, { autoSpeak: true, source: 'voice-call' });
    messageInput.value = '';
  };

  recognition.onerror = (event) => {
    STATE.call.listening = false;
    annaStage.classList.remove('call-listening');
    updateCallStatus('화상 회화 중');
    const hint = ['not-allowed', 'service-not-allowed'].includes(event.error)
      ? ` ${voiceSupportHint()}`
      : '';
    updateAnnaSubtitle(`음성 인식 오류: ${event.error}`);
    appendAssistant(`음성 인식 오류: ${event.error}.${hint}`);
    setAvatar('😊');
    setTutorMood('idle');
    if (STATE.call.active && event.error === 'no-speech') {
      queueCallListeningResume();
    }
  };

  recognition.onend = () => {
    STATE.call.listening = false;
    annaStage.classList.remove('call-listening');
    if (STATE.call.active) updateCallStatus('화상 회화 중');
    setAvatar('😊');
    setTutorMood('idle');
    if (STATE.call.active && !STATE.call.heardFinal && !STATE.call.turnInFlight) {
      queueCallListeningResume();
    }
  };

  recognition.start();
}

function endVideoLesson() {
  if (STATE.call.resumeTimer) {
    clearTimeout(STATE.call.resumeTimer);
    STATE.call.resumeTimer = null;
  }
  stopCurrentSpeechPlayback();
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
  STATE.call.turnInFlight = false;
  STATE.call.heardFinal = false;
  STATE.call.assistantSpeaking = false;
  STATE.call.currentUtterance = null;
  clearOpenAiAudioPlayback();
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
  if (!stageMoodText) return;
  const map = {
    '통화 전': 'Ready for a natural British-English chat.',
    '화상 회화 중': 'Stay relaxed — short answers are best.',
    '듣는 중': 'I\'m listening. Go on.',
    'ANNA 답변 중': 'ANNA is replying in a calm British tone.',
    'ANNA 답변 준비 중': 'Give me a second — shaping a natural reply.',
    '통화 종료': 'Call ended. You can restart any time.',
  };
  stageMoodText.textContent = map[text] || text;
}

function updateAnnaSubtitle(text) {
  annaSubtitle.textContent = stripForSpeech(text).slice(0, 220);
}

function updateAvatarStatus(text) {
  if (avatarStatusText) avatarStatusText.textContent = text;
}

function setTutorMood(mode) {
  annaStage.classList.remove('mood-idle', 'mood-thinking', 'mood-listening', 'mood-speaking', 'call-speaking');
  avatarFace.classList.remove('mood-idle', 'mood-thinking', 'mood-listening', 'mood-speaking');

  if (mode === 'speaking') {
    annaSpeakingBars.classList.remove('hidden');
    annaStage.classList.add('call-active', 'mood-speaking', 'call-speaking');
    avatarFace.classList.add('mood-speaking');
    updateAvatarStatus('ANNA가 말하는 중');
    if (stageMoodText) stageMoodText.textContent = 'ANNA is speaking now — listen for the rhythm.';
    return;
  }
  if (mode === 'thinking') {
    annaSpeakingBars.classList.add('hidden');
    annaStage.classList.add('mood-thinking');
    avatarFace.classList.add('mood-thinking');
    updateAvatarStatus('ANNA가 생각하는 중');
    if (stageMoodText) stageMoodText.textContent = 'Thinking of the most natural way to say it.';
    return;
  }
  if (mode === 'listening') {
    annaSpeakingBars.classList.add('hidden');
    annaStage.classList.add('mood-listening');
    avatarFace.classList.add('mood-listening');
    updateAvatarStatus('ANNA가 듣는 중');
    if (stageMoodText) stageMoodText.textContent = 'I\'m listening — say it in one short line.';
    return;
  }
  annaSpeakingBars.classList.add('hidden');
  annaStage.classList.add('mood-idle');
  avatarFace.classList.add('mood-idle');
  updateAvatarStatus(STATE.call.active ? '화상 회화 준비 완료' : 'AI 튜터 대기중');
  if (stageMoodText) stageMoodText.textContent = STATE.call.active
    ? 'Stay relaxed — short answers are best.'
    : 'Ready for a natural British-English chat.';
}

function setAvatar(face) {
  avatarFace.classList.remove('avatar-thinking', 'avatar-speaking', 'avatar-listening');
  annaStage.classList.remove('avatar-thinking', 'avatar-speaking', 'avatar-listening');
  if (face === '🤔') {
    avatarFace.classList.add('avatar-thinking');
    annaStage.classList.add('avatar-thinking');
    return;
  }
  if (face === '🎤') {
    avatarFace.classList.add('avatar-listening');
    annaStage.classList.add('avatar-listening');
    return;
  }
  if (face === '😊') {
    avatarFace.classList.add('avatar-speaking');
    annaStage.classList.add('avatar-speaking');
  }
}
