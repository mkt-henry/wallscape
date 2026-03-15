import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

export const metadata = {
  title: '관리자 대시보드 — Wallscape',
  robots: 'noindex, nofollow',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/login?redirectTo=/admin')
  }

  return <AdminDashboard />
}
