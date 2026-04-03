import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('activityTitle'),
    description: t('activityDescription'),
  }
}

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return children
}
