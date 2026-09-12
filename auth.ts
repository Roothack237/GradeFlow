import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {},
        credential: {},
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.credential
        ) {
          return null;
        }

        const email = String(credentials.email)
          .trim()
          .toLowerCase();

        const credential = String(
          credentials.credential
        );

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || user.status === "SUSPENDED") {
          return null;
        }

        let valid = false;

        if (user.role === "ADMIN") {
          if (!user.passwordHash) {
            return null;
          }

          valid = await bcrypt.compare(
            credential,
            user.passwordHash
          );
        } else {
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
          image: user.image ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.picture = user.image ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token?.sub ?? "";
        session.user.role = (token?.role as string) ?? "";
        session.user.image =
          (token?.picture as string | null) ?? null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});