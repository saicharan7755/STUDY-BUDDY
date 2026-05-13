import { Helmet } from 'react-helmet-async';

const MetaTags = ({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'CramBuddy AI',
  sessionData, // For dynamic OG images
}) => {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription =
    'AI-powered study companion for efficient learning. Generate study plans, flashcards, quizzes, and get AI tutoring help.';
  const metaDescription = description || defaultDescription;

  // Generate dynamic OG image if session data is provided
  const generateOgImage = (data) => {
    if (!data) return `${window.location.origin}/og-default.svg`;

    // Using a simple OG image service (you can replace with your own)
    const baseUrl = 'https://og-image.vercel.app';
    const params = new URLSearchParams({
      title: data.subject || 'Study Session',
      description: `${data.topics?.length || 0} topics • ${data.completionPercentage || 0}% complete`,
      theme: 'dark',
      md: '1',
      fontSize: '100px',
      images: 'https://via.placeholder.com/150/00d4ff/000000?text=📚',
    });

    return `${baseUrl}/${encodeURIComponent(data.subject || 'CramBuddy AI')}.png?${params}`;
  };

  const metaImage = image || generateOgImage(sessionData);
  const metaUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Open Graph tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={metaUrl} />
    </Helmet>
  );
};

export default MetaTags;
