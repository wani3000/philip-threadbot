insert into philip_profiles (category, title, content, tags, priority)
values
  (
    'career',
    'Uppsala Security product design',
    'Worked on blockchain and security-focused product experiences while balancing trust, clarity, and dense information design.',
    array['security', 'fintech', 'career'],
    'high'
  ),
  (
    'teaching',
    'Apple Developer Academy lecture experience',
    'Delivered design-related sessions for learners and translated practical product thinking into teachable steps.',
    array['teaching', 'academy', 'mentoring'],
    'medium'
  ),
  (
    'vibe_coding',
    'Claude Code and Cursor workflow',
    'Used Claude Code and Cursor to reduce iteration time while keeping product and UX judgment at the center of implementation.',
    array['ai', 'vibe-coding', 'workflow'],
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
