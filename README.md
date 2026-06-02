# ANNA 영어쌤

로컬에서 실행하거나, 공개 배포해서 바로 쓸 수 있는 영어 회화 AI 튜터 웹앱 MVP입니다.

## 공개 링크
- GitHub Pages: https://been7156-collab.github.io/Anna-english-tutor/
- QR 코드 파일: `assets/anna-public-qr.png`

## 기능
- 상황별 회화 테마 선택
- 한국어 질문 → 영어 추천 문장
- 영어 문장 교정 + 한국어 설명
- 빠른 도움 버튼(힌트, 정답, 숙어, 문법)
- 음성 인식(브라우저 지원 시)
- 마지막 답변 음성 읽기
- API 키 없이 데모 모드 체험
- OpenAI 호환 API 키 입력 시 개인 키로 직접 실제 AI 응답 사용
- 공개 프록시 서버 연결 시 API 키 없이 실제 AI 응답 사용

## 로컬 실행
```bash
cd /Users/mac/english-ai-tutor
python3 -m http.server 8765
```

브라우저에서:
- http://127.0.0.1:8765

## 사용 모드
### 1) 데모 모드
- 아무 설정 없이 바로 체험 가능
- 실제 AI 호출 없이 기본 시나리오/교정 흐름을 보여줌

### 2) 개인 API 직접 연결
왼쪽 설정 패널에 아래를 입력:
- OpenAI 호환 API Key
- Base URL (기본: https://api.openai.com/v1)
- Model (예: gpt-4.1-mini)

주의:
- 브라우저에서 직접 OpenAI 호환 API를 호출하므로 키가 로컬 브라우저 localStorage에 저장됩니다.
- 개인 테스트용으로만 권장합니다.

### 3) 공개 AI 서버 연결
왼쪽 설정 패널의 `공개 AI 서버 URL`에 아래처럼 입력:
- `https://<your-vercel-app>.vercel.app/api`

이 모드에서는:
- 브라우저에 OpenAI 키를 넣지 않아도 됨
- 실제 OpenAI 호출은 서버에서 수행
- 같은 앱을 여러 기기에서 링크만으로 바로 사용 가능

## 공개 배포 추천: Vercel
이 저장소는 `api/chat.js`, `api/speech.js`, `vercel.json`을 포함하므로 Vercel에 바로 올릴 수 있습니다.

### Vercel 배포 절차
1. GitHub 저장소를 Vercel에 Import
2. Vercel CLI를 쓸 경우 `vercel login` 또는 `--token` 필요
3. Environment Variables 설정
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL` (선택, 기본값 `https://api.openai.com/v1`)
   - `OPENAI_MODEL` (선택, 기본값 `gpt-4.1-mini`)
   - `OPENAI_TTS_MODEL` (선택, 기본값 `gpt-4o-mini-tts`)
   - `OPENAI_TTS_VOICE` (선택, 기본값 `shimmer`)
4. Deploy
5. 배포 후 주소 예시:
   - 앱: `https://your-app.vercel.app`
   - 프록시 API: `https://your-app.vercel.app/api`

### 같은 도메인으로 쓸 때
앱 자체를 Vercel로 배포하면 프론트엔드가 자동으로 같은 도메인의 `/api`를 우선 시도합니다.
즉 사용자는 별도 API 키 입력 없이 바로 실제 AI 모드로 시작할 수 있습니다.

### GitHub Pages + 별도 서버 조합
기존 GitHub Pages를 유지하고 싶다면:
- 정적 앱은 GitHub Pages에 그대로 두고
- 프록시 서버만 Vercel에 배포한 뒤
- 앱 설정의 `공개 AI 서버 URL`에 Vercel API 주소를 넣으면 됩니다.

## 파일 구성
- `index.html`
- `styles.css`
- `app.js`
- `api/chat.js`
- `api/speech.js`
- `vercel.json`

## 다음 단계 아이디어
- 학습 기록 저장
- 오늘의 표현 카드
- 목사님/교회 영어 전용 시나리오 추가
- AI 아바타/립싱크
- PWA 설치 지원
- 사용량 제한/로그인/비용 보호 장치 추가
