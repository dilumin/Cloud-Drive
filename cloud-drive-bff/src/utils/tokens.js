const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

function signAccessToken(env, userId) {
  return jwt.sign(
    { sub: userId.toString(), typ: 'access' },
    env.jwtAccessSecret,
    { expiresIn: env.accessTtlSec },
  );
}

function signRefreshToken(env, userId, jti) {
  return jwt.sign(
    { sub: userId.toString(), jti, typ: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTtlSec },
  );
}

function newJti() {
  return uuidv4();
}

function verifyAccessToken(env, token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(env, token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  newJti,
  verifyAccessToken,
  verifyRefreshToken,
};
