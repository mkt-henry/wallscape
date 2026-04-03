import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import AdminDashboard from './AdminDashboard'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

export async function generateMetadata() {
  const t = await getTranslations('metadata')
  return {
    title: t('adminTitle'),
    robots: 'noindex, nofollow',
  }
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
