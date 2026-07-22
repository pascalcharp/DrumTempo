export class ApiConfig {
  static BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  static EXERCISES_ENDPOINT = `${ApiConfig.BASE_URL}/api/exercises`;
}
