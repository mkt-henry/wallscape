import { BottomNavBar } from '@/components/layout/BottomNavBar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNavBar />
    </div>
  )
}
