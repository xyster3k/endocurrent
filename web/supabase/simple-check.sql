-- Simple check: Are user ID columns TEXT?
SELECT
  'users.id' as column_location,
  data_type as current_type,
  CASE WHEN data_type = 'text' THEN '✅ CORRECT' ELSE '❌ WRONG (should be text)' END as status
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id'

UNION ALL

SELECT
  'profiles.id' as column_location,
  data_type as current_type,
  CASE WHEN data_type = 'text' THEN '✅ CORRECT' ELSE '❌ WRONG (should be text)' END as status
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'id'

UNION ALL

SELECT
  'articles.author_id' as column_location,
  data_type as current_type,
  CASE WHEN data_type = 'text' THEN '✅ CORRECT' ELSE '❌ WRONG (should be text)' END as status
FROM information_schema.columns
WHERE table_name = 'articles' AND column_name = 'author_id'

UNION ALL

SELECT
  'articles.id (should be UUID)' as column_location,
  data_type as current_type,
  CASE WHEN data_type = 'uuid' THEN '✅ CORRECT' ELSE '❌ WRONG (should be uuid)' END as status
FROM information_schema.columns
WHERE table_name = 'articles' AND column_name = 'id';
