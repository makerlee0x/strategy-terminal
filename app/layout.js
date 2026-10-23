import './globals.css';

const title = 'STRATEGY COIN · Amplified MSTR';
const description =
  '$STRATEGY is paired with tokenized MSTR. Hold. Hold. Amplify.';
const ogAlt = 'STRATEGY COIN — MSTR in the pool for every 1M $STRATEGY';

export const metadata = {
  metadataBase: new URL('https://www.strategycoin.io'),
  title: { default: title, template: '%s · STRATEGY COIN' },
  description,
  applicationName: 'STRATEGY COIN',
  keywords: [
    'STRATEGY',
    '$STRATEGY',
    'Strategy Coin',
    'MSTR',
    'tokenized MSTR',
    'Robinhood Chain',
    'Bitcoin',
    'Saylor'
  ],
  authors: [{ name: 'Strategy Coin' }],
  creator: 'Strategy Coin',
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  alternates: { canonical: '/' },
  icons: { icon: '/strategy-icon.png', apple: '/strategy-icon.png' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.strategycoin.io/',
    siteName: 'STRATEGY COIN',
    title,
    description,
    images: [
      { url: '/api/card/stack', width: 1200, height: 675, alt: ogAlt, type: 'image/png' }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@strategystock',
    creator: '@strategystock',
    title,
    description,
    images: ['/api/card/stack']
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#d9232e'
};

export default function L({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bungee&family=Rubik+Mono+One&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="navband">
          <nav aria-label="Main">
            <a className="logo" href="/" aria-label="STRATEGY COIN home">
              <img src="/strategy-logo.svg" alt="STRATEGY COIN" width="259" height="36" />
            </a>
            <a className="l" href="/strategy/">
              $strategy
            </a>
            <a className="l" href="/mstr/">
              mstr on-chain
            </a>
            <a className="buy" href="/#buy">
              buy $strategy
            </a>
          </nav>
        </div>
        <main>{children}</main>
        <a className="buybar" href="/#buy">
          buy $strategy
        </a>
        <footer>
          <span>
            STRATEGY COIN is a memecoin. Not affiliated with, endorsed by, or sponsored by Strategy₿
            Inc. Informational only, not investment advice.
          </span>
          <span className="foot-links">
            <a href="https://x.com/strategystock" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
              @strategystock
            </a>
            <a
              href="https://dexscreener.com/robinhood/0xa6975f4720a95aa9cdfa9b010a065b0e941534c93f9fa708104c08f0ac029ca0"
              target="_blank"
              rel="noopener"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3 3h2v16h16v2H3zM7 11h2.5v6H7zm4.25-5h2.5v11h-2.5zm4.25 3H18v8h-2.5z"
                />
              </svg>
              Dexscreener
            </a>
            <a className="egg" href="/terminal/" title="terminal" aria-label="Open the STRATEGY COIN terminal">
              C:\&gt;
              <span className="cur" aria-hidden="true" />
            </a>
          </span>
        </footer>
      </body>
    </html>
  );
}
