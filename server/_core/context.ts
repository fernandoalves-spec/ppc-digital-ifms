import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Modo Google OAuth (Railway): usuário autenticado via passport session
    if (process.env.GOOGLE_CLIENT_ID) {
      const req = opts.req as any;
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        user = req.user as User;
      }
    } else {
      // Modo Manus OAuth (plataforma Manus)
      const { getSdk } = await import("./sdk");
      const sdk = getSdk();
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
