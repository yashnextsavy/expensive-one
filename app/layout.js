import "./globals.css";

export const metadata = {
  title: "Expense Tracker",
  description: "A simple expense tracker PWA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/sw.js").catch((error) => {
                  console.error("Service Worker registration failed:", error);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}