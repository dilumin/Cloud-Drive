const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const schemas = require('./auth.schemas');
const svc = require('./auth.service');

function setRefreshCookie(env, res, token) {
  res.cookie(env.refreshCookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite.toLowerCase(),
    domain: env.cookieDomain,
    path: '/auth/refresh',
    maxAge: env.refreshTtlSec * 1000,
  });
}

function clearRefreshCookie(env, res) {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite.toLowerCase(),
    domain: env.cookieDomain,
    path: '/auth/refresh',
  });
}

function authRouter(env) {
  const r = express.Router();

  r.post(
    '/register',
    validateBody(schemas.registerSchema),
    asyncHandler(async (req, res) => {
      const out = await svc.register(env, req.body);
      res.status(201).json(out);
    }),
  );

  r.post(
    '/login',
    validateBody(schemas.loginSchema),
    asyncHandler(async (req, res) => {
      const out = await svc.login(env, req.body);
      setRefreshCookie(env, res, out.refreshToken);
      res.json({ accessToken: out.accessToken, userId: out.userId });
    }),
  );

  r.post(
    '/refresh',
    validateBody(schemas.refreshSchema),
    asyncHandler(async (req, res) => {
      const cookieToken = req.cookies?.[env.refreshCookieName];
      const token = cookieToken || req.body.refreshToken;
      const out = await svc.refresh(env, token);
      setRefreshCookie(env, res, out.refreshToken);
      res.json({ accessToken: out.accessToken, userId: out.userId });
    }),
  );

  r.post(
    '/logout',
    validateBody(schemas.logoutSchema),
    asyncHandler(async (req, res) => {
      const cookieToken = req.cookies?.[env.refreshCookieName];
      const token = cookieToken || req.body.refreshToken;
      await svc.logout(env, token);
      clearRefreshCookie(env, res);
      res.json({ ok: true });
    }),
  );

  r.get(
    '/me',
    requireAuth(env),
    asyncHandler(async (req, res) => {
      const out = await svc.me(env, req.user.id);
      res.json(out);
    }),
  );

  return r;
}

module.exports = { authRouter };
