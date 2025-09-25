import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const ballotSchema = z.object({
  category: z.enum(['IMAGE', 'VIDEO']),
  assetId: z.string(),
  action: z.enum(['add', 'remove']),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as 'IMAGE' | 'VIDEO'

    if (!category || !['IMAGE', 'VIDEO'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const ballot = await prisma.ballot.findFirst({
      where: {
        userId: user.id,
        category,
        status: 'DRAFT',
      },
      include: {
        items: {
          include: {
            asset: {
              include: {
                owner: {
                  select: { name: true, department: true, supervisor: true },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ ballot })
  } catch (error) {
    console.error('Ballot GET error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category, assetId, action } = ballotSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let ballot = await prisma.ballot.findFirst({
      where: {
        userId: user.id,
        category,
        status: 'DRAFT',
      },
    })

    if (!ballot) {
      ballot = await prisma.ballot.create({
        data: {
          userId: user.id,
          category,
          status: 'DRAFT',
        },
      })
    }

    if (action === 'add') {
      const existingItems = await prisma.ballotItem.count({
        where: { ballotId: ballot.id },
      })

      if (existingItems >= 5) {
        return NextResponse.json({ error: 'Maximum 5 items allowed' }, { status: 400 })
      }

      await prisma.ballotItem.upsert({
        where: {
          ballotId_assetId: {
            ballotId: ballot.id,
            assetId,
          },
        },
        update: {},
        create: {
          ballotId: ballot.id,
          assetId,
        },
      })
    } else {
      await prisma.ballotItem.deleteMany({
        where: {
          ballotId: ballot.id,
          assetId,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ballot PATCH error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
