import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {AuthConfig} from '../config/AuthConfig';

// Convention établie avec la route de login (voir authRoutes.ts) : le payload du JWT
// signé au login est de la forme { userId: string }.


export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authorisationRequest = req.header('Authorization') ;

  // Refuser une requête vide
  if (authorisationRequest === undefined) {
    res.status(401).json({message: AuthConfig.MSG_NO_TOKEN}) ;
    return ;
  }

  // Refuser les requêtes n'ayant pas exactement le format 'BEARER mdp'
  if (!authorisationRequest.startsWith('Bearer ') ) {
    res.status(401).json({message: AuthConfig.MSG_NO_TOKEN}) ;
    return ;
  }
  const token = authorisationRequest.substring(AuthConfig.BEARER_PREFIX_LENGTH) ;

  try {
    const payload = jwt.verify(token, AuthConfig.JWT_SECRET)as {userId: string} ;
    req.userId = payload.userId ;
    next() ;
  }
  catch (error) {
    res.status(401).json({message: AuthConfig.MSG_INVALID_TOKEN}) ;
  }
}
