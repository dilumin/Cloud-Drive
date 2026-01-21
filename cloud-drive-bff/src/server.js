const { buildApp } = require('./app');

const { app, env } = buildApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Cloud Drive BFF listening on port ${env.port}`);
});
