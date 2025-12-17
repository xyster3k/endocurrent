-- Check which columns are TEXT vs UUID
SELECT
  table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('id', 'author_id', 'user_id', 'resolved_by')
         AND table_name IN ('users', 'profiles') THEN 'Should be TEXT'
    WHEN column_name IN ('author_id', 'user_id', 'resolved_by')
         AND table_name NOT IN ('users', 'profiles') THEN 'Should be TEXT'
    WHEN column_name = 'id'
         AND table_name NOT IN ('users', 'profiles') THEN 'Should be UUID'
    ELSE 'Check manually'
  END as expected_type
FROM information_schema.columns
WHERE table_name IN ('users', 'profiles', 'articles', 'user_subscriptions', 'article_likes', 'article_reports', 'tags')
  AND column_name IN ('id', 'author_id', 'user_id', 'resolved_by')
ORDER BY
  CASE expected_type
    WHEN 'Should be TEXT' THEN 1
    WHEN 'Should be UUID' THEN 2
    ELSE 3
  END,
  table_name,
  column_name;
