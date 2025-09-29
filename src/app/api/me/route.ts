// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ user: null }, { status: 401 });

  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json({
      user: {
        id: `demo-${session.user.email}`,
        email: session.user.email!,
        name: session.user.name ?? "",
        department: null,
        supervisor: null,
      },
      votes: { imagesSubmitted: 0, videosSubmitted: 0 },
    });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ user: null }, { status: 404 });

  const imagesSubmitted = await prisma.vote.count({ where: { userId: user.id, asset: { type: "IMAGE" } } });
  const videosSubmitted = await prisma.vote.count({ where: { userId: user.id, asset: { type: "VIDEO" } } });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, department: user.department, supervisor: user.supervisor },
    votes: { imagesSubmitted, videosSubmitted },
  });
}