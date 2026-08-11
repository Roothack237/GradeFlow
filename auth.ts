import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        credential: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.credential) {
          return null;
        }

        const email = String(credentials.email);
        const credential = String(credentials.credential);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || user.status === "SUSPENDED") {
          return null;
        }

        let valid = false;

        // Admin → password
        if (user.role === "ADMIN") {
          if (!user.passwordHash) {
            return null;
          }

          valid = await bcrypt.compare(
            credential,
            user.passwordHash
          );
        }

        // Teacher / Parent → login code
        else {
          valid = user.loginCode === credential;
        }

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});