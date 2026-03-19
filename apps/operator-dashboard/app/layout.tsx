import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Operator Dashboard',
  description: 'MPP Firewall monitoring and control',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface text-gray-200 antialiased">
        {children}
      </body>
    </html>
  );
}
