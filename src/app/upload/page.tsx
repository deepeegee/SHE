import { requireNameOrRedirect } from '@/lib/guard'
import UploadClient from './UploadClient'

export default async function Upload(props: any) {
  await requireNameOrRedirect()
  
  return <UploadClient />
}
