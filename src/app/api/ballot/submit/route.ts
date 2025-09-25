import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import { authOptions } from '@/lib/auth'

const submitSchema = z.object({
  category: z.enum(['IMAGE', 'VIDEO']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category } = submitSchema.parse(body)

    // Check if voting is live for this category
    if (category === 'IMAGE' && !env.PHOTOS_LIVE) {
      return NextResponse.json({ error: 'Photo voting is not live' }, { status: 400 })
    }
    if (category === 'VIDEO' && !env.VIDEOS_LIVE) {
      return NextResponse.json({ error: 'Video voting is not live' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has votes in this category
    const existingVotes = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        asset: { type: category },
      },
    })

    if (existingVotes) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    }

    const ballot = await prisma.ballot.findFirst({
      where: {
        userId: user.id,
        category,
        status: 'DRAFT',
      },
      include: { items: true },
    })

    if (!ballot || ballot.items.length === 0) {
      return NextResponse.json({ error: 'No items to submit' }, { status: 400 })
    }

    // Create votes and update like counts
    await prisma.$transaction(async (tx) => {
      // Create votes
      await tx.vote.createMany({
        data: ballot.items.map((item) => ({
          userId: user.id,
          assetId: item.assetId,
        })),
        skipDuplicates: true,
      })

      // Update like counts
      await tx.asset.updateMany({
        where: {
          id: { in: ballot.items.map((item) => item.assetId) },
        },
        data: {
          likeCount: { increment: 1 },
        },
      })

      // Mark ballot as submitted
      await tx.ballot.update({
        where: { id: ballot.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ballot submit error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
