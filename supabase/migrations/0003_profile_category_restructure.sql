create type profile_category_v2 as enum (
  'career',
  'project',
  'startup_story',
  'teaching_mentoring',
  'designer_insight',
  'vibe_coding'
);

alter table philip_profiles
alter column category type profile_category_v2
using (
  case category::text
    when 'career' then 'career'
    when 'project' then 'project'
    when 'teaching' then 'teaching_mentoring'
    when 'online_course' then 'teaching_mentoring'
    when 'insight' then 'designer_insight'
    when 'business' then 'startup_story'
    when 'vibe_coding' then 'vibe_coding'
  end
)::profile_category_v2;

update posts
set source_snapshot = jsonb_set(
  source_snapshot,
  '{category}',
  to_jsonb(
    case source_snapshot ->> 'category'
      when 'career' then 'career'
      when 'project' then 'project'
      when 'teaching' then 'teaching_mentoring'
      when 'online_course' then 'teaching_mentoring'
      when 'insight' then 'designer_insight'
      when 'business' then 'startup_story'
      when 'vibe_coding' then 'vibe_coding'
      else source_snapshot ->> 'category'
    end
  ),
  true
)
where source_snapshot ? 'category';

alter type profile_category rename to profile_category_legacy;
alter type profile_category_v2 rename to profile_category;
drop type profile_category_legacy;
