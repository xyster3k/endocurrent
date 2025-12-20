# Content Platform Template

A modern, full-featured content publishing platform built with Next.js 15, designed for blogs, news sites, and content-driven applications. Includes authentication, CMS, SEO optimization, GDPR compliance, and monetization support out of the box.

## Features

### Content Management

- **Article Editor** - Rich text editor with markdown storage
- **Draft System** - Draft, published, and archived article states
- **AI-Assisted Writing** - Generate article drafts using LLM integration
- **Categories & Tags** - Organize content with flexible taxonomy
- **Featured Articles** - Highlight important content on the homepage
- **Cover Images** - Support for article cover images via Supabase Storage
- **Reading Time** - Automatic reading time calculation

### Authentication & Authorization

- **Clerk Integration** - Secure, modern authentication
- **Role-Based Access Control** - Subscriber, User, Editor, and Admin roles
- **Protected Routes** - Admin area restricted to authorized users
- **User Profiles** - Display names and author attribution

### User Engagement

- **Like/Dislike System** - Article reactions with real-time updates
- **Article Reporting** - Users can flag problematic content
- **Share Functionality** - Track article shares
- **Contact Form** - Built-in contact form with email notifications

### Admin Dashboard

- **Article Management** - Create, edit, publish, unpublish articles
- **AI Draft Queue** - Review and edit AI-generated content
- **Menu Builder** - Visual header menu management with nested items
- **Static Pages** - Edit About, Privacy, and Terms pages from the admin
- **Settings** - Configure analytics, site settings, and more
- **Reports Dashboard** - Review and resolve user-submitted reports

### SEO Optimization

- **Dynamic Sitemap** - Auto-generated sitemap.xml with all pages
- **Robots.txt** - Configurable crawler directives
- **Open Graph Tags** - Full social media preview support
- **Twitter Cards** - Optimized Twitter sharing
- **JSON-LD Structured Data** - Rich snippets for articles
- **Canonical URLs** - Proper URL canonicalization
- **Meta Tags** - Per-page title, description, and keywords

### GDPR Compliance

- **Cookie Consent Banner** - Granular consent for analytics/marketing
- **Data Export** - Users can download all their data as JSON
- **Account Deletion** - Full account and data deletion
- **Privacy Controls** - Cookie settings accessible from footer

### Monetization

- **Google AdSense Integration** - Consent-aware ad loading
- **Premium Subscriptions** - Stripe billing via Clerk
- **Ad-Free Premium** - Disable ads for paying subscribers

### Email Notifications

- **Resend Integration** - Transactional email support
- **Report Notifications** - Email alerts for content reports
- **Contact Form Emails** - Forward contact submissions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk |
| Email | Resend |
| Hosting | Cloudflare Pages (via OpenNext) |
| Analytics | Google Analytics 4 |
| Ads | Google AdSense |

## Project Structure

```
src/
├── app/
│   ├── (routes)/           # Public pages
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── sitemap.ts          # Dynamic sitemap
├── components/
│   ├── site-header.tsx     # Navigation header
│   ├── site-footer.tsx     # Footer with links
│   ├── cookie-consent.tsx  # GDPR cookie banner
│   ├── rich-text-editor.tsx # Article editor
│   └── ...
├── lib/
│   ├── auth.ts             # Auth utilities
│   ├── data/               # Data fetching functions
│   ├── supabase/           # Supabase client
│   └── email.ts            # Email utilities
└── db/
    └── types.ts            # Database type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Clerk account
- (Optional) Resend account for emails
- (Optional) Google Analytics & AdSense accounts

### Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Email (Optional)
RESEND_API_KEY=re_...

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_GTM_ID=GTM-...

# Ads (Optional)
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-...
ADS_DISABLED=false

# Site
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run build:cloudflare
```

### Database Setup

Run these SQL commands in Supabase to create the required tables:

```sql
-- Articles table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_markdown TEXT,
  status TEXT DEFAULT 'draft',
  category TEXT,
  tags TEXT[],
  reading_time_minutes INT,
  word_count INT,
  author_id TEXT,
  featured BOOLEAN DEFAULT FALSE,
  cover_image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article likes
CREATE TABLE article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id),
  user_id TEXT,
  value INT,
  UNIQUE(article_id, user_id)
);

-- Article reports
CREATE TABLE article_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id),
  user_id TEXT,
  reason_code TEXT,
  comment TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menus
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES menus(id),
  label TEXT NOT NULL,
  url TEXT,
  category TEXT,
  parent_id UUID REFERENCES menu_items(id),
  order_index INT DEFAULT 0
);
```

## User Roles

| Role | Permissions |
|------|-------------|
| Subscriber | Read articles, like/dislike, report |
| User | Same as subscriber |
| Editor | All subscriber permissions + create/edit articles, manage drafts |
| Admin | All permissions + manage users, settings, menus |

Set user roles in Clerk Dashboard under User > Public Metadata:
```json
{ "role": "admin" }
```

## Deployment

### Cloudflare Pages

This template is optimized for Cloudflare Pages using OpenNext:

```bash
npm run build:cloudflare
npx wrangler pages deploy .open-next/assets --project-name=your-project
```

### Other Platforms

Standard Next.js deployment works on Vercel, Netlify, or any Node.js host:

```bash
npm run build
npm start
```

## Customization

### Theming

Edit `tailwind.config.ts` and `src/app/globals.css` for colors, fonts, and styling.

### Branding

Replace logo images and update:
- `src/app/layout.tsx` - Site metadata
- `src/components/site-header.tsx` - Logo images
- `src/components/site-footer.tsx` - Footer text

### Adding Pages

Create new routes in `src/app/` following Next.js App Router conventions.

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/articles/[id]/like` | POST | Like/dislike article |
| `/api/articles/[id]/report` | POST | Report article |
| `/api/articles/[id]/share` | POST | Track share |
| `/api/user/export` | GET | Export user data (GDPR) |
| `/api/user/delete` | DELETE | Delete account (GDPR) |
| `/api/admin/articles` | GET/POST | Manage articles |
| `/api/admin/settings` | GET/POST | Site settings |
| `/api/menus` | GET | Get navigation menu |
| `/api/contact` | POST | Contact form submission |

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**.

You are free to:
- Share and adapt the code for non-commercial purposes
- Must give appropriate credit
- Must distribute under the same license

See [LICENSE](LICENSE) for details.
