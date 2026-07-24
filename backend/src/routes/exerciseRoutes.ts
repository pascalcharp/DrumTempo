import { Router, Request, Response } from 'express';
import { Exercise } from '../models/Exercise';
import { ExerciseConfig } from '../config/ExerciseConfig';

const router = Router();

// Les bornes de validation (tempo, longueur du nom) sont déjà publiques dans la doc Swagger — renvoyer
// le message précis de Mongoose plutôt qu'un message générique aide l'utilisateur à corriger son erreur
// sans exposer d'information qui ne l'était pas déjà.
function extractValidationMessage(err: any): string {
  return Object.values(err.errors)
    .map((validatorError: any) => validatorError.message)
    .join(', ');
}

/**
 * @openapi
 * /api/exercises:
 *   get:
 *     summary: Lister tous les exercices
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des exercices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exercise'
 *       401:
 *         description: Authentification requise ou token invalide
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const liste = await Exercise.find({owner: req.userId}).lean()
    res.json(liste) ;
  } catch (err) {
    console.error(err) ;
    res.status(500).json({ message: ExerciseConfig.MSG_SERVER_ERROR }) ;
  }
});

/**
 * @openapi
 * /api/exercises:
 *   post:
 *     summary: Ajouter un exercice
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Paradiddle"
 *               current_tempo:
 *                 type: integer
 *                 nullable: true
 *                 example: 100
 *     responses:
 *       201:
 *         description: Exercice créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       400:
 *         description: Donnée invalide (ex. tempo hors plage 40-300)
 *       409:
 *         description: Nom déjà utilisé
 *       401:
 *         description: Authentification requise ou token invalide
 *       500:
 *         description: Erreur serveur
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {

    const nouvelExercice = new Exercise({...req.body, owner: req.userId}) ;
    const exerciceSauvegarde = await nouvelExercice.save() ;
    // select: false sur `owner` ne s'applique qu'aux requêtes (find/findOneAndUpdate) : un document
    // fraîchement sauvegardé en mémoire l'inclut toujours, il faut donc le retirer explicitement ici
    // (même raison que le retrait manuel de passwordHash dans authRoutes.ts après le register).
    const { owner, ...exerciceNettoye } = exerciceSauvegarde.toObject() ;
    res.status(201).json(exerciceNettoye) ;

  } catch (err: any) {
    console.error(err);
    switch (true) {
      case err.name === 'ValidationError':
        res.status(400).json({message: extractValidationMessage(err)});
        break;

      case err.code === 11000:
        res.status(409).json({message: ExerciseConfig.MSG_NAME_DUPLICATE})
        break;

      default:
        res.status(500).json({message: ExerciseConfig.MSG_SERVER_ERROR});
    }
  }
});

/**
 * @openapi
 * /api/exercises/{id}:
 *   patch:
 *     summary: Mettre à jour un exercice (ex. le tempo)
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB de l'exercice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               current_tempo:
 *                 type: integer
 *                 nullable: true
 *                 example: 140
 *     responses:
 *       200:
 *         description: Exercice mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       400:
 *         description: Donnée invalide ou id malformé
 *       404:
 *         description: Exercice introuvable
 *       409:
 *         description: Nom déjà utilisé
 *       401:
 *         description: Authentification requise ou token invalide
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {

    const {owner, ...updates} = req.body ;
    const exerciceActualise = await Exercise.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, updates,  { runValidators: true, new: true }) ;
    if (exerciceActualise == null) res.status(404).json({ message: ExerciseConfig.MSG_NOT_FOUND_UPDATE }) ;
    else res.json(exerciceActualise) ;

  } catch (err: any) {
    console.error(err);
    switch (true) {
      case err.name === 'ValidationError':
        res.status(400).json({ message: extractValidationMessage(err) });
        break;

      case err.name === 'CastError':
        res.status(400).json({ message: ExerciseConfig.MSG_INVALID_ID });
        break;

      case err.code === 11000:
        res.status(409).json({ message: ExerciseConfig.MSG_NAME_DUPLICATE });
        break;

      default:
        res.status(500).json({ message: ExerciseConfig.MSG_SERVER_ERROR });
        break;
    }
  }
});

/**
 * @openapi
 * /api/exercises/{id}:
 *   delete:
 *     summary: Supprimer un exercice
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant MongoDB de l'exercice
 *     responses:
 *       204:
 *         description: Exercice supprimé
 *       400:
 *         description: Id malformé
 *       404:
 *         description: Exercice introuvable
 *       401:
 *         description: Authentification requise ou token invalide
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {

    const exerciceSupprime = await Exercise.findOneAndDelete({ _id: req.params.id, owner: req.userId }) ;
    if (exerciceSupprime == null) res.status(404).json({ message: ExerciseConfig.MSG_NOT_FOUND_DELETE }) ;
    else res.status(204).send() ;

  } catch (err: any) {
    console.error(err);
    if (err.name === 'CastError') res.status(400).json({ message: ExerciseConfig.MSG_INVALID_ID });
    else res.status(500).json({ message: ExerciseConfig.MSG_SERVER_ERROR });
  }
});

export default router;
