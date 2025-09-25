import { requireNameOrRedirect } from '@/lib/guard'
import VotePhotosClient from './VotePhotosClient'

export default async function VotePhotos(props: any) {
  await requireNameOrRedirect()
  
  return <VotePhotosClient />
}
