import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { getUploadSAS } from '@/lib/azure'
import { authOptions } from '@/lib/auth'

const sasSchema = z.object({
  kind: z.enum(['image', 'video']),
  mime: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { kind, mime } = sasSchema.parse(body)

    const blobName = `${uuidv4()}.${mime.split('/')[1]}`
    const container = kind === 'image' ? 'raw-images' : 'raw-videos'

    const { sasUrl, container: containerName, blobName: fileName } = await getUploadSAS(
      container,
      blobName,
      mime
    )

    return NextResponse.json({ sasUrl, container: containerName, blobName: fileName })
  } catch (error) {
    console.error('SAS generation error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
