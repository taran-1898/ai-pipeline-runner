export const logger = {
  info: (msg: string, meta?: unknown) => {
    // Simple console-based logger for now
    // Replace with pino/winston in production
    if (meta) {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${msg}`, meta);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${msg}`);
    }
  },
  error: (msg: string, meta?: unknown) => {
    if (meta) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${msg}`, meta);
    } else {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${msg}`);
    }
  },
};

