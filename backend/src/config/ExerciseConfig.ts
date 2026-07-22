export class ExerciseConfig {
  static readonly TEMPO_MIN: number = 40;
  static readonly TEMPO_MAX: number = 300;
  static readonly NAME_MAX_LENGTH: number = 100;

  static readonly MSG_SERVER_ERROR: string = 'Erreur serveur';
  static readonly MSG_NOT_FOUND_UPDATE: string = 'Exercice à actualiser inexistant';
  static readonly MSG_NOT_FOUND_DELETE: string = 'Exercice à supprimer inexistant';

  static readonly MSG_MONGOOSE_VALIDATION_ERROR: string = 'Les données fournies ne respectent pas les critères de validation' ;
  static readonly MSG_NAME_DUPLICATE: string = 'Le nom du nouvel exercice est déjà dans la base de données' ;
  static readonly MSG_INVALID_ID: string = "L'identificateur est malformé" ;
}
