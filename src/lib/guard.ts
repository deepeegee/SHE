// src/lib/guard.ts
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireNameOrRedirect() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");

  if (process.env.DEMO_MODE === "true") {
    const n = session.user?.name?.trim();
    if (!n) redirect("/challenge");
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.name?.trim()) redirect("/challenge");
}