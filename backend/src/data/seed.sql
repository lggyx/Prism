INSERT INTO observers (
  id,
  observer_code,
  observer_no,
  email,
  phone,
  is_anonymous,
  active_since
) VALUES
  ('user_01', 'OBS-0001', '01', 'alex@example.com', NULL, FALSE, '2026-05-09 16:00:00')
ON DUPLICATE KEY UPDATE
  observer_code = VALUES(observer_code),
  observer_no = VALUES(observer_no),
  email = VALUES(email),
  phone = VALUES(phone),
  is_anonymous = VALUES(is_anonymous);

INSERT INTO observer_settings (
  observer_id,
  show_community_location,
  location_precision,
  challenge_notifications,
  interface_theme,
  default_slice_public
) VALUES
  ('user_01', TRUE, 'CITY', TRUE, 'DARK', FALSE)
ON DUPLICATE KEY UPDATE
  show_community_location = VALUES(show_community_location),
  location_precision = VALUES(location_precision),
  challenge_notifications = VALUES(challenge_notifications),
  interface_theme = VALUES(interface_theme),
  default_slice_public = VALUES(default_slice_public);

INSERT INTO lenses (
  id,
  name,
  english_name,
  category,
  color,
  icon,
  description,
  full_description,
  prompt,
  is_preset,
  is_available,
  created_by
) VALUES
  ('naturalist', '博物学家', 'NATURALIST', 'NATURE', '#5DCAA5', 'ti-leaf', '生态标本与田野笔记', '以博物学家的眼睛重新注视日常。', NULL, TRUE, TRUE, NULL),
  ('urban-fatigue', '都市倦怠', 'URBAN FATIGUE', 'URBAN', '#B4B2A9', 'ti-moon', '疲惫都市人的凝视', '以都市倦怠的眼睛重新注视日常。', NULL, TRUE, TRUE, NULL),
  ('song-literati', '宋代文人', 'SONG LITERATI', 'CULTURE', '#FAC775', 'ti-brush', '清供雅趣与闲适心境', '以宋代文人的眼睛重新注视日常。', NULL, TRUE, TRUE, NULL),
  ('ruin-archaeology', '废墟考古', 'RUIN ARCHAEOLOGY', 'TEMPORAL', '#F0997B', 'ti-building', '当下之物的未来化石', '以废墟考古的眼睛重新注视日常。', NULL, TRUE, TRUE, NULL),
  ('economist', '经济学家', 'ECONOMIST', 'URBAN', '#85B7EB', 'ti-chart-bar', '一切都是资源、成本与博弈', '以经济学家的眼睛重新注视日常。', NULL, TRUE, TRUE, NULL),
  ('child-eye', '儿童视角', 'CHILD''S EYE', 'CULTURE', '#ED93B1', 'ti-eye', '如果你只有五岁，这是什么', '以儿童视角的眼睛重新注视日常。', NULL, TRUE, TRUE, NULL)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  english_name = VALUES(english_name),
  category = VALUES(category),
  color = VALUES(color),
  icon = VALUES(icon),
  description = VALUES(description),
  full_description = VALUES(full_description),
  prompt = VALUES(prompt),
  is_preset = VALUES(is_preset),
  is_available = VALUES(is_available),
  created_by = VALUES(created_by);

INSERT INTO lens_usage (
  observer_id,
  lens_id,
  usage_count,
  first_used_at,
  last_used_at
) VALUES
  ('user_01', 'naturalist', 5, '2026-05-10 01:00:00', '2026-05-16 02:20:00'),
  ('user_01', 'urban-fatigue', 3, '2026-05-11 01:00:00', '2026-05-15 13:10:00'),
  ('user_01', 'song-literati', 2, '2026-05-12 01:00:00', '2026-05-14 11:00:00'),
  ('user_01', 'ruin-archaeology', 1, '2026-05-13 01:00:00', '2026-05-17 01:40:00')
ON DUPLICATE KEY UPDATE
  usage_count = VALUES(usage_count),
  first_used_at = VALUES(first_used_at),
  last_used_at = VALUES(last_used_at);
