const axios = require('axios');

function makeClient({ baseURL, timeoutMs }) {
  return axios.create({
    baseURL,
    timeout: timeoutMs,
    validateStatus: () => true, // we handle statuses manually for consistent errors
  });
}

module.exports = { makeClient };
