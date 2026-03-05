# II Admin System

A modern Human Resource Management system built with Next.js 14, React, TypeScript, TailwindCSS, and Supabase.

## Features

- 🔐 **Authentication** - Supabase Auth with protected routes
- 👥 **Employee Management** - CRUD operations for employees
- 🏢 **Department Management** - Organize employees by department
- 📅 **Leave Management** - Request, approve, and track leave
- ⏰ **Attendance Tracking** - Clock in/out and attendance records
- 📊 **Dashboard** - Overview of HR metrics

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account

### Setup

1. **Install dependencies:**
   ```bash
   cd hrm-react
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the schema from `supabase/schema.sql`
   - Copy your project URL and anon key from Settings > API

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Create an admin user:**
   - Sign up via Supabase Auth dashboard or the app
   - Add a row to `user_roles` table linking the user to admin role

## Project Structure

```
hrm-react/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── login/              # Auth pages
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── layout/             # Sidebar, Header
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # React Query hooks
│   ├── lib/
│   │   ├── supabase/           # Supabase client setup
│   │   └── utils.ts            # Helper functions
│   └── services/               # API service layer
└── supabase/
    └── schema.sql              # Database schema
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **State:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
