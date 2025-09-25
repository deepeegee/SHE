# SHE Week Voting MVP

A lean MVP for SHE Week voting built with Next.js 14, NextAuth, Prisma, and Azure Blob Storage.

## Features

- **Authentication**: Azure AD + Email magic link
- **File Upload**: Direct to Azure Blob Storage with SAS tokens
- **Voting System**: Select up to 5 photos/videos per category
- **Admin Dashboard**: View leaderboards with department/supervisor info
- **Live Toggles**: Control voting windows via environment variables

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   - Copy `.env.example` to `.env.local`
   - Fill in all required environment variables

3. **Database Setup**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Azure Storage Setup**:
   - Create containers: `raw-images`, `raw-videos`
   - Set up Azure Storage account and get credentials

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required variables including:
- Database connection
- NextAuth configuration
- Azure AD credentials
- Email server settings
- Azure Storage credentials
- Live toggles for voting windows

## Admin Access

To make a user admin, set `isAdmin = true` in the database for their user record.

## API Endpoints

- `POST /api/profile/upsert` - Update user profile
- `POST /api/upload/sas` - Get upload SAS token
- `POST /api/assets/ingest` - Save uploaded asset
- `GET /api/feed` - Get paginated assets
- `GET /api/ballot` - Get current ballot
- `PATCH /api/ballot` - Add/remove ballot items
- `POST /api/ballot/submit` - Submit final votes
- `GET /api/admin/leaderboard` - Admin leaderboard

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Azure AD + Email providers
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Azure Blob Storage with SAS tokens
- **Validation**: Zod schemas
- **UI**: Mobile-first responsive design
