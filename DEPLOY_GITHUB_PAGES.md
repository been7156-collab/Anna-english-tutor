# GitHub Pages 배포 메모

이 프로젝트는 정적 웹앱이라 GitHub Pages에 바로 배포할 수 있습니다.

## 현재 구조
- `index.html`
- `styles.css`
- `app.js`
- `assets/anna-avatar.svg`

## 배포 개요
1. GitHub에 새 public repository 생성
2. 이 폴더 내용을 push
3. GitHub Pages source를 `main` branch `/ (root)` 로 설정
4. 생성된 URL로 접속

## 주의
- 현재 로컬 서버 주소(`127.0.0.1`, `192.168.x.x`)는 Mac이 꺼지면 동작하지 않음
- GitHub Pages URL은 GitHub에 올라간 정적 파일을 서빙하므로 Mac이 닫혀 있어도 열림
- 실제 OpenAI 호환 API 키를 브라우저에 직접 넣는 방식은 공개 배포에 부적절함
- 공개용은 데모 모드 또는 별도 백엔드/API 프록시가 안전함
