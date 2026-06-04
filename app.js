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
const callTimerBadge = document.getElementById('callTimerBadge');
const stageMoodText = document.getElementById('stageMoodText');
const browserHint = document.getElementById('browserHint');
const settingsDetails = document.getElementById('settingsDetails');
const userVideo = document.getElementById('userVideo');
const selfVideoFallback = document.getElementById('selfVideoFallback');
const threadPresenceText = document.getElementById('threadPresenceText');
const callFlowHint = document.getElementById('callFlowHint');
const callCoachHint = document.getElementById('callCoachHint');
const installHintCard = document.getElementById('installHintCard');
const onboardingCard = document.getElementById('onboardingCard');
const onboardingModal = document.getElementById('onboardingModal');
const callSessionPreset = document.getElementById('callSessionPreset');
const callSessionSubcopy = document.getElementById('callSessionSubcopy');
const callLiveFocus = document.getElementById('callLiveFocus');

const STATE = {
  messages: [],
  lastAssistantText: '',
  scenarioPrompted: false,
  settings: loadSettings(),
  voices: [],
  typingIndicator: null,
  fallbackNoticeShown: false,
  providerState: {
    fallbackUntil: 0,
    lastErrorKind: '',
  },
  call: {
    active: false,
    stream: null,
    listening: false,
    recognition: null,
    noSpeechCount: 0,
    noSpeechHintShown: false,
    resumeTimer: null,
    startedAt: null,
    clockTimer: null,
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

const LIVE_CALL_OPENERS = {
  daily: 'Hi — good to see you. How has your day been so far?',
  cafe: 'Hi — alright, what are you in the mood to order today?',
  travel: 'Hi — where are you off to, then?',
  church: 'Hi — tell me a little about your church.',
  worship: 'Hi — how is worship rehearsal going today?',
  pastoral: 'Hi — how would you describe your ministry in one short sentence?'
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
applyStandaloneUiHints();
applyOnboardingEntryHints();
refreshTutorSurface();
updateCallStatus('통화 전');
updateCallTimerDisplay();

function wireEvents() {
  composerForm.addEventListener('submit', onSubmit);
  messageInput.addEventListener('keydown', onComposerKeydown);
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
  document.getElementById('openOnboardingBtn')?.addEventListener('click', () => openOnboarding('card'));
  document.getElementById('skipOnboardingBtn')?.addEventListener('click', dismissOnboardingEntryHints);
  document.getElementById('closeOnboardingBtn')?.addEventListener('click', closeOnboarding);
  document.getElementById('onboardingChatBtn')?.addEventListener('click', startFromOnboardingChat);
  document.getElementById('onboardingCallBtn')?.addEventListener('click', startFromOnboardingCall);
  document.querySelectorAll('.starter-chip').forEach((btn) => {
    btn.addEventListener('click', () => primeStarterPhrase(btn.dataset.starter || ''));
  });
  document.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', () => onQuickAction(btn.dataset.quick));
  });
}

function onComposerKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  composerForm.requestSubmit();
}

function updateThreadPresence(text) {
  if (threadPresenceText) threadPresenceText.textContent = text;
}

function updateCallVibe(flowText, coachText) {
  if (callFlowHint && flowText) callFlowHint.textContent = flowText;
  if (callCoachHint && coachText) callCoachHint.textContent = coachText;
}

function isStandaloneDisplayMode() {
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true;
}

function isLikelyIPhone() {
  return /iphone/i.test(window.navigator.userAgent || '');
}

function applyStandaloneUiHints() {
  const standalone = isStandaloneDisplayMode();
  document.body.classList.toggle('standalone', standalone);
  if (!installHintCard) return;
  const shouldShowInstallHint = isLikelyIPhone() && !standalone;
  installHintCard.classList.toggle('hidden', !shouldShowInstallHint);
}

function hasSeenOnboarding() {
  return localStorage.getItem('annaOnboardingSeen') === 'yes';
}

function markOnboardingSeen() {
  localStorage.setItem('annaOnboardingSeen', 'yes');
}

function applyOnboardingEntryHints() {
  const shouldShowCard = !hasSeenOnboarding();
  onboardingCard?.classList.toggle('hidden', !shouldShowCard);
  if (shouldShowCard) {
    setTimeout(() => openOnboarding('auto'), 180);
  }
}

function dismissOnboardingEntryHints() {
  markOnboardingSeen();
  onboardingCard?.classList.add('hidden');
}

function openOnboarding(source = 'manual') {
  if (!onboardingModal) return;
  if (source !== 'auto') markOnboardingSeen();
  onboardingCard?.classList.add('hidden');
  onboardingModal.classList.remove('hidden');
  onboardingModal.setAttribute('aria-hidden', 'false');
}

function closeOnboarding() {
  if (!onboardingModal) return;
  markOnboardingSeen();
  onboardingCard?.classList.add('hidden');
  onboardingModal.classList.add('hidden');
  onboardingModal.setAttribute('aria-hidden', 'true');
}

function startFromOnboardingChat() {
  closeOnboarding();
  messageInput.focus();
  messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
}

async function startFromOnboardingCall() {
  closeOnboarding();
  await startVideoConversation();
}

function primeStarterPhrase(text) {
  if (!text) return;
  messageInput.value = text;
  messageInput.focus();
  messageInput.setSelectionRange(text.length, text.length);
  updateThreadPresence('ANNA가 준비됐어요 · 아래 문장을 그대로 보내거나 말해보세요');
}

function shortenForReplyPreview(text = '', maxLength = 72) {
  const normalized = stripForSpeech(String(text || '')).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildReplyPreviewHtml(meta, text) {
  const preview = shortenForReplyPreview(text);
  if (!preview) return '';
  return `<strong>${escapeHtml(meta)}</strong><span>· ${escapeHtml(preview)}</span>`;
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

function getProviderErrorKind(error) {
  const text = String(error?.message || '').toLowerCase();
  if (text.includes('insufficient_quota') || text.includes('exceeded your current quota') || text.includes('billing') || text.includes('quota')) {
    return 'quota';
  }
  if (text.includes('429') || text.includes('rate limit')) {
    return 'rate-limit';
  }
  if (text.includes('401') || text.includes('invalid api key') || text.includes('incorrect api key') || text.includes('unauthorized')) {
    return 'auth';
  }
  if (text.includes('fetch') || text.includes('networkerror') || text.includes('failed to fetch') || text.includes('timeout')) {
    return 'network';
  }
  return '';
}

function isProviderFallbackActive() {
  return Date.now() < Number(STATE.providerState?.fallbackUntil || 0);
}

function clearProviderFallbackState() {
  STATE.providerState.fallbackUntil = 0;
  STATE.providerState.lastErrorKind = '';
  STATE.fallbackNoticeShown = false;
  updateModeBadge();
}

function activateProviderFallback(error) {
  const kind = getProviderErrorKind(error);
  const now = Date.now();
  const durationMs = kind === 'quota' ? 5 * 60 * 1000 : 60 * 1000;
  STATE.providerState.fallbackUntil = now + durationMs;
  STATE.providerState.lastErrorKind = kind;
  updateModeBadge();
  return kind;
}

function getProviderFallbackNoticeText(kind) {
  if (kind === 'quota') {
    return '실시간 AI 서버 요금/쿼터가 소진돼서 지금은 데모 엔진으로 바로 이어서 답하고 있어요. UI와 대화 흐름은 계속 사용할 수 있어요.';
  }
  if (kind === 'auth') {
    return '실시간 AI 서버 인증 설정에 문제가 있어서 지금은 데모 엔진으로 이어서 답하고 있어요.';
  }
  return '실시간 AI 서버가 잠시 불안정해서 지금은 데모 엔진으로 자연스럽게 이어서 답하고 있어요.';
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
  updatePremiumCallDeck();
  if (!stageMoodText || STATE.call.active) return;
  stageMoodText.textContent = isUltraFastModeEnabled()
    ? 'Ready for a very fast, natural British-English call.'
    : 'Ready for a natural British-English chat.';
}

function updatePremiumCallDeck() {
  if (callSessionPreset) {
    callSessionPreset.textContent = `${isHandsFreeModeEnabled() ? 'British phone-English' : 'British tutor mode'} · ${STATE.settings.ttsMode === 'openai' ? 'AI voice' : 'browser voice'}`;
  }
  if (callSessionSubcopy) {
    callSessionSubcopy.textContent = isOneLineReplyModeEnabled()
      ? '실제 전화영어처럼 짧게 묻고 짧게 이어가는 흐름으로 맞춰져 있어요.'
      : '조금 더 설명형으로 길게도 이어갈 수 있게 열어둔 상태예요.';
  }
  if (callLiveFocus && !STATE.call.active) {
    callLiveFocus.textContent = isUltraFastModeEnabled()
      ? '첫 문장은 짧고 또렷하게'
      : '짧게 시작하고 한 턴씩 이어가기';
  }
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
  const userMeta = options.source?.includes('voice') ? '나 · 음성' : '나';
  const isVoiceSource = options.source?.includes('voice');
  const useLiveCallStyling = STATE.call.active;
  appendUser(options.displayText || text, { meta: userMeta, variant: isVoiceSource ? 'voice-user' : '' });
  STATE.call.turnInFlight = Boolean(STATE.call.active && options.source?.includes('voice'));
  updateThreadPresence(isVoiceSource
    ? 'ANNA가 방금 음성을 받았어요 · 바로 답장 중이에요'
    : 'ANNA가 메시지를 읽고 있어요 · 곧 답장해요');
  setAvatar('🤔');
  setTutorMood('thinking');
  if (STATE.call.active && options.source?.includes('voice')) {
    updateCallStatus('ANNA 답변 준비 중');
    updateAnnaSubtitle(isUltraFastModeEnabled() ? 'Right — one sec.' : 'Right — give me a second.');
    updateAnnaModeHint('방금 말한 내용을 듣고 바로 답하는 중');
  }
  const typingLabel = useLiveCallStyling
    ? 'ANNA · live'
    : 'ANNA 영어쌤';
  showTypingIndicator(typingLabel, 'ANNA가 답장하는 중', {
    replyToMeta: userMeta,
    replyToText: options.displayText || text,
    variant: useLiveCallStyling ? 'live-assistant' : '',
  });
  try {
    const reply = await generateTutorReply(text, options);
    removeTypingIndicator();
    appendAssistant(reply.text, {
      feedback: reply.feedback,
      meta: typingLabel,
      variant: useLiveCallStyling ? 'live-assistant' : '',
      replyToMeta: userMeta,
      replyToText: options.displayText || text,
    });
    updateThreadPresence(STATE.call.active && options.source?.includes('voice')
      ? 'ANNA가 방금 음성에 답장했어요 · 이어서 말하면 바로 다시 들어요'
      : 'ANNA가 방금 답장했어요 · 계속 이어서 보내보세요');
    updateAnnaSubtitle(reply.subtitle || reply.text);
    if (reply.feedback && hasVisibleFeedback(reply.feedback)) {
      renderFeedback(reply.feedback);
    } else {
      clearFeedback();
    }
    if (options.autoSpeak) {
      await speakText(reply.speakText || reply.text);
    }
    if (reply.systemNotice) {
      appendSystemNotice(reply.systemNotice.text, reply.systemNotice.tone || 'neutral');
    }
    if (STATE.call.active && options.source === 'voice-call') {
      updateSelfTranscriptHint(`방금 내가 말한 문장: ${stripForSpeech(text).slice(0, 90)}`);
      updateAnnaModeHint(isHandsFreeModeEnabled()
        ? 'ANNA가 답했어요. 곧 다시 듣기 시작합니다.'
        : 'ANNA가 답했어요. 다시 말하려면 아래 버튼을 눌러주세요.');
      queueCallListeningResume();
    }
  } catch (err) {
    removeTypingIndicator();
    appendSystemNotice(`오류가 있었어요. ${err.message}`, 'warning');
    updateThreadPresence('ANNA 연결이 잠깐 흔들렸어요 · 다시 보내면 이어서 답장해요');
    updateAnnaSubtitle('잠시 오류가 있었어요. 다시 한 번 말해볼까요?');
  } finally {
    removeTypingIndicator();
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

  messageInput.value = '';
  handleUserTurn(text, { autoSpeak: false, source: kind, helperKind: kind });
}

function getLiveCallOpener(theme = themeSelect.value) {
  return LIVE_CALL_OPENERS[theme] || 'Hi — good to see you. How are you doing today?';
}

function maybeSurfaceCallInputFallback(reason = 'no-speech') {
  if (!STATE.call.active || STATE.call.noSpeechHintShown) return;
  if (reason === 'unsupported' || STATE.call.noSpeechCount >= 2) {
    appendAssistant('음성이 아직 안 잡히면 아래 입력창에 방금 말한 문장을 보내도 돼요. 지금 통화 톤 그대로 바로 답할게요.', {
      meta: 'ANNA · live',
      variant: 'live-assistant',
      replyToMeta: '통화 도움',
      replyToText: '마이크가 아직 조용해요',
    });
    updateThreadPresence('ANNA가 아직 내 목소리를 못 들었어요 · 아래 입력창으로도 바로 이어갈 수 있어요');
    updateAnnaModeHint('마이크가 잠깐 안 잡혀도 입력창으로 같은 통화 흐름을 계속 이어갈 수 있어요.');
    if (callLiveFocus) callLiveFocus.textContent = '마이크가 잠잠하면 입력창으로 한 줄만 보내도 바로 이어져요';
    STATE.call.noSpeechHintShown = true;
  }
}

async function startVideoConversation() {
  if (STATE.call.assistantSpeaking) {
    stopCurrentSpeechPlayback();
  }
  if (STATE.call.turnInFlight) return;

  if (!STATE.call.active) {
    await startVideoLesson();
  }

  let cameraResult = { ok: true };
  if (!STATE.call.stream) {
    cameraResult = await enableCamera();
  }
  const micPermissionState = await getMicrophonePermissionState();
  if (micPermissionState === 'denied' || cameraResult?.ok === false) {
    updateThreadPresence('마이크 권한이 필요해요 · 허용 후 다시 누르면 바로 이어집니다');
    updateCallVibe('권한 확인 필요 · 마이크 접근이 막혀 있어요.', 'Safari/Chrome에서 마이크 권한을 허용한 뒤 다시 누르면 바로 이어서 시작돼요.');
    if (callLiveFocus) callLiveFocus.textContent = '먼저 마이크 권한을 허용하면 통화가 바로 살아나요';
    appendSystemNotice(buildSpeechRecognitionErrorMessage('not-allowed'), 'warning');
    return;
  }

  startCallSpeechRecognition();
}

function appendUser(text, options = {}) {
  STATE.messages.push({ role: 'user', content: text });
  appendMessage('user', options.meta || '나', text, options);
}

function appendAssistant(text, options = {}) {
  STATE.messages.push({ role: 'assistant', content: text });
  STATE.lastAssistantText = text;
  appendMessage('assistant', options.meta || 'ANNA 영어쌤', text, options);
}

function appendSystemNotice(text, tone = 'neutral') {
  const node = document.createElement('div');
  node.className = 'message-row system';
  const chip = document.createElement('div');
  chip.className = `system-chip${tone === 'warning' ? ' warning' : ''}`;
  chip.textContent = text;
  node.appendChild(chip);
  chatWindow.appendChild(node);
  scrollChatToBottom();
  return node;
}

function appendMessage(role, meta, text, options = {}) {
  const tpl = document.getElementById('messageTemplate');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  if (options.variant) node.classList.add(options.variant);
  node.querySelector('.message-avatar').textContent = role === 'assistant' ? 'A' : '나';
  node.querySelector('.bubble-meta').textContent = meta;
  node.querySelector('.bubble-time').textContent = formatMessageTime(options.timestamp || Date.now());
  const replyPreview = node.querySelector('.bubble-reply-preview');
  if (replyPreview) {
    const html = buildReplyPreviewHtml(options.replyToMeta || '이전 메시지', options.replyToText || '');
    replyPreview.innerHTML = html;
    replyPreview.classList.toggle('hidden', !html);
  }
  node.querySelector('.bubble').textContent = text;
  if (options.feedback && hasVisibleFeedback(options.feedback)) {
    populateInlineFeedback(node.querySelector('.bubble-feedback'), options.feedback);
  }
  chatWindow.appendChild(node);
  scrollChatToBottom();
  return node;
}

function formatMessageTime(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(timestamp);
}

function scrollChatToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator(label = 'ANNA 영어쌤', text = 'ANNA가 답장하는 중', options = {}) {
  removeTypingIndicator();
  const node = appendMessage('assistant', label, '', { ...options, timestamp: Date.now() });
  node.classList.add('typing-indicator');
  node.querySelector('.bubble-meta').textContent = label;
  node.querySelector('.bubble').innerHTML = `<div class="typing-bubble" aria-label="${escapeHtml(text)}"><span></span><span></span><span></span></div>`;
  STATE.typingIndicator = node;
  scrollChatToBottom();
  return node;
}

function removeTypingIndicator() {
  if (!STATE.typingIndicator) return;
  STATE.typingIndicator.remove();
  STATE.typingIndicator = null;
}

function populateInlineFeedback(container, feedback) {
  if (!container) return;
  const cards = [];
  if (feedback.answer) {
    cards.push(`<div class="bubble-feedback-card"><strong>바로 쓸 문장</strong><p>${escapeHtml(feedback.answer)}</p></div>`);
  }
  if (feedback.correction) {
    cards.push(`<div class="bubble-feedback-card"><strong>교정</strong><p>${escapeHtml(feedback.correction)}</p></div>`);
  }
  if (feedback.explanation) {
    cards.push(`<div class="bubble-feedback-card"><strong>짧은 설명</strong><p>${escapeHtml(feedback.explanation)}</p></div>`);
  }
  if ((feedback.vocabulary || []).length) {
    const chips = feedback.vocabulary.map((item) => `<span class="inline-chip">${escapeHtml(item)}</span>`).join('');
    cards.push(`<div class="bubble-feedback-card"><strong>같이 외우면 좋은 표현</strong><div>${chips}</div></div>`);
  }
  container.innerHTML = cards.join('');
  container.classList.toggle('hidden', cards.length === 0);
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

async function generateTutorReply(userText, options = {}) {
  if ((STATE.settings.apiKey || getProxyBaseUrl()) && isProviderFallbackActive()) {
    const fallbackReply = await demoReply(userText, options);
    if (!STATE.fallbackNoticeShown) {
      fallbackReply.systemNotice = {
        text: getProviderFallbackNoticeText(STATE.providerState.lastErrorKind),
        tone: 'warning',
      };
      STATE.fallbackNoticeShown = true;
    }
    return fallbackReply;
  }

  if (STATE.settings.apiKey) {
    try {
      const reply = await realAiReply(userText, options);
      clearProviderFallbackState();
      return reply;
    } catch (error) {
      const fallback = await maybeFallbackToDemoReply(userText, options, error);
      if (fallback) return fallback;
      throw error;
    }
  }
  if (getProxyBaseUrl()) {
    try {
      const reply = await proxyAiReply(userText, options);
      clearProviderFallbackState();
      return reply;
    } catch (error) {
      const fallback = await maybeFallbackToDemoReply(userText, options, error);
      if (fallback) return fallback;
      throw error;
    }
  }
  return demoReply(userText, options);
}

async function maybeFallbackToDemoReply(userText, options = {}, error) {
  if (!shouldUseDemoFallback(error)) return null;
  const fallbackReply = await demoReply(userText, options);
  const kind = activateProviderFallback(error);
  if (!STATE.fallbackNoticeShown) {
    fallbackReply.systemNotice = {
      text: getProviderFallbackNoticeText(kind),
      tone: 'warning',
    };
    STATE.fallbackNoticeShown = true;
  }
  return fallbackReply;
}

function shouldUseDemoFallback(error) {
  const text = String(error?.message || '').toLowerCase();
  return ['429', 'quota', 'billing', 'rate limit', 'fetch', 'networkerror', 'failed to fetch', 'timeout'].some((token) => text.includes(token));
}

function buildHelperPrompt(kind, text) {
  if (kind === 'translate') {
    return `다음 한국어를 외국인이 실제로 말할 자연스러운 영어로 바꿔줘: ${text}`;
  }
  if (kind === 'correct') {
    return `다음 영어 문장을 짧게 고쳐주고 더 자연스럽게 바꿔줘: ${text}`;
  }
  return text;
}

async function realAiReply(userText, options = {}) {
  const effectiveUserText = options.helperKind ? buildHelperPrompt(options.helperKind, userText) : userText;
  const isVoiceCall = STATE.call.active;
  const model = pickReplyModel({ isVoiceCall });
  const recentMessages = getRecentMessagesForReply({ isVoiceCall });
  const replyStyleHints = getReplyStyleHints({ isVoiceCall });
  const system = [
    'You are ANNA, a late-30s British English female tutor with a cool, calm, sharp style.',
    'The user dislikes AI-sounding phrasing and long analysis.',
    'Always use British English spelling, vocabulary, rhythm, and phrasing.',
    'Sound like a real modern British tutor on a video call: cool, steady, natural, and never cheesy.',
    'Keep it human and conversational, like a real person replying in the moment — not like a textbook or a system panel.',
    'Lead with the natural conversational reply first, not a lesson.',
    'Prefer short spoken-style replies with soft rhythm, contractions, and light human filler only when it fits naturally.',
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
    { role: 'user', content: voiceHint ? `${voiceHint}\n\nUser said: ${effectiveUserText}` : effectiveUserText }
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

async function proxyAiReply(userText, options = {}) {
  const effectiveUserText = options.helperKind ? buildHelperPrompt(options.helperKind, userText) : userText;
  const isVoiceCall = STATE.call.active;
  const endpoint = `${getProxyBaseUrl()}/chat`;
  const payload = {
    userText: effectiveUserText,
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

async function demoReply(userText, options = {}) {
  const theme = themeSelect.value;
  const normalized = userText.trim();

  if (options.helperKind === 'translate') {
    const answer = makeMoreNatural(translateKoreanHeuristically(normalized, theme), theme);
    return {
      text: answer,
      subtitle: answer,
      speakText: answer,
      feedback: {
        answer,
        correction: '',
        explanation: '이 문장 그대로 말하면 자연스러워.',
        vocabulary: vocabForTheme(theme).slice(0, 3),
      }
    };
  }

  if (options.helperKind === 'correct') {
    const corrected = correctEnglishHeuristically(normalized);
    const natural = makeMoreNatural(corrected, theme);
    const needsCorrection = corrected !== normalized || natural !== corrected;

    return needsCorrection
      ? {
          text: `You could simply say, "${natural}"`,
          subtitle: natural,
          speakText: natural,
          feedback: {
            answer: natural,
            correction: corrected,
            explanation: '이렇게 바꾸면 더 자연스럽고 실제 회화처럼 들려.',
            vocabulary: vocabForTheme(theme).slice(0, 3),
          }
        }
      : {
          text: 'That already sounds good.',
          subtitle: 'That already sounds good.',
          speakText: 'That already sounds good.',
          feedback: null,
        };
  }

  const isKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(userText);
  const lower = normalized.toLowerCase();

  if (/^(i don't know|i dont know|모르겠|잘 모르겠)/i.test(lower) || /모르겠/.test(normalized)) {
    const answer = sampleAnswerForTheme(theme);
    return {
      text: `That’s alright — you can just say, "${answer}"`,
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
  const correctionLine = needsCorrection ? `More naturally: "${natural}"` : '';
  const explanation = needsCorrection ? '이렇게 바꾸면 영국영어로 훨씬 자연스럽고 사람처럼 들려.' : '';

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
        'Right — what did you do at church, then?',
        'Was it for worship or a meeting?',
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
        'Right — are you getting a bit of rest now?',
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
  clearProviderFallbackState();
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
  clearProviderFallbackState();
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
  const fallbackSuffix = isProviderFallbackActive()
    ? ` · 현재 ${STATE.providerState.lastErrorKind === 'quota' ? '데모 fallback (quota)' : '데모 fallback'}`
    : '';
  if (STATE.settings.apiKey) {
    modeBadge.textContent = `개인 API 연결 · ${STATE.settings.model} · ${STATE.settings.ttsMode === 'openai' ? `AI 음성 ${STATE.settings.ttsVoice || 'nova'}` : '브라우저 음성'} · ${callModeLabel}${fallbackSuffix}`;
    return;
  }
  if (getProxyBaseUrl()) {
    modeBadge.textContent = `공개 AI 서버 연결 · ${STATE.settings.model} · ${STATE.settings.ttsMode === 'openai' ? `AI 음성 ${STATE.settings.ttsVoice || 'nova'}` : '브라우저 음성'} · ${callModeLabel}${fallbackSuffix}`;
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
  utterance.rate = lang.startsWith('en') ? (STATE.call.active ? 0.97 : 0.95) : 1;
  utterance.pitch = lang.startsWith('en') ? 1.01 : 1;
  return new Promise((resolve) => {
    utterance.onstart = () => {
      STATE.call.assistantSpeaking = true;
      setTutorMood('speaking');
      updateThreadPresence('ANNA가 지금 말하는 중이에요 · 끝나면 바로 다시 들을게요');
      if (STATE.call.active) updateCallStatus('ANNA 답변 중');
    };
    utterance.onend = () => {
      STATE.call.currentUtterance = null;
      STATE.call.assistantSpeaking = false;
      setTutorMood('idle');
      updateThreadPresence(STATE.call.active
        ? 'ANNA가 답장을 마쳤어요 · 이어서 말하면 바로 다시 들어요'
        : 'ANNA가 온라인이에요 · 답장을 기다리고 있어요');
      if (STATE.call.active) updateCallStatus('화상 회화 중');
      resolve(true);
    };
    utterance.onerror = () => {
      STATE.call.currentUtterance = null;
      STATE.call.assistantSpeaking = false;
      setTutorMood('idle');
      updateThreadPresence(STATE.call.active
        ? 'ANNA가 다시 들을 준비를 하고 있어요'
        : 'ANNA가 온라인이에요 · 답장을 기다리고 있어요');
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
        updateThreadPresence('ANNA가 지금 말하는 중이에요 · 곧 다시 들어요');
        if (STATE.call.active) updateCallStatus('ANNA 답변 중');
      };
      audio.onended = () => {
        STATE.call.assistantSpeaking = false;
        clearOpenAiAudioPlayback();
        setTutorMood('idle');
        updateThreadPresence(STATE.call.active
          ? 'ANNA가 답장을 마쳤어요 · 이어서 말하면 바로 다시 들어요'
          : 'ANNA가 온라인이에요 · 답장을 기다리고 있어요');
        if (STATE.call.active) updateCallStatus('화상 회화 중');
        resolve(true);
      };
      audio.onerror = () => {
        STATE.call.assistantSpeaking = false;
        clearOpenAiAudioPlayback();
        setTutorMood('idle');
        updateThreadPresence(STATE.call.active
          ? 'ANNA가 다시 들을 준비를 하고 있어요'
          : 'ANNA가 온라인이에요 · 답장을 기다리고 있어요');
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

async function getMicrophonePermissionState() {
  if (!navigator.permissions?.query) return 'unknown';
  try {
    const status = await navigator.permissions.query({ name: 'microphone' });
    return status?.state || 'unknown';
  } catch {
    return 'unknown';
  }
}

function buildSpeechRecognitionErrorMessage(error) {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return isEmbeddedMobileBrowser()
      ? '마이크 권한이 막혀 있어요. 텔레그램 내부 브라우저 대신 Safari/Chrome에서 링크를 열고, 주소창 왼쪽의 마이크 권한을 허용한 뒤 다시 시도해보세요.'
      : '마이크 권한이 막혀 있어요. 브라우저 주소창의 마이크 권한을 허용하고 새로고침한 뒤 다시 시도해보세요.';
  }
  if (error === 'audio-capture') {
    return '마이크를 찾지 못했어요. 이어폰/에어팟 마이크 연결 상태나 브라우저 마이크 권한을 확인해보세요.';
  }
  if (error === 'no-speech') {
    return '소리가 거의 잡히지 않았어요. 조금 더 가까이에서 한 문장만 또렷하게 말해보세요.';
  }
  if (error === 'network') {
    return '음성 인식 연결이 잠깐 불안정했어요. 네트워크가 안정되면 다시 말해보세요.';
  }
  return `음성 인식 오류: ${error}`;
}

async function ensureMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, reason: 'unsupported' };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error?.name || error?.message || 'microphone-error', error };
  }
}

async function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendSystemNotice(voiceSupportHint(), 'warning');
    return;
  }
  const permissionState = await getMicrophonePermissionState();
  if (permissionState === 'denied') {
    appendSystemNotice(buildSpeechRecognitionErrorMessage('not-allowed'), 'warning');
    return;
  }
  const micAccess = await ensureMicrophoneAccess();
  if (!micAccess.ok && permissionState !== 'granted') {
    appendSystemNotice(buildSpeechRecognitionErrorMessage('not-allowed'), 'warning');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-GB';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  appendSystemNotice('🎤 듣는 중… 영어로 말하면 메신저처럼 바로 답장할게요.');
  updateSelfTranscriptHint('지금 영어로 한 문장 말하면 바로 채팅 스레드에도 남아요.');
  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript.trim();
    messageInput.value = transcript;
    await handleUserTurn(transcript, { autoSpeak: true, source: 'voice' });
    messageInput.value = '';
  };
  recognition.onerror = (event) => {
    appendSystemNotice(buildSpeechRecognitionErrorMessage(event.error), 'warning');
  };
  try {
    recognition.start();
  } catch (error) {
    appendSystemNotice(buildSpeechRecognitionErrorMessage(error?.name || 'start-failed'), 'warning');
  }
}

async function startVideoLesson() {
  STATE.call.active = true;
  STATE.call.turnInFlight = false;
  STATE.call.heardFinal = false;
  STATE.call.noSpeechCount = 0;
  STATE.call.noSpeechHintShown = false;
  STATE.call.startedAt = Date.now();
  startCallClock();
  updateCallStatus('연결 중');
  updateThreadPresence('ANNA가 통화에 들어오는 중이에요 · 곧 연결됩니다');
  updateCallVibe('연결 중 · 마이크와 회화 세션을 준비하고 있어요.', '지금은 길게 설명하지 말고 짧게 한 문장으로 시작하면 가장 자연스러워요.');
  if (callLiveFocus) callLiveFocus.textContent = '첫 문장은 자연스럽게 한 문장만';
  updateAvatarStatus('ANNA가 화상 회화 준비중');
  annaStage.classList.add('call-active');
  await new Promise((resolve) => setTimeout(resolve, 320));
  if (!STATE.call.active) return;
  updateCallStatus('통화 연결됨');
  const opener = getLiveCallOpener();
  updateAnnaSubtitle(opener);
  if (stageMoodText) {
    stageMoodText.textContent = isHandsFreeModeEnabled()
      ? 'Hands-free call mode is ready. Just keep talking naturally.'
      : 'Camera-call mode is ready. One short sentence is enough.';
  }
  updateAnnaModeHint(isHandsFreeModeEnabled()
    ? 'ANNA가 통화에 들어왔어요. 바로 말하면 끊김 없이 이어가요.'
    : 'ANNA가 통화에 들어왔어요. 먼저 짧게 한 문장만 말해보세요.');
  updateSelfTranscriptHint('카메라와 마이크가 준비되면 바로 영어로 말해보세요.');
  updateCallVibe('통화 연결됨 · ANNA가 먼저 받아줬어요.', isHandsFreeModeEnabled()
    ? '핸즈프리 상태예요. 한 턴 끝나면 ANNA가 자동으로 다시 들어요.'
    : '지금은 수동 청취 상태예요. 버튼을 눌러 다시 말할 수 있어요.');
  if (callLiveFocus) callLiveFocus.textContent = '지금은 짧은 자기 문장으로 워밍업';
  appendSystemNotice('📞 ANNA가 통화에 들어왔어요. 이제 실제 전화영어처럼 이어집니다.');
  appendAssistant(opener, {
    meta: 'ANNA · live',
    variant: 'live-assistant',
    replyToMeta: '통화 시작',
    replyToText: 'ANNA joined the call',
  });
  updateThreadPresence('ANNA가 통화에 들어왔어요 · 먼저 한 문장만 말해보세요');
  speakText(opener);
}

async function enableCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    appendAssistant('이 브라우저에서는 카메라 접근을 지원하지 않아요.');
    return { ok: false, reason: 'unsupported' };
  }

  try {
    if (!STATE.call.stream) {
      STATE.call.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      userVideo.srcObject = STATE.call.stream;
    }
    userVideo.classList.add('active');
    selfVideoFallback.classList.add('hidden');
    updateAvatarStatus('카메라 연결됨');
    updateSelfTranscriptHint('카메라 연결 완료. 이제 자연스럽게 한 문장만 먼저 말해보세요.');
    appendSystemNotice('📷 카메라 연결됨. 이제 바로 말하면 ANNA가 사람처럼 이어서 답해줘요.');
    return { ok: true };
  } catch (err) {
    const permissionHint = /denied|notallowed|not-allowed|permission/i.test(String(err?.name || err?.message || ''))
      ? ` ${buildSpeechRecognitionErrorMessage('not-allowed')}`
      : '';
    appendSystemNotice(`카메라를 켜지 못했어요: ${err.message}.${permissionHint}`.trim(), 'warning');
    return { ok: false, reason: err?.name || err?.message || 'camera-error', error: err };
  }
}

function startCallSpeechRecognition() {
  if (!STATE.call.active) {
    startVideoLesson();
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    const unsupportedHint = voiceSupportHint();
    appendAssistant(unsupportedHint, {
      meta: 'ANNA · live',
      variant: 'live-assistant',
      replyToMeta: '통화 상태',
      replyToText: '음성 인식을 시작하는 중',
    });
    maybeSurfaceCallInputFallback('unsupported');
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
  updateThreadPresence('ANNA가 지금 듣고 있어요 · 영어로 말하면 바로 답장해요');
  updateCallVibe('듣는 중 · 지금 말하는 문장을 바로 받는 중이에요.', '지금은 한 문장만 또렷하게 말해보세요. 너무 길면 실제 통화감이 떨어져요.');
  if (callLiveFocus) callLiveFocus.textContent = '핵심만 짧게 말하면 가장 자연스러워요';
  updateAnnaSubtitle("I'm listening. Go on.");
  updateAnnaModeHint('ANNA가 지금 듣고 있어요. 끊지 말고 짧게 말하면 돼요.');
  updateSelfTranscriptHint('Listening… 영어로 편하게 말해보세요.');
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
      updateSelfTranscriptHint(`내 말: ${liveTranscript}`);
      updateThreadPresence(`ANNA가 듣는 중 · “${shortenForReplyPreview(liveTranscript, 38)}”`);
    }

    const transcript = finalTranscript.trim();
    if (!transcript) return;

    STATE.call.heardFinal = true;
    STATE.call.noSpeechCount = 0;
    STATE.call.noSpeechHintShown = false;
    STATE.call.listening = false;
    annaStage.classList.remove('call-listening');
    updateCallStatus('화상 회화 중');
    updateThreadPresence('ANNA가 방금 음성을 들었어요 · 지금 바로 답장 준비 중');
    updateCallVibe('응답 준비 중 · 방금 말한 내용을 가장 자연스럽게 다듬는 중이에요.', '지금은 기다리기만 하면 돼요. 답이 끝나면 바로 다음 턴으로 넘어갈 수 있어요.');
    if (callLiveFocus) callLiveFocus.textContent = '지금은 ANNA가 가장 자연스러운 답을 만드는 중';
    updateAnnaModeHint('좋아요. 바로 답을 만드는 중이에요.');
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
    const message = buildSpeechRecognitionErrorMessage(event.error);
    updateAnnaSubtitle(message);
    updateThreadPresence('마이크 입력이 잠깐 불안정했어요 · 다시 말하면 이어서 들어요');
    if (['not-allowed', 'service-not-allowed'].includes(event.error)) {
      updateCallVibe('권한 확인 필요 · 마이크 접근이 막혀 있어요.', 'Safari/Chrome에서 마이크 권한을 허용한 뒤 다시 누르면 통화가 바로 이어져요.');
      if (callLiveFocus) callLiveFocus.textContent = '마이크 권한을 허용하면 바로 다시 시작할 수 있어요';
    }
    setAvatar('😊');
    setTutorMood('idle');
    if (STATE.call.active && event.error === 'no-speech') {
      STATE.call.noSpeechCount += 1;
      maybeSurfaceCallInputFallback('no-speech');
      queueCallListeningResume();
      return;
    }
    appendSystemNotice(message, 'warning');
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

  try {
    recognition.start();
  } catch (error) {
    STATE.call.listening = false;
    annaStage.classList.remove('call-listening');
    updateCallStatus('화상 회화 중');
    const message = buildSpeechRecognitionErrorMessage(error?.name || 'start-failed');
    updateAnnaSubtitle(message);
    appendSystemNotice(message, 'warning');
  }
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
  STATE.call.noSpeechCount = 0;
  STATE.call.noSpeechHintShown = false;
  STATE.call.assistantSpeaking = false;
  STATE.call.currentUtterance = null;
  STATE.call.startedAt = null;
  stopCallClock();
  clearOpenAiAudioPlayback();
  userVideo.srcObject = null;
  userVideo.classList.remove('active');
  selfVideoFallback.classList.remove('hidden');
  annaStage.classList.remove('call-active', 'call-listening');
  updateCallStatus('통화 종료');
  updateThreadPresence('ANNA가 온라인이에요 · 메시지로도 계속 답장할 수 있어요');
  updateCallVibe('통화 종료 · 다시 시작 버튼으로 언제든 재입장 가능', '지금부터는 아래 메신저 스레드로 이어서 연습해도 자연스럽게 답장해줘요.');
  if (callLiveFocus) callLiveFocus.textContent = '이제는 메신저처럼 이어서 보내도 좋아요';
  updateAvatarStatus('AI 튜터 대기중');
  updateAnnaSubtitle('화상 회화를 종료했어요. 다시 시작할 수 있어요.');
  speechSynthesis?.cancel?.();
  appendSystemNotice('📴 화상 회화를 종료했어요. 이제 아래 메신저처럼 계속 이어서 연습할 수 있어요.');
}

function formatCallDuration(totalSeconds = 0) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateCallTimerDisplay() {
  if (!callTimerBadge) return;
  if (!STATE.call.active || !STATE.call.startedAt) {
    callTimerBadge.textContent = '00:00';
    return;
  }
  const elapsed = Math.max(0, Math.floor((Date.now() - STATE.call.startedAt) / 1000));
  callTimerBadge.textContent = formatCallDuration(elapsed);
}

function startCallClock() {
  if (STATE.call.clockTimer) {
    clearInterval(STATE.call.clockTimer);
  }
  updateCallTimerDisplay();
  STATE.call.clockTimer = setInterval(updateCallTimerDisplay, 1000);
}

function stopCallClock() {
  if (STATE.call.clockTimer) {
    clearInterval(STATE.call.clockTimer);
    STATE.call.clockTimer = null;
  }
  updateCallTimerDisplay();
}

function updateCallStatus(text) {
  callStatusBadge.textContent = text;
  if (!stageMoodText) return;
  const map = {
    '통화 전': 'Ready for a natural British-English chat.',
    '연결 중': 'Joining the call now — camera and mic are getting ready.',
    '통화 연결됨': 'Connected. ANNA is here with you now.',
    '화상 회화 중': 'Stay relaxed — short answers are best.',
    '듣는 중': 'I\'m listening. Go on.',
    'ANNA 답변 중': 'ANNA is replying in a calm British tone.',
    'ANNA 답변 준비 중': 'Give me a second — shaping a natural reply.',
    '통화 종료': 'Call ended. You can restart any time.',
  };
  stageMoodText.textContent = map[text] || text;

  const vibeMap = {
    '통화 전': ['연결 전 · 버튼 한 번으로 바로 시작', '짧게 말할수록 실제 전화영어처럼 더 자연스럽게 이어져요.'],
    '연결 중': ['연결 중 · ANNA가 통화에 들어오는 중이에요.', '마이크가 준비되면 곧바로 한 문장으로 시작해보세요.'],
    '통화 연결됨': ['통화 연결됨 · 실제 사람처럼 바로 받아줬어요.', '지금부터는 설명보다 대화 흐름을 우선해서 짧게 이어가면 좋아요.'],
    '화상 회화 중': ['화상 회화 중 · 다음 턴을 이어갈 준비가 됐어요.', '막히면 한국어로 물어봐도 되고, 영어는 한두 문장으로 가볍게 이어가면 돼요.'],
    '듣는 중': ['듣는 중 · 방금 말하는 문장을 실시간으로 받고 있어요.', '너무 길게 말하지 말고 또렷한 한 문장으로 말하면 응답이 빨라져요.'],
    'ANNA 답변 중': ['ANNA 답변 중 · 실제 전화영어처럼 지금 말해주고 있어요.', '답을 다 들은 뒤 바로 다음 말을 짧게 이어보세요.'],
    'ANNA 답변 준비 중': ['응답 준비 중 · 가장 자연스러운 표현으로 다듬는 중이에요.', '지금은 기다리기만 하면 돼요. 곧 바로 다음 턴으로 넘어가요.'],
    '통화 종료': ['통화 종료 · 다시 시작 버튼으로 언제든 돌아올 수 있어요.', '이제 아래 메신저 스레드로 계속 연습해도 자연스럽게 이어집니다.'],
  };
  const vibe = vibeMap[text];
  if (vibe) updateCallVibe(vibe[0], vibe[1]);
}

function updateAnnaSubtitle(text) {
  annaSubtitle.textContent = stripForSpeech(text).slice(0, 220);
}

function updateAnnaModeHint(text) {
  const node = document.getElementById('annaModeHint');
  if (node) node.textContent = text;
}

function updateSelfTranscriptHint(text) {
  const node = document.getElementById('selfTranscriptHint');
  if (node) node.textContent = text;
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
    if (callLiveFocus) callLiveFocus.textContent = '지금은 ANNA 답 리듬을 듣고 바로 짧게 이어보세요';
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
