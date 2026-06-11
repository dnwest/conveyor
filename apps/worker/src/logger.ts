import { pino, type Logger } from "pino";

export function createLogger(level: string, pretty: boolean): Logger {
  return pino({
    level,
    transport: pretty ? { target: "pino-pretty" } : undefined,
  });
}
