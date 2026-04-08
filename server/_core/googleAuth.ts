/**
 * Google OAuth 2.0 Authentication
 * Substitui o Manus OAuth para deploy externo (Railway, etc.)
 */
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient, type RedisClientType } from "redis";
import type { Express, Request, Response, NextFunction } from "express";
import * as db from "../db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const SESSION_SECRET = process.env.JWT_SECRET ?? "ppc-digital-ifms-secret-change-me";
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""); // remove trailing slash
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SESSION_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 ano
const SESSION_COOKIE_CONFIG = {
  secure: IS_PRODUCTION,
  httpOnly: true,
  maxAge: SESSION_MAX_AGE_MS,
  sameSite: IS_PRODUCTION ? "none" : "lax",
} as const;
const SESSION_TTL_SECONDS = Math.floor(SESSION_COOKIE_CONFIG.maxAge / 1000);
const REDIS_URL = process.env.REDIS_URL ?? "";
const REDIS_USERNAME = process.env.REDIS_USERNAME ?? "";
const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? "";

let redisClient: RedisClientType | null = null;

function validateSessionStoreEnv() {
  if (IS_PRODUCTION && !REDIS_URL) {
    throw new Error(
      "[GoogleAuth] Configuração inválida: REDIS_URL é obrigatório em produção para persistência de sessão OAuth. Sem Redis, o express-session usa MemoryStore (não recomendado e sem persistência)."
    );
  }

  if (REDIS_URL && !REDIS_URL.startsWith("redis://") && !REDIS_URL.startsWith("rediss://")) {
    throw new Error(
      "[GoogleAuth] REDIS_URL inválido. Use um endpoint começando com redis:// ou rediss://."
    );
  }

  if ((REDIS_USERNAME && !REDIS_PASSWORD) || (!REDIS_USERNAME && REDIS_PASSWORD)) {
    console.warn(
      "[GoogleAuth] REDIS_USERNAME/REDIS_PASSWORD configurados parcialmente. Prefira informar ambos ou apenas REDIS_URL completo."
    );
  }
}

function createSessionStore() {
  if (!REDIS_URL) {
    console.info("[GoogleAuth] Sessão em MemoryStore (apenas desenvolvimento local).");
    return undefined;
  }

  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL,
      username: REDIS_USERNAME || undefined,
      password: REDIS_PASSWORD || undefined,
    });
    redisClient.on("error", (err) => {
      console.error("[GoogleAuth] ❌ Erro no cliente Redis:", err);
    });
    redisClient
      .connect()
      .then(() => {
        console.log(
          `[GoogleAuth] ✅ Conectado ao Redis para sessão (ttl=${SESSION_TTL_SECONDS}s).`
        );
      })
      .catch((err) => {
        console.error("[GoogleAuth] ❌ Falha ao conectar no Redis:", err);
      });
  }

  return new RedisStore({
    client: redisClient,
    ttl: SESSION_TTL_SECONDS,
    prefix: "sess:",
  });
}

export function setupGoogleAuth(app: Express) {
  validateSessionStoreEnv();

  console.log(`[GoogleAuth] Configurando com APP_URL: ${APP_URL}`);
  console.log(`[GoogleAuth] Callback URL: ${APP_URL}/api/auth/google/callback`);

  // Configurar express-session
  app.use(
    session({
      secret: SESSION_SECRET,
      store: createSessionStore(),
      resave: false,
      saveUninitialized: false,
      proxy: true, // necessário para Railway (proxy reverso)
      cookie: SESSION_COOKIE_CONFIG,
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
