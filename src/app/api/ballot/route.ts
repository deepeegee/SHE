// src/app/api/ballot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { demoDb } from "@/lib/demoStore";

const Patch = z.object({
  category: z.enum(["IMAGE","VIDEO"]),
  assetId: z.string(),
  action: z.enum(["add","remove"]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const category = (req.nextUrl.searchParams.get("category") || "IMAGE").toUpperCase() as "IMAGE"|"VIDEO";

  if (process.env.DEMO_MODE === "true") {
    const key = `${session.user.email}:${category}`;
    let ballot = demoDb.ballots.get(key);
    if (!ballot) {
      ballot = { id: crypto.randomUUID(), userId: `demo-${session.user.email}`, category, status: "DRAFT", items: [] };
      demoDb.ballots.set(key, ballot);
    }
    return NextResponse.json({ ballot });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("Profile missing", { status: 400 });

  const ballot = await prisma.ballot.findFirst({
    where: { userId: user.id, category, status: "DRAFT" }, include: { items: true }
  });
  return NextResponse.json({ ballot });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const body = Patch.parse(await req.json());

  if (process.env.DEMO_MODE === "true") {
    const key = `${session.user.email}:${body.category}`;
    let ballot = demoDb.ballots.get(key);
    if (!ballot) {
      ballot = { id: crypto.randomUUID(), userId: `demo-${session.user.email}`, category: body.category, status: "DRAFT", items: [] };
      demoDb.ballots.set(key, ballot);
    }
    if (body.action === "add") {
      if (!ballot.items.includes(body.assetId)) {
        if (ballot.items.length >= 5) return new NextResponse("Limit reached (5)", { status: 400 });
        ballot.items.push(body.assetId);
      }
    } else {
      ballot.items = ballot.items.filter(id => id !== body.assetId);
    }
    demoDb.ballots.set(key, ballot);
    return NextResponse.json({ ballot });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("Profile missing", { status: 400 });

  let ballot = await prisma.ballot.findFirst({
    where: { userId: user.id, category: body.category, status: "DRAFT" }, include: { items: true }
  });
  if (!ballot) ballot = await prisma.ballot.create({ data: { userId: user.id, category: body.category } });

  if (body.action === "add") {
    const count = await prisma.ballotItem.count({ where: { ballotId: ballot.id } });
    if (count >= 5) return new NextResponse("Limit reached (5)", { status: 400 });
    await prisma.ballotItem.create({ data: { ballotId: ballot.id, assetId: body.assetId } });
  } else {
    await prisma.ballotItem.deleteMany({ where: { ballotId: ballot.id, assetId: body.assetId } });
  }
  const updated = await prisma.ballot.findUnique({ where: { id: ballot.id }, include: { items: true } });
  return NextResponse.json({ ballot: updated });
}