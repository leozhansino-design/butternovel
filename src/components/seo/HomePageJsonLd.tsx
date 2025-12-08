// src/components/seo/HomePageJsonLd.tsx
// Structured data for homepage - helps Google understand the site better

export default function HomePageJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  // Organization schema - tells Google about ButterNovel as a brand
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'ButterNovel',
    alternateName: ['Butter Novel', 'Butter-Novel', 'butternovel.com'],
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/icon-512.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      'https://twitter.com/butternovel',
      // Add other social media profiles here
    ],
    description: 'ButterNovel is a free online novel reading platform offering thousands of web novels in fantasy, romance, sci-fi, and more genres.',
  }

  // WebSite schema - enables sitelinks search box in Google
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'ButterNovel',
    alternateName: ['Butter Novel', 'ButterNovel.com'],
    url: baseUrl,
    description: 'Free online novel reading platform',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  }

  // WebPage schema for homepage
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${baseUrl}/#webpage`,
    url: baseUrl,
    name: 'ButterNovel - Free Novels Online | Read Web Novels Free',
    description: 'ButterNovel (Butter Novel) - Read millions of free novels online. Fantasy, romance, sci-fi, adventure and more.',
    isPartOf: {
      '@id': `${baseUrl}/#website`,
    },
    about: {
      '@id': `${baseUrl}/#organization`,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${baseUrl}/og-image.png`,
    },
    inLanguage: 'en-US',
  }

  // CollectionPage schema - tells Google this is a collection of novels
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Novels Collection',
    description: 'Browse our collection of free online novels including fantasy, romance, sci-fi, and more.',
    url: baseUrl,
    isPartOf: {
      '@id': `${baseUrl}/#website`,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Fantasy Novels',
          url: `${baseUrl}/search?category=fantasy`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Romance Novels',
          url: `${baseUrl}/search?category=romance`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Sci-Fi Novels',
          url: `${baseUrl}/search?category=sci-fi`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Adventure Novels',
          url: `${baseUrl}/search?category=adventure`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: 'Mystery Novels',
          url: `${baseUrl}/search?category=mystery`,
        },
      ],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
    </>
  )
}
