export class SwaggerConfig {
  static readonly TITLE: string = 'DrumTempo API';
  static readonly VERSION: string = '1.0.0';
  static readonly DESCRIPTION: string = 'API REST pour le suivi du tempo des exercices de batterie';
  static readonly DOCS_PATH: string = '/api-docs';
  static readonly API_FILES_GLOB: string[] = ['src/routes/*.ts', 'src/models/*.ts'];
}
