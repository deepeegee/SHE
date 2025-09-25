import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const ingestSchema = z.object({
  kind: z.enum(['image', 'video']),
  title: z.string().optional(),
  description: z.string().optional(),
  blobPathRaw: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { kind, title, description, blobPathRaw } = ingestSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const asset = await prisma.asset.create({
      data: {
        ownerId: user.id,
        type: kind.toUpperCase() as 'IMAGE' | 'VIDEO',
        title,
        description,
        blobPathRaw,
        status: 'APPROVED',
      },
    })

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Asset ingest error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
