import dns from 'node:dns';
import app from './app.js';
import config from './config/env.js';
import connectDB, { disconnectDB } from './config/db.js';

// Some networks fail to resolve MongoDB Atlas SRV records with the default
// resolver; public resolvers make `mongodb+srv://` URIs reliable.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const startServer = async () => {
  // Connect to the database BEFORE accepting HTTP traffic
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(
      `Server running in ${config.nodeEnv} mode on http://localhost:${config.port}`
    );
  });

  // Graceful shutdown: stop accepting connections, let in-flight requests
  // finish, close the DB connection, then exit.
  let shuttingDown = false;
  const shutdown = (signal, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} received. Shutting down...`);

    server.close(async () => {
      await disconnectDB();
      console.log('Shutdown complete');
      process.exit(exitCode);
    });

    // Force exit if connections do not close in time (e.g. keep-alive sockets)
    setTimeout(() => process.exit(exitCode), 10000).unref();
  };

  // Render / Railway / Docker send SIGTERM on deploys and restarts
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  // Ctrl+C in a local terminal
  process.on('SIGINT', () => shutdown('SIGINT'));

  // A promise rejected somewhere without a .catch(): log it and shut down
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    shutdown('unhandledRejection', 1);
  });
};

startServer();
