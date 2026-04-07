/**
 * Google OAuth 2.0 Authentication
 * Substitui o Manus OAuth para deploy externo (Railway, etc.)
 */
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, Request, Response, NextFunction } from "express";
import * as db from "../db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const SESSION_SECRET = process.env.JWT_SECRET ?? "ppc-digital-ifms-secret-change-me";
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""); // remove trailing slash

export function setupGoogleAuth(app: Express) {
  console.log(`[GoogleAuth] Configurando com APP_URL: ${APP_URL}`);
  console.log(`[GoogleAuth] Callback URL: ${APP_URL}/api/auth/google/callback`);

  // Configurar express-session
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      proxy: true, // necessário para Railway (proxy reverso)
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configurar estratégia Google
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("[GoogleAuth] ⚠️  GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurados!");
  } else {
    console.log("[GoogleAuth] ✅ Credenciais Google configuradas.");
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `${APP_URL}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value ?? null;
            const name = profile.displayName ?? null;
            const openId = `google:${profile.id}`;

            console.log(`[GoogleAuth] Login: ${email} (${openId})`);

            await db.upsertUser({
              openId,
              name,
              email,
              loginMethod: "google",
              lastSignedIn: new Date(),
            });

            const user = await db.getUserByOpenId(openId);
            if (!user) {
              console.error("[GoogleAuth] ❌ Usuário não encontrado após upsert");
              return done(new Error("Usuário não encontrado após upsert"), false);
            }

            console.log(`[GoogleAuth] ✅ Login bem-sucedido: ${user.email} (role: ${user.role})`);
            return done(null, user);
          } catch (err) {
            console.error("[GoogleAuth] ❌ Erro no callback:", err);
            return done(err as Error, false);
          }
        }
      )
    );
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.getUserById(id);
      done(null, user ?? false);
    } catch (err) {
      console.error("[GoogleAuth] Erro ao desserializar usuário:", err);
      done(null, false); // não propagar erro, apenas retornar não autenticado
    }
  });

  // Rotas de autenticação
  app.get(
    "/api/auth/google",
    (req: Request, _res: Response, next: NextFunction) => {
      console.log(`[GoogleAuth] Iniciando fluxo OAuth, origin: ${req.headers.origin ?? req.headers.host}`);
      next();
    },
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    })
  );

  app.get(
    "/api/auth/google/callback",
    (req: Request, _res: Response, next: NextFunction) => {
      console.log(`[GoogleAuth] Callback recebido, query: ${JSON.stringify(req.query)}`);
      next();
    },
    passport.authenticate("google", {
      failureRedirect: "/?error=auth_failed",
      failureMessage: true,
    }),
    (_req: Request, res: Response) => {
      console.log("[GoogleAuth] ✅ Autenticação bem-sucedida, redirecionando para /");
      res.redirect("/");
    }
  );

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Não autenticado" });
    }
  });
}
