const { HttpError } = require('../utils/httpError');
const { verifyAccessToken } = require('../utils/tokens');

function requireAuth(env) {
  return (req, _res, next) => {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return next(new HttpError(401, 'Missing Authorization Bearer token'));
    try {
      const payload = verifyAccessToken(env, m[1]);
      req.user = { id: BigInt(payload.sub) };
      next();
    } catch (e) {
      return next(new HttpError(401, 'Invalid or expired access token'));
    }
  };
}

module.exports = { requireAuth };
