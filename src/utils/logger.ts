import pc from 'picocolors';

/** Minimal stderr-friendly logger with consistent colored prefixes. */
export const logger = {
  info(message: string): void {
    console.error(`${pc.cyan('•')} ${message}`);
  },
  success(message: string): void {
    console.error(`${pc.green('✓')} ${message}`);
  },
  warn(message: string): void {
    console.error(`${pc.yellow('!')} ${message}`);
  },
  error(message: string): void {
    console.error(`${pc.red('✗')} ${message}`);
  },
  dim(message: string): void {
    console.error(pc.dim(message));
  },
};

export { pc as colors };
