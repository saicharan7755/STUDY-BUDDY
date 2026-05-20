# CRAM AI

AI-powered study workspace for generating study plans, flashcards, quizzes, summaries, and review sessions.

## Stack

- React 19 and Vite
- Tailwind CSS
- Firebase Auth and Firestore
- Google Gemini via server-side API routes
- Vercel deployment

## Getting Started

```bash
npm install
npm run dev
```

Run the API server locally when using the Vite proxy:

```bash
npm run backend
```

## Environment

Create a local `.env` file from `.env.example`.

Required server variables:

```bash
GEMINI_API_KEY=
JWT_SECRET=
REFRESH_TOKEN_SECRET=
ALLOWED_ORIGINS=http://localhost:5173
```

Required client variables use the `VITE_` prefix and are documented in `.env.example`.

## Scripts

```bash
npm run dev          # start the Vite app
npm run backend      # start the local Express API
npm run lint         # run ESLint
npm run format       # format the project
npm run build        # generate Vercel API files and build production assets
npm run preview      # preview the production build
```

## Deployment

This project is configured for Vercel.

- `vercel.json` defines Vite output and rewrites.
- `setup-vercel.js` generates the `api/` serverless functions used by `npm run build`.
- `server.js` remains available for local API development or a custom Node deployment.

## Project Layout

```text
api/                 Vercel serverless functions
lib/                 Shared server AI prompt and Gemini route logic
public/              Static public assets and crawler files
src/
  components/        UI and feature components
  config/            Firebase configuration
  constants/         Shared constants and messages
  context/           React providers
  hooks/             Shared React hooks
  pages/             Route-level pages
  services/          App data and AI services
  utils/             Browser utilities
server.js            Local/custom Node API server
setup-vercel.js      Vercel API generator
```
