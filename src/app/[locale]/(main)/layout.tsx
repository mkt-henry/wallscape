import { BottomNavBar } from '@/components/layout/BottomNavBar'
import { SideNav } from '@/components/layout/SideNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background flex">
      {/* Desktop sidebar */}
      <SideNav />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 min-w-0 flex flex-col md:ml-16 lg:ml-56">
        <main className="flex-1 min-w-0 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNavBar />
    </div>
  )
}
