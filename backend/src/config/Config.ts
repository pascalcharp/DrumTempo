export class Config {
  static readonly PORT: number = parseInt(process.env.PORT ?? '3000', 10);
  static readonly MONGO_URI: string = process.env.MONGO_URI ?? 'mongodb://localhost:27017/drumtempo';
  static readonly CORS_ORIGINS: string[] = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());
}
