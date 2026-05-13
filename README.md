# CramBuddy AI - Study Companion

AI-powered study companion for efficient learning. Generate study plans, flashcards, quizzes, and get AI tutoring help.

## Features

- **AI-Powered Study Plans**: Paste your syllabus and get personalized study strategies
- **Interactive Flashcards**: Spaced repetition learning system
- **AI Quizzes**: Test your knowledge with dynamically generated questions
- **AI Tutor**: Get instant help and explanations
- **Progress Tracking**: Monitor your learning journey
- **SEO Optimized**: Dynamic meta tags and Open Graph images for sharing

## SEO & Meta Management

This app uses React Helmet Async for dynamic meta tag management:

- **Dynamic Titles & Descriptions**: Page-specific meta tags
- **Open Graph Images**: Custom OG images for study sessions using Vercel's OG Image service
- **Twitter Cards**: Optimized sharing on Twitter
- **Canonical URLs**: Proper SEO structure

### Meta Tags Implementation

Each page uses the `MetaTags` component with appropriate content:

```jsx
<MetaTags
  title="Page Title"
  description="Page description for SEO"
  sessionData={session} // For dynamic OG images
/>
```

## Development

```bash
npm install
npm run dev
```

## Build & Deployment

```bash
npm run build
npm run preview
```

## SSR Considerations

For better SEO and performance, consider migrating to Next.js:

### Benefits of Next.js Migration:

- **Server-Side Rendering**: Better SEO and initial page load
- **Static Generation**: Pre-render pages for optimal performance
- **API Routes**: Built-in API endpoints for dynamic OG images
- **Image Optimization**: Next.js Image component for OG images

### Migration Steps:

1. Create new Next.js project
2. Move components and pages
3. Set up Firebase integration
4. Implement API routes for dynamic content
5. Configure OG image generation

## Tech Stack

- React 19
- Vite
- Firebase (Auth & Firestore)
- Google Gemini AI
- Tailwind CSS
- React Helmet Async (SEO)
