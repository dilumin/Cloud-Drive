require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { loadEnv } = require('./config/env');
const { requestId } = require('./middleware/requestId');
const { errorHandler } = require('./middleware/errorHandler');

const { authRouter } = require('./auth/auth.controller');
const { driveRouter } = require('./drive/drive.controller');

const { metadataClient } = require('./clients/metadataClient');
const { fileClient } = require('./clients/fileClient');

function buildApp() {
  const env = loadEnv();

  const app = express();
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  const corsOrigins = env.corsOrigins;
  app.use(
    cors({
      origin: corsOrigins[0] === '*' ? true : corsOrigins,
      credentials: true,
    }),
  );

  app.use(morgan('combined'));

  // Health
  app.get('/health', (_req, res) => res.json({ ok: true }));

  const clients = {
    metadata: metadataClient(env),
    files: fileClient(env),
  };

  app.use('/auth', authRouter(env));
  app.use('/drive', driveRouter(env, clients));

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'NotFound', message: 'Route not found' }));

  // Error handler (must be last)
  app.use(errorHandler);

  return { app, env };
}

module.exports = { buildApp };
