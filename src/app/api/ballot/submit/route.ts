// src/app/api/ballot/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { demoDb } from "@/lib/demoStore";
import { PHOTOS_LIVE, VIDEOS_LIVE } from "@/lib/env";

const Body = z.object({ category: z.enum(["IMAGE","VIDEO"]) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const { category } = Body.parse(await req.json());

  if (category === "IMAGE" && !PHOTOS_LIVE) return new NextResponse("Photos voting closed", { status: 400 });
  if (category === "VIDEO" && !VIDEOS_LIVE) return new NextResponse("Videos voting closed", { status: 400 });

  if (process.env.DEMO_MODE === "true") {
    const key = `${session.user.email}:${category}`;
    const ballot = demoDb.ballots.get(key);
    if (!ballot || ballot.status === "SUBMITTED") return new NextResponse("Already submitted or no draft", { status: 400 });
    if (!ballot.items.length) return new NextResponse("Empty ballot", { status: 400 });
    if (ballot.items.length > 5) return new NextResponse("Over limit", { status: 400 });

    for (const id of ballot.items) {
      const voteKey = `${session.user.email}:${id}`;
      if (!demoDb.votes.has(voteKey)) {
        demoDb.votes.add(voteKey);
        const a = demoDb.assets.get(id);
        if (a) { a.likeCount += 1; demoDb.assets.set(id, a); }
      }
    }
    ballot.status = "SUBMITTED";
    ballot.submittedAt = Date.now();
    demoDb.ballots.set(key, ballot);
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("Profile missing", { status: 400 });

  const draft = await prisma.ballot.findFirst({
    where: { userId: user.id, category, status: "DRAFT" }, include: { items: true }
  });
  if (!draft) return new NextResponse("No draft ballot", { status: 400 });
  if (!draft.items.length) return new NextResponse("Empty ballot", { status: 400 });
  if (draft.items.length > 5) return new NextResponse("Over limit", { status: 400 });

  const submitted = await prisma.ballot.findFirst({ where: { userId: user.id, category, status: "SUBMITTED" } });
  if (submitted) return new NextResponse("Already submitted", { status: 400 });

  await prisma.$transaction(async (tx) => {
    for (const it of draft.items) {
      await tx.vote.create({ data: { userId: user.id, assetId: it.assetId } });
      await tx.asset.update({ where: { id: it.assetId }, data: { likeCount: { increment: 1 } } });
    }
    await tx.ballot.update({ where: { id: draft.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
  });

  return NextResponse.json({ ok: true });
}