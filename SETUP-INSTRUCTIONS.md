# Setup Instructions for Featured Article Functionality

## Step 1: Run the SQL Migration

1. Open your Supabase project at https://supabase.com/dashboard
2. Navigate to your project: https://nrirqijyayrwhckmjltn.supabase.co
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase-add-featured-to-articles.sql`
6. Click **Run** to execute the SQL

This will add the `featured` column to your articles table.

## Step 2: Clean Up Old Sample Articles (Optional)

If you see old sample articles in your database that you want to remove:

1. Go to **Table Editor** in Supabase
2. Select the **articles** table
3. Find any articles with slugs like "weekly-endocrine-digest", "ai-draft-thyroid-guidance", "glp1-insights"
4. Delete them (these were from the old mock data)

Or run this SQL to delete them all at once:

```sql
DELETE FROM public.articles
WHERE slug IN (
  'weekly-endocrine-digest',
  'ai-draft-thyroid-guidance',
  'glp1-insights'
);
```

## Step 3: Verify

1. Refresh your homepage at http://localhost:3002
2. You should see your actual latest published article (or nothing if you haven't published any yet)
3. Go to any article edit page and check the "Pin as featured article" box to feature it on the homepage

## Troubleshooting

If you still see errors:
- Make sure the SQL migration completed successfully
- Check that you have at least one published article in your database
- Restart your dev server: Stop the running dev server and run `npm run dev` again
