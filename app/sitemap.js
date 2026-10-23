export default function sitemap() {
  const base = 'https://www.strategycoin.io';
  const now = new Date();
  return [
    { url: base + '/', lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: base + '/strategy', lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: base + '/mstr', lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: base + '/8k', lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: base + '/terminal', lastModified: now, changeFrequency: 'daily', priority: 0.5 },
    { url: base + '/share/stack', lastModified: now, changeFrequency: 'daily', priority: 0.4 },
    { url: base + '/share/supply', lastModified: now, changeFrequency: 'daily', priority: 0.4 },
    { url: base + '/llms.txt', lastModified: now, changeFrequency: 'monthly', priority: 0.2 },
    { url: base + '/agents.txt', lastModified: now, changeFrequency: 'monthly', priority: 0.2 }
  ];
}
