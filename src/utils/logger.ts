const ts = () => new Date().toISOString();

export const logger = {
  info: (msg: string, meta?: unknown) => {
    if (meta !== undefined) {
      console.log(`[${ts()}] [INFO] ${msg}`, meta);
    } else {
      console.log(`[${ts()}] [INFO] ${msg}`);
    }
  },
  warn: (msg: string, meta?: unknown) => {
    if (meta !== undefined) {
      console.warn(`[${ts()}] [WARN] ${msg}`, meta);
    } else {
      console.warn(`[${ts()}] [WARN] ${msg}`);
    }
  },
  error: (msg: string, meta?: unknown) => {
    if (meta !== undefined) {
      console.error(`[${ts()}] [ERROR] ${msg}`, meta);
    } else {
      console.error(`[${ts()}] [ERROR] ${msg}`);
    }
  },
};

