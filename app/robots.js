export default function robots() {
  const host = 'https://www.strategycoin.io';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/strategy', '/mstr', '/8k', '/terminal', '/share/', '/llms.txt', '/agents.txt'],
        disallow: [
          '/api/',
          '/*.php$',
          '/*.php?',
          '/wp-admin',
          '/wp-login',
          '/wordpress',
          '/phpmyadmin',
          '/cgi-bin',
          '/.env',
          '/.git'
        ]
      },
      // Operators / AI agents: crawl the product pages; don't scrape JSON endpoints.
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Anthropic-AI',
          'Google-Extended',
          'PerplexityBot',
          'Applebot-Extended',
          'CCBot'
        ],
        allow: ['/', '/strategy', '/mstr', '/8k', '/llms.txt', '/agents.txt'],
        disallow: ['/api/', '/terminal']
      }
    ],
    sitemap: host + '/sitemap.xml',
    host
  };
}
