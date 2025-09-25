import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const feedSchema = z.object({
  type: z.enum(['image', 'video']),
  take: z.string().transform(Number).default('24'),
  cursor: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { type, take, cursor } = feedSchema.parse({
      type: searchParams.get('type'),
      take: searchParams.get('take'),
      cursor: searchParams.get('cursor'),
    })

    const assets = await prisma.asset.findMany({
      where: {
        type: type.toUpperCase() as 'IMAGE' | 'VIDEO',
        status: 'APPROVED',
      },
      include: {
        owner: {
          select: { name: true, department: true, supervisor: true },
        },
      },
      take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
