// src/app/api/feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { demoDb } from "@/lib/demoStore";

export async function GET(req: NextRequest) {
  const typeParam = (req.nextUrl.searchParams.get("type") || "image").toUpperCase();
  const take = Number(req.nextUrl.searchParams.get("take") || 24);
  const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

  if (process.env.DEMO_MODE === "true") {
    const items = [...demoDb.assets.values()]
      .filter(a => a.type === (typeParam === "IMAGE" ? "IMAGE" : "VIDEO"))
      .sort((a,b) => a.createdAt - b.createdAt)
      .slice(0, take);
    return NextResponse.json({ items, nextCursor: null });
  }

  const where = { status: "APPROVED", type: typeParam as "IMAGE"|"VIDEO" };
  const items = await prisma.asset.findMany({
    where, take, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), orderBy: { id: "asc" },
    select: {
      id: true, type: true, title: true, description: true,
      blobPathRaw: true, blobPathMain: true, blobPathThumb: true,
      likeCount: true, createdAt: true,
      ownerNameAtUpload: true, ownerDepartmentAtUpload: true, ownerSupervisorAtUpload: true,
    }
  });
  const nextCursor = items.length === take ? items[items.length - 1].id : null;
  return NextResponse.json({ items, nextCursor });
}