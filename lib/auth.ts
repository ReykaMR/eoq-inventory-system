import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import * as bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Login attempt for:", credentials?.username);

        if (!credentials?.username || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const user = await prisma.users.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          console.log("❌ User not found:", credentials.username);
          return null;
        }

        if (!user.is_active) {
          console.log("❌ User is inactive:", credentials.username);
          return null;
        }

        console.log("✅ User found, checking password...");
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash,
        );

        if (!isValid) {
          console.log("❌ Invalid password for:", credentials.username);
          return null;
        }

        console.log("✅ Login successful for:", credentials.username);

        // Update last login
        await prisma.users.update({
          where: { user_id: user.user_id },
          data: { last_login: new Date() },
        });

        return {
          id: user.user_id.toString(),
          name: user.full_name,
          email: user.email,
          image: null,
          role: user.role,
          username: user.username,
          isActive: user.is_active,
          lastLogin: user.last_login?.toISOString() || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.username = user.username;
        token.isActive = user.isActive;
        token.lastLogin = user.lastLogin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.isActive = token.isActive as boolean;
        session.user.lastLogin = token.lastLogin as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
