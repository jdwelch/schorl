# Supabase Setup

This directory contains database migrations and setup scripts for md-tasks.

## Initial Setup

### Option 1: Using the Setup Script (Recommended)

1. Run the setup script:
   ```bash
   npm run setup:db
   ```

2. Copy the SQL output

3. Paste and run in: Supabase Dashboard > SQL Editor > New Query

### Option 2: Manual Setup via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to: SQL Editor > New Query
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Click "Run" to execute

### Option 3: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Migrations

Migrations are stored in `migrations/` and numbered sequentially:
- `001_initial_schema.sql` - Creates documents table, RLS policies, and indexes

## Database Schema

### `documents` table

Stores the markdown content for each user's tasks.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | Primary key, references auth.users |
| `content` | text | Full markdown document |
| `version` | integer | Version counter for optimistic locking |
| `updated_at` | timestamptz | Auto-updated on changes |
| `created_at` | timestamptz | Record creation time |

### Row Level Security (RLS)

All policies ensure users can only access their own documents:
- ✓ Users can read their own documents
- ✓ Users can insert their own documents
- ✓ Users can update their own documents
- ✓ Users can delete their own documents

## Testing the Setup

After running migrations, test that everything works:

```bash
# Start your app
npm start

# Sign in with magic link
# Your tasks should now sync to Supabase!
```

## Troubleshooting

### "Missing environment variables"
Make sure `.env` contains:
- `EXPO_PUBLIC_SUPABASE_URL`

### "Table already exists"
Migrations are idempotent where possible. If you need to reset:
1. Go to: Supabase Dashboard > Table Editor
2. Delete the `documents` table
3. Re-run the migration
