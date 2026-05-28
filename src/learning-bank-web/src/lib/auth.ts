import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const azureTenant = process.env.AZURE_AD_TENANT_ID ?? "common";
const microsoftConsumerTenantId = "9188040d-6c67-4c5b-b112-36a304b66dad";
const normalizedAzureTenant =
  azureTenant.toLowerCase() === "consumers"
    ? microsoftConsumerTenantId
    : azureTenant;
const azureIssuer = `https://login.microsoftonline.com/${normalizedAzureTenant}/v2.0`;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: azureIssuer,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
        token.accessToken = account.id_token ?? account.access_token ?? token.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      (session as unknown as { provider: string }).provider =
        (token.provider as string) ?? "";
      (session as unknown as { accessToken?: string }).accessToken =
        (token.accessToken as string | undefined) ?? "";
      return session;
    },
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    },
  },
});
