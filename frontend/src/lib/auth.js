import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

function getBackendUrl() {
  if (process.env.INTERNAL_BACKEND_URL) {
    return process.env.INTERNAL_BACKEND_URL.replace(/\/+$/, "");
  }
  const publicApi = process.env.NEXT_PUBLIC_API_URL;
  if (publicApi && publicApi.startsWith("http")) {
    return publicApi.replace(/\/+$/, "");
  }
  if (process.env.NEXTAUTH_URL) {
    return `${process.env.NEXTAUTH_URL.replace(/\/+$/, "")}/api/v1`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}/api/v1`;
  }
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000/api/v1";
  }
  return "/api/v1";
}

const providers = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email.trim(),
            password: credentials.password,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Credentials login failed:", res.status, errText);
          return null;
        }

        const data = await res.json();

        // Fetch user info from /auth/me
        const meRes = await fetch(`${backendUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });

        if (!meRes.ok) {
          console.error("Fetch /auth/me failed:", meRes.status);
          return null;
        }
        const user = await meRes.json();

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };
      } catch (err) {
        console.error("Authorize exception:", err);
        return null;
      }
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    })
  );
}

export const authOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const backendUrl = getBackendUrl();
          const res = await fetch(`${backendUrl}/auth/oauth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name || profile?.name || user.email.split("@")[0],
              image: user.image,
              googleId: account.providerAccountId,
            }),
          });

          if (!res.ok) {
            console.error("Failed to sync Google user with backend:", res.status, await res.text());
            return false;
          }

          const dbUser = await res.json();
          // Safe default: Google users receive CITIZEN role unless database already stores a privileged role
          user.id = dbUser.user_id;
          user.role = dbUser.role || "CITIZEN";
          user.accessToken = dbUser.access_token;
          user.refreshToken = dbUser.refresh_token;
          return true;
        } catch (err) {
          console.error("Google signIn callback exception:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "CITIZEN";
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role || "CITIZEN";
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "roadsense-ai-super-secret-key-32chars-min!!",
  useSecureCookies: process.env.NODE_ENV === "production",
};
