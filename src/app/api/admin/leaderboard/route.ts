import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [topImages, topVideos] = await Promise.all([
      prisma.asset.findMany({
        where: {
          type: 'IMAGE',
          status: 'APPROVED',
        },
        include: {
          owner: {
            select: { name: true, department: true, supervisor: true },
          },
        },
        orderBy: { likeCount: 'desc' },
        take: 20,
      }),
      prisma.asset.findMany({
        where: {
          type: 'VIDEO',
          status: 'APPROVED',
        },
        include: {
          owner: {
            select: { name: true, department: true, supervisor: true },
          },
        },
        orderBy: { likeCount: 'desc' },
        take: 20,
      }),
    ])

    return NextResponse.json({
      images: topImages,
      videos: topVideos,
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
