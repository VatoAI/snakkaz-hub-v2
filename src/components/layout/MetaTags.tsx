import Head from 'next/head';

export const MetaTags = () => {
  return (
    <Head>
      {/* Mobile Web App Capable */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      
      {/* App Title */}
      <meta name="application-name" content="Snakkaz" />
      <meta name="apple-mobile-web-app-title" content="Snakkaz" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#ffffff" />
      <meta name="msapplication-navbutton-color" content="#ffffff" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />
      
      {/* Icons */}
      <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      
      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />
    </Head>
  );
}; 