import { Helmet } from 'react-helmet-async';

const DEFAULT_SITE_URL = 'https://study-buddy.netlify.app';
const DEFAULT_TITLE = 'Study Buddy - AI Powered Flashcard Generator';
const DEFAULT_DESCRIPTION =
  'Study Buddy is an AI powered flashcard generator that turns notes, PDFs, and study topics into smart flashcards, quizzes, and spaced repetition practice.';
const DEFAULT_IMAGE = '/og-default.svg';
const SITE_NAME = 'Study Buddy';

const getSiteUrl = () =>
  (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');

const toAbsoluteUrl = (value) => {
  if (!value) return `${getSiteUrl()}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${getSiteUrl()}${value.startsWith('/') ? value : `/${value}`}`;
};

const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  structuredData,
}) => {
  const siteUrl = getSiteUrl();
  const pageUrl =
    url ||
    (typeof window !== 'undefined'
      ? `${siteUrl}${window.location.pathname}`
      : `${siteUrl}/`);
  const metaTitle = title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;
  const metaImage = toAbsoluteUrl(image);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    alternateName: DEFAULT_TITLE,
    url: siteUrl,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    description: DEFAULT_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={pageUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} app preview`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} app preview`} />

      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
