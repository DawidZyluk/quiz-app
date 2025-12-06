# Quizy - Learning Platform


https://github.com/user-attachments/assets/8426bdef-534f-4958-821c-bf06333df639



A modern, serverless learning platform built with Next.js 15, Supabase, and modern web technologies. This project was created for learning purposes, focusing on building serverless applications with Next.js, exploring modern React patterns, and implementing a full-stack application with authentication and database management.

## About

This project serves as a learning exercise to understand and implement:
- **Serverless Architecture**: Building applications using Next.js serverless functions and edge runtime
- **Modern React Patterns**: Utilizing React 19, Server Components, and Client Components effectively
- **Full-Stack Development**: Integrating frontend with Supabase backend (PostgreSQL, Authentication, Storage)
- **Type-Safe Development**: TypeScript throughout the entire application
- **Internationalization**: Multi-language support with next-intl
- **Modern UI/UX**: Building responsive, accessible interfaces with shadcn/ui and Tailwind CSS

## Features

- 🔐 **Authentication**: Complete auth flow with Supabase (Login, Register, Password Reset, Update Password)
- 📚 **Learning Management**: 
  - Create and organize topics
  - Build quizzes with multiple questions
  - Create flashcard decks for spaced repetition learning
  - Track progress on quizzes and flashcards
- 🌐 **Internationalization (i18n)**: Built-in support for English and Polish (easily extensible)
- 🎨 **Theming**: 
  - Light/Dark mode support
  - Multiple color themes: **Zinc** (Default), **Yellow**, **Navy**
  - Custom theme switcher in the UI
- 💅 **UI Components**: Built with [shadcn/ui](https://ui.shadcn.com/) and Tailwind CSS v4
- 🛡️ **Security**: 
  - Protected routes via Middleware
  - Form validation with Zod
  - Row-level security policies in Supabase
- 👤 **User Profile**: 
  - Edit Profile (Name)
  - Change Password
  - Dashboard with learning progress

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

- `/app`: Next.js App Router pages and layouts
  - `/[locale]`: Internationalized routes
  - `/dashboard`: Main application area with topics, quizzes, and flashcards
- `/components`: Reusable UI components
  - `/ui`: shadcn/ui primitive components
  - Dialog components for CRUD operations (topics, quizzes, flashcards)
  - Study and exam components for quizzes and flashcards
- `/lib`: Utility functions and Supabase client setup
  - `/supabase`: Client and server-side Supabase configurations
  - `actions.ts`: Server actions for data operations
- `/messages`: Translation JSON files (en.json, pl.json)
- `/contexts`: React Contexts (AuthContext)
- `/supabase/migrations`: Database schema migrations

## Theming

Themes are defined in `app/globals.css` using CSS variables and Tailwind's `@theme` directive.
To add a new theme:
1. Define color variables in `app/globals.css` (e.g., `.new-theme-light`, `.new-theme-dark`).
2. Register the theme in `app/[locale]/layout.tsx`.
3. Add the option to `components/ThemeToggle.tsx`.

## Learning Goals

This project was developed to:
- Master Next.js 15 App Router and serverless architecture
- Learn Supabase integration (Auth, Database, Storage)
- Practice building type-safe full-stack applications
- Understand modern React patterns and Server/Client Components
- Implement proper authentication and authorization flows
- Create responsive, accessible user interfaces
- Work with internationalization in modern web applications

## License

MIT
