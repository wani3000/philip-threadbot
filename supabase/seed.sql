insert into philip_profiles (category, title, content, tags, priority)
values
  (
    'career',
    '웁살라시큐리티 리드 디자이너 경험',
    '싱가포르 블록체인 보안 스타트업 웁살라시큐리티에서 첫 디자이너로 합류해 40명 규모 성장 과정의 UX 리드를 맡았습니다. 경찰청, 카카오, 삼성전자, 인터폴이 쓰는 AML 제품 경험을 설계했습니다.',
    array['웁살라시큐리티', '블록체인', '핀테크', '싱가포르'],
    'high'
  ),
  (
    'project',
    '암호화폐 트래킹 툴 UX 설계',
    '경찰청, 관세청, 국세청, 인터폴, 카카오, 삼성전자가 사용하는 자금세탁방지 추적 도구의 UX를 설계했습니다. 복잡한 자금 이동을 트리 구조로 시각화해 신고 800여 건, 피해금액 약 2400억 원 추적을 지원했습니다.',
    array['암호화폐트래킹', '데이터시각화', 'UIUX', '블록체인보안'],
    'medium'
  ),
  (
    'startup_story',
    '두닷두 창업 실패 경험',
    '호텔 관리용 스마트워치 서비스를 창업해 투자와 MOU까지 만들었지만, 스마트워치 배터리 제약을 간과해 서비스가 실패했습니다. 기술의 물리적 한계를 먼저 검증해야 한다는 점을 배웠습니다.',
    array['두닷두', '스타트업창업', '실패경험', '스마트워치'],
    'medium'
  ),
  (
    'teaching_mentoring',
    'Apple Developer Academy 강연 및 멘토링',
    'Apple Developer Academy, 대학교 특강, 포트폴리오 멘토링에서 프로덕트 디자이너 커리어와 UX 실무를 강의했습니다. 실무 프로젝트 시행착오를 커리큘럼으로 바꿔 설명합니다.',
    array['강의', '멘토링', 'AppleDeveloperAcademy', '포트폴리오'],
    'medium'
  ),
  (
    'designer_insight',
    '포트폴리오보다 결과물이 먼저 읽힌다',
    '학교 프로젝트였던 Florence 모바일 EMR을 제대로 밀어붙였더니 삼성서울병원에서 직접 구현 문의가 왔습니다. 취업 준비에서도 결국 중요한 건 왜 만들었고 어떤 결과를 냈는지입니다.',
    array['디자이너취업', '포트폴리오', '커리어조언', 'UX리서치'],
    'high'
  ),
  (
    'vibe_coding',
    '디자이너의 바이브코딩 실무 활용',
    'Claude Code, Cursor, Replit을 활용해 Figma 시안을 실제 웹사이트와 컴포넌트로 빠르게 옮기는 방식을 실무에 적용하고 있습니다. 디자인과 구현의 핸드오프 비용을 줄이는 데 집중합니다.',
    array['바이브코딩', 'ClaudeCode', 'Cursor', '랜딩페이지수주'],
    'high'
  );

insert into ai_settings (
  default_provider,
  default_model,
  custom_system_prompt,
  tone_settings,
  telegram_chat_id,
  telegram_send_time,
  default_post_time,
  timezone
)
values (
  'anthropic',
  'claude-sonnet',
  'Write as Philip, a senior UI/UX designer with strong product storytelling and mentoring tone.',
  '{"politeness":"formal","line_break_style":"threads"}'::jsonb,
  'replace-with-telegram-chat-id',
  '07:00:00',
  '09:00:00',
  'Asia/Seoul'
);
