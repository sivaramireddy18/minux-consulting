import app from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  Secure Authentication Platform Bootstrapped`);
  console.log(`⚙️  Active Environment: ${env.NODE_ENV}`);
  console.log(`🚀 API Server Listening on http://localhost:${env.PORT}`);
  console.log(`======================================================\n`);
});

// Centralized Graceful System Shutoff Controls
const handleShutdown = (signal: string) => {
  console.log(`\n⚠️  [${signal}] Received. Beginning safe system socket cleanup...`);
  server.close(() => {
    console.log('🛑 HTTP Gateway closed cleanly. Server shutoff completed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
