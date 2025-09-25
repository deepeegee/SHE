import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const upsertSchema = z.object({
  name: z.string().min(1),
  department: z.string().optional(),
  supervisor: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, department, supervisor } = upsertSchema.parse(body)

    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { name, department, supervisor },
      create: {
        email: session.user.email,
        name,
        department,
        supervisor,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile upsert error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
