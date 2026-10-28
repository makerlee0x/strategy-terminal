export default function sitemap() {
  const base = 'https://www.strategycoin.io';
  const now = new Date();
  return [
    { url: base + '/', lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: base + '/strategy', lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: base + '/mstr', lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: base + '/8k', lastModified: now, changeFrequency: 'daily', priority: 0.7 }
  ];
}
