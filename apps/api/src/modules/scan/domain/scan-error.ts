export class ScanError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
