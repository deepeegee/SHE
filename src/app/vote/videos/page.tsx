import { requireNameOrRedirect } from '@/lib/guard'
import VoteVideosClient from './VoteVideosClient'

export default async function VoteVideos(props: any) {
  await requireNameOrRedirect()
  
  return <VoteVideosClient />
}
