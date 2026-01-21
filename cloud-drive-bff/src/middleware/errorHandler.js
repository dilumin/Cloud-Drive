const { HttpError } = require('../utils/httpError');

function errorHandler(err, req, res, _next) {
  const status = err instanceof HttpError ? err.status : 500;

  const body = {
    requestId: req.requestId,
    error: status >= 500 ? 'InternalServerError' : 'RequestError',
    message: err.message || 'Unexpected error',
  };

  if (err instanceof HttpError && err.details) body.details = err.details;

  // Axios downstream errors
  if (err.isAxiosError) {
    body.error = 'DownstreamServiceError';
    body.message = err.response?.data?.message || err.message;
    body.downstream = {
      status: err.response?.status,
      data: err.response?.data,
    };
  }

  res.status(status).json(body);
}

module.exports = { errorHandler };
