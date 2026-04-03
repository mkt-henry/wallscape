import { ProfileView } from '@/components/profile/ProfileView'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const t = await getTranslations('profile')
  return {
    title: `@${username}`,
    description: `${username}${t('profileOf')}`,
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  return <ProfileView username={username} />
}
