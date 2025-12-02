import type { Metadata, Viewport } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Berrylicious Dashboard',
    template: '%s | Berrylicious',
  },
  description: 'Professional kiosk management dashboard for Berrylicious - track sales, costs, inventory, and profits in real-time.',
  keywords: ['kiosk', 'dashboard', 'sales tracking', 'inventory', 'pos', 'berrylicious', 'strawberry'],
  authors: [{ name: 'Berrylicious Team' }],
  creator: 'Berrylicious',
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    title: 'Berrylicious Dashboard',
    description: 'Professional kiosk management dashboard - track sales, costs, inventory, and profits.',
    siteName: 'Berrylicious Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Berrylicious Dashboard',
    description: 'Professional kiosk management dashboard - track sales, costs, inventory, and profits.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f3ed' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
