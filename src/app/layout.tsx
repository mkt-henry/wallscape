// Minimal root layout — the real layout lives in [locale]/layout.tsx
// This file exists because Next.js requires a root layout,
// but <html> and <body> are rendered by the locale layout.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
