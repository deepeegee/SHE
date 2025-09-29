// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

const useDemo = process.env.DEMO_MODE === "true";

export const authOptions: NextAuthOptions = {
  adapter: useDemo ? undefined : (PrismaAdapter(prisma) as any),
  session: { strategy: "jwt" },
  providers: useDemo
    ? [
        CredentialsProvider({
          id: "credentials",
          name: "Demo",
          credentials: {
            name: { label: "Name", type: "text" },
            email: { label: "Email", type: "text" },
          },
          async authorize(creds) {
            if (!creds?.email || !creds?.name) return null;
            return {
              id: `demo-${String(creds.email)}`,
              email: String(creds.email),
              name: String(creds.name),
            };
          },
        }),
      ]
    : [
        AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID!,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
          tenantId: process.env.AZURE_AD_TENANT_ID || "common",
        }),
        EmailProvider({
          server: process.env.EMAIL_SERVER!,
          from: process.env.EMAIL_FROM!,
          maxAge: 60 * 60 * 24,
        }),
      ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.name = (user as any).name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) (session as any).userId = token.uid;
      if (token?.name) session.user!.name = token.name as string;
      return session;
    },
  },
};

// server helper: use in route handlers/pages
export function auth() {
  return getServerSession(authOptions);
}