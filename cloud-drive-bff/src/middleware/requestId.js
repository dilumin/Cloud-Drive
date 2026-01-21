const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = String(id);
  res.setHeader('x-request-id', req.requestId);
  next();
}

module.exports = { requestId };
