import { ProfileView } from '@/components/profile/ProfileView'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  return {
    title: `@${username}`,
    description: `${username}의 Wallscape 프로필`,
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  return <ProfileView username={username} isOwnProfile={false} />
}
