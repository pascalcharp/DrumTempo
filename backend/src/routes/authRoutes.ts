import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthConfig } from '../config/AuthConfig';
import { UserConfig } from '../config/UserConfig';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Créer un compte utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "batteur@example.com"
 *               password:
 *                 type: string
 *                 example: "motDePasseSecurise123"
 *     responses:
 *       201:
 *         description: Compte créé
 *       400:
 *         description: Donnée invalide (email mal formé, mot de passe trop court)
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {

  if (req.body.password.length < UserConfig.PASSWORD_MIN_LENGTH) {
    res.status(400).json({message: UserConfig.MSG_PASSWORD_TOO_SHORT}) ;
    return ;
  }

  //    On passe le mot de passe EN CLAIR dans passwordHash, le hook pre('save') du modèle
  //    (voir User.ts) se charge de le hacher avant l'écriture en base.
  try {
    const nouvelUtilisateur = new User({ email: req.body.email, passwordHash: req.body.password }) ;
    const utilisateurSauvegarde = await nouvelUtilisateur.save() ;
    const utilisateurEnregistre = utilisateurSauvegarde.toObject() ;
    const {passwordHash, ...utilisateurNettoye} = utilisateurEnregistre ;
    res.status(201).json(utilisateurNettoye) ;
  }
  catch (err: any) {
    console.error(err);
    switch (true) {
      case err.name === 'ValidationError':
            res.status(400).json({ message: UserConfig.MSG_VALIDATION_ERROR }) ;
            break;

      case err.code === 11000:
        res.status(409).json({ message: UserConfig.MSG_EMAIL_DUPLICATE }) ;
        break ;

        default:
          res.status(500).json({ message: UserConfig.MSG_SERVER_ERROR }) ;
          break ;
    }
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Se connecter et obtenir un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "batteur@example.com"
 *               password:
 *                 type: string
 *                 example: "motDePasseSecurise123"
 *     responses:
 *       200:
 *         description: Connexion réussie, token JWT retourné
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Email ou mot de passe invalide
 *       500:
 *         description: Erreur serveur
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {

  try {
    const user = await User.findOne({ email: req.body.email }).select('+passwordHash') ;
    if (user === null) {
      res.status(401).json({ message: UserConfig.MSG_INVALID_CREDENTIALS }) ;
      return ;
    }
    const passwordIsValid = await user.comparePassword(req.body.password) ;
    if (!passwordIsValid) {
      res.status(401).json({ message: UserConfig.MSG_INVALID_CREDENTIALS }) ;
      return ;
    }
    const tokenPayload = { userId: user._id.toString() } ;
    const token = jwt.sign(tokenPayload, AuthConfig.JWT_SECRET, { expiresIn: AuthConfig.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']}) ;
    res.status(200).json({ token }) ;
  }
  catch (err: any) {
    console.error(err) ;
    switch (true) {
      case err.name === 'CastError':
        res.status(400).json({ message: UserConfig.MSG_VALIDATION_ERROR }) ;
        break;
      default:
        res.status(500).json({ message: UserConfig.MSG_SERVER_ERROR }) ;
        break ;
    }
  }
});

export default router;
