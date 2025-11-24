# Next.js Auth Boilerplate with Supabase

A modern, production-ready authentication boilerplate built with Next.js 15, Supabase, shadcn/ui, and next-intl.

## Features

- 🔐 **Authentication**: Complete auth flow with Supabase (Login, Register, Password Reset, Update Password).
- 🌐 **Internationalization (i18n)**: Built-in support for English and Polish (easily extensible).
- 🎨 **Theming**: 
  - Light/Dark mode support.
  - Multiple color themes: **Zinc** (Default), **Yellow**, **Navy**.
  - Custom theme switcher in the UI.
- 💅 **UI Components**: Built with [shadcn/ui](https://ui.shadcn.com/) and Tailwind CSS v4.
- 🛡️ **Security**: 
  - Protected routes via Middleware.
  - Form validation with Zod.
  - Security Settings dialog (2FA UI mock, Delete Account UI).
- 👤 **User Profile**: 
  - Edit Profile (Name).
  - Change Password.
  - Dashboard with user stats.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix UI)
- **Auth & Backend**: Supabase
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl
- **Icons**: Lucide React

## Getting Started

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open http://localhost:3000**

## Project Structure

- `/app`: Next.js App Router pages and layouts.
  - `/[locale]`: Internationalized routes.
- `/components`: Reusable UI components.
  - `/ui`: shadcn/ui primitive components.
- `/lib`: Utility functions and Supabase client setup.
- `/messages`: Translation JSON files (en.json, pl.json).
- `/contexts`: React Contexts (AuthContext).

## Theming

Themes are defined in `app/globals.css` using CSS variables and Tailwind's `@theme` directive.
To add a new theme:
1. Define color variables in `app/globals.css` (e.g., `.new-theme-light`, `.new-theme-dark`).
2. Register the theme in `app/[locale]/layout.tsx`.
3. Add the option to `components/ThemeToggle.tsx`.

## License

MIT
