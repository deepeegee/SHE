// src/app/api/assets/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { demoDb } from "@/lib/demoStore";

const Body = z.object({
  kind: z.enum(["image","video"]),
  title: z.string().optional(),
  description: z.string().optional(),
  blobPathRaw: z.string().min(1), // in DEMO this will be a data URL
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const { kind, title, description, blobPathRaw } = Body.parse(await req.json());

  if (process.env.DEMO_MODE === "true") {
    const id = crypto.randomUUID();
    demoDb.assets.set(id, {
      id,
      type: kind === "image" ? "IMAGE" : "VIDEO",
      title, description,
      blobPathRaw,
      likeCount: 0,
      ownerId: `demo-${session.user.email}`,
      ownerNameAtUpload: session.user.name ?? "",
      ownerDepartmentAtUpload: null,
      ownerSupervisorAtUpload: null,
      createdAt: Date.now(),
    });
    return NextResponse.json({ id });
  }

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me?.name) return new NextResponse("Complete profile first", { status: 400 });

  const asset = await prisma.asset.create({
    data: {
      ownerId: me.id,
      type: kind === "image" ? "IMAGE" : "VIDEO",
      title, description,
      blobPathRaw,
      status: "APPROVED",
      ownerNameAtUpload: me.name,
      ownerDepartmentAtUpload: me.department ?? null,
      ownerSupervisorAtUpload: me.supervisor ?? null,
    },
  });
  return NextResponse.json({ id: asset.id });
}