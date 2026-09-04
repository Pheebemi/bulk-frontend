import type { Metadata } from 'next';
import { Manrope, Work_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { UserStoreProvider, AdminStoreProvider } from '@/lib/store';

const manrope = Manrope({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-manrope' });
const workSans = Work_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-work-sans' });

export const metadata: Metadata = {
  title: 'Reachly — Bulk SMS Platform',
  description: 'Send bulk SMS campaigns, manage contacts, and track delivery — powered by Termii.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${workSans.variable}`} suppressHydrationWarning>
      <body className="font-body min-h-screen">
        <ThemeProvider>
          <UserStoreProvider>
            <AdminStoreProvider>{children}</AdminStoreProvider>
          </UserStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
