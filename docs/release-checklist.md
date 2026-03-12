# Release Checklist

## 목적

Threads 실계정과 텔레그램 실운영 토큰을 붙이기 전에 확인해야 할 최소 릴리즈 게이트를 정리합니다.

## 사전 확인

- `npm run format`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- 로컬 데모 모드에서 웹 대시보드 주요 흐름 확인
- Supabase 실환경 마이그레이션 적용 확인
- 텔레그램 봇 토큰과 채팅 ID 연결 테스트
- Threads OAuth 리디렉션 URL, 앱 권한, 사용자 토큰 확인

## 배포 전 점검

- `LOCAL_DEMO_MODE=false`로 배포되는지 확인
- `ADMIN_EMAILS`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`가 실서버에만 존재하는지 확인
- 웹과 API의 `APP_URL`, `API_URL`, `THREADS_REDIRECT_URI`가 실제 도메인 기준으로 일치하는지 확인
- 스케줄 작업이 하루 한 번만 실행되도록 플랫폼 크론 설정 확인

## 운영 시작 전 수동 테스트

- 원재료 생성, 수정, 삭제
- 초안 생성
- 초안 편집, 재생성, 취소, 예약 시간 변경
- 텔레그램 테스트 전송
- 최근 운영 로그 적재 확인
- Threads 테스트 게시

## 배포 보류 조건

- CI 실패
- 감사 로그가 남지 않음
- 텔레그램 테스트 실패
- Threads OAuth 콜백 실패
- 예약 게시 상태 전환 불일치
