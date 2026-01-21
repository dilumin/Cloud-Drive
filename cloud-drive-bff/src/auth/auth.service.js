const bcrypt = require('bcryptjs');
const { prisma } = require('../db/prisma');
const { HttpError } = require('../utils/httpError');
const { signAccessToken, signRefreshToken, newJti, verifyRefreshToken } = require('../utils/tokens');

async function register(env, { email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  return { id: user.id.toString(), email: user.email };
}

async function login(env, { email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  return issueTokens(env, user.id);
}

async function issueTokens(env, userId) {
  const accessToken = signAccessToken(env, userId);

  const jti = newJti();
  const refreshToken = signRefreshToken(env, userId, jti);
  const expiresAt = new Date(Date.now() + env.refreshTtlSec * 1000);

  await prisma.refreshToken.create({
    data: { userId, jti, expiresAt },
  });

  return { accessToken, refreshToken, userId: userId.toString() };
}

async function refresh(env, refreshTokenStr) {
  if (!refreshTokenStr) throw new HttpError(401, 'Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(env, refreshTokenStr);
  } catch (_e) {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  if (payload.typ !== 'refresh' || !payload.jti) throw new HttpError(401, 'Invalid refresh token');

  const userId = BigInt(payload.sub);
  const existing = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });

  if (!existing || existing.userId !== userId) throw new HttpError(401, 'Refresh token revoked');
  if (existing.revokedAt) throw new HttpError(401, 'Refresh token revoked');
  if (new Date() > existing.expiresAt) throw new HttpError(401, 'Refresh token expired');

  // rotate: revoke old, create new
  const newTokenJti = newJti();
  const newRefreshToken = signRefreshToken(env, userId, newTokenJti);
  const newExpiresAt = new Date(Date.now() + env.refreshTtlSec * 1000);

  const accessToken = signAccessToken(env, userId);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { jti: existing.jti },
      data: { revokedAt: new Date(), replacedBy: newTokenJti },
    }),
    prisma.refreshToken.create({
      data: { userId, jti: newTokenJti, expiresAt: newExpiresAt },
    }),
  ]);

  return { accessToken, refreshToken: newRefreshToken, userId: userId.toString() };
}

async function logout(env, refreshTokenStr) {
  if (!refreshTokenStr) return { ok: true };

  try {
    const payload = verifyRefreshToken(env, refreshTokenStr);
    const jti = payload?.jti;
    if (!jti) return { ok: true };

    const rt = await prisma.refreshToken.findUnique({ where: { jti } });
    if (!rt) return { ok: true };

    await prisma.refreshToken.update({
      where: { jti },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  } catch (_e) {
    // token invalid -> treat as logged out
    return { ok: true };
  }
}

async function me(env, userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'User not found');
  return { id: user.id.toString(), email: user.email, createdAt: user.createdAt.toISOString() };
}

module.exports = { register, login, refresh, logout, me };
