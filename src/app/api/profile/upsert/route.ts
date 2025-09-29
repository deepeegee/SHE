// src/app/api/profile/upsert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { demoDb } from "@/lib/demoStore";

const Body = z.object({
  name: z.string().min(1),
  // dept/supervisor may be sent by the form but are ignored server-side
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { name } = Body.parse(await req.json());
  const useDemo = process.env.DEMO_MODE === "true";

  if (useDemo) {
    const db = demoDb();
    let user = [...db.users.values()].find(u => u.email === session.user!.email);
    if (!user) {
      user = {
        id: `demo-${session.user!.email}`,
        email: session.user!.email,
        name,
        isAdmin: false,
      };
    } else {
      user = { ...user, name };
    }
    db.users.set(user.id, user);
    return NextResponse.json({ ok: true, user });
  }

  // Real DB path
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    create: { email: session.user.email, name },
    update: { name },
  });

  return NextResponse.json({ ok: true, user });
}