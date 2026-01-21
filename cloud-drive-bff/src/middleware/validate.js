const { HttpError } = require('../utils/httpError');

function validateBody(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(new HttpError(400, 'Validation error', parsed.error.flatten()));
    }
    req.body = parsed.data;
    next();
  };
}

module.exports = { validateBody };
