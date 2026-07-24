import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../app';
import { createAuthenticatedUser } from '../test/authHelper';
import {ExerciseConfig} from "../config/ExerciseConfig";
import {Types} from "mongoose";

describe('Routes /api/exercises — authentification requise', () => {
  it('refuse une requête sans token (401)', async () => {

    const testResponse = await request(app)
    .get('/api/exercises')
    .send() ;

    expect(testResponse.status).toBe(401) ;
  });

  it('refuse un token invalide (401)', async () => {

    const testResponse = await request(app)
        .get('/api/exercises')
        .send()
        .set('Authorization', `Bearer TOKENINVALIDE`);

    expect(testResponse.status).toBe(401) ;
  });
});

describe('CRUD /api/exercises', () => {
  it('POST crée un exercice puis GET le retourne dans la liste (201, 200)', async () => {

    const { token } = await createAuthenticatedUser("good@user.a") ;

    const postResponse = await request(app)
      .post('/api/exercises')
      .send({
      "name": "Paradiddle"
      })
      .set('Authorization', `Bearer ${token}`) ;

    expect(postResponse.status).toBe(201) ;

    const getResponse = await request(app)
      .get('/api/exercises')
      .send({})
      .set('Authorization', `Bearer ${token}`) ;

    expect(getResponse.body).toHaveLength(1);

    expect(getResponse.body[0]).toEqual(
        expect.objectContaining({
          name: "Paradiddle",
          current_tempo: null
        })
    );

    expect(getResponse.body[0]).not.toHaveProperty('__v') ;
    expect(getResponse.body[0]).not.toHaveProperty('owner') ;

  });

  it('POST refuse un tempo hors plage (400)', async () => {

    const { token } = await createAuthenticatedUser("good@user.a") ;

    const postResponse = await request(app)
        .post('/api/exercises')
        .send({
          "name": "Paradiddle",
          "current_tempo": ExerciseConfig.TEMPO_MAX + 1
        })
        .set('Authorization', `Bearer ${token}`) ;

    expect(postResponse.status).toBe(400) ;
    expect(postResponse.body).toEqual({message: ExerciseConfig.MSG_TEMPO_OUT_OF_RANGE}) ;

  });

  it('POST refuse un nom déjà utilisé par le même utilisateur (409)', async () => {

    const { token } = await createAuthenticatedUser("good@user.a") ;

    const postResponse = await request(app)
        .post('/api/exercises')
        .send({
          "name": "Paradiddle",
          "current_tempo": null
        })
        .set('Authorization', `Bearer ${token}`) ;

    expect(postResponse.status).toBe(201) ;

    const duplicateResponse = await request(app)
        .post('/api/exercises')
        .send({
          "name": "Paradiddle",
          "current_tempo": null
        })
        .set('Authorization', `Bearer ${token}`) ;

    expect(duplicateResponse.status).toBe(409) ;
    expect(duplicateResponse.body).toEqual({"message": ExerciseConfig.MSG_NAME_DUPLICATE}) ;

  });

  it('PATCH met à jour le tempo (200)', async () => {

    const { token } = await createAuthenticatedUser("good@user.a") ;

    const postResponse = await request(app)
        .post('/api/exercises')
        .send({
          "name": "Paradiddle",
          "current_tempo": null
        })
        .set('Authorization', `Bearer ${token}`) ;

    expect(postResponse.status).toBe(201) ;

    const getResponse = await request(app)
    .get('/api/exercises')
    .send()
        .set('Authorization', `Bearer ${token}`) ;

    expect(getResponse.status).toBe(200) ;
    const paradiddleId = getResponse.body[0]._id ;

    const patchResponse = await request(app)
        .patch(`/api/exercises/${paradiddleId}`)
        .send({
          "current_tempo": ExerciseConfig.TEMPO_MAX - 1
        })
        .set('Authorization', `Bearer ${token}`) ;

    expect(patchResponse.status).toBe(200) ;
    expect(patchResponse.body).toEqual(
        expect.objectContaining({
          name: "Paradiddle",
          current_tempo: ExerciseConfig.TEMPO_MAX - 1
        }))
  });

  it('PATCH sur un id inexistant retourne 404', async () => {

    const { token } = await createAuthenticatedUser("good@user.a") ;

    const patchResponse = await request(app)
        .patch(`/api/exercises/000000000000000000000000`)
        .send({
          "current_tempo": ExerciseConfig.TEMPO_MAX - 1
        })
        .set('Authorization', `Bearer ${token}`) ;

    expect(patchResponse.status).toBe(404) ;
  });

  it('PATCH sur un id malformé retourne 400', async () => {

    const { token } = await createAuthenticatedUser("good@user.a") ;

    const patchResponse = await request(app)
        .patch(`/api/exercises/idmalforme`)
        .send({
          "current_tempo": ExerciseConfig.TEMPO_MAX - 1
        })
        .set('Authorization', `Bearer ${token}`) ;

    expect(patchResponse.status).toBe(400) ;
  });

  it('DELETE supprime un exercice (204) puis il n\'apparaît plus dans la liste', async () => {

    const { token } = await createAuthenticatedUser("good@user.a") ;
    const postResponse = await request(app)
        .post('/api/exercises')
        .send({
          "name": "Paradiddle",
          "current_tempo": null
        })
        .set('Authorization', `Bearer ${token}`) ;

    expect(postResponse.status).toBe(201) ;

    const getResponse = await request(app)
        .get('/api/exercises')
        .send()
        .set('Authorization', `Bearer ${token}`) ;

    expect(getResponse.status).toBe(200) ;
    const paradiddleId = getResponse.body[0]._id ;

    const deleteResponse = await request(app)
        .delete(`/api/exercises/${paradiddleId}`)
        .send()
        .set('Authorization', `Bearer ${token}`) ;

    expect(deleteResponse.status).toBe(204) ;

    const getAfterResponse = await request(app)
        .get('/api/exercises')
        .send()
        .set('Authorization', `Bearer ${token}`) ;

    expect(getAfterResponse.status).toBe(200) ;
    expect(getAfterResponse.body).toHaveLength(0) ;

  });

  it('DELETE sur un id inexistant retourne 404', async () => {

    const { token } = await createAuthenticatedUser("good@user.a") ;
    const deleteResponse = await request(app)
        .delete(`/api/exercises/000000000000000000000000`)
        .send()
        .set('Authorization', `Bearer ${token}`) ;

    expect(deleteResponse.status).toBe(404) ;
  });
});

describe('Isolation entre utilisateurs', () => {
  it("un utilisateur ne voit pas les exercices d'un autre dans GET /api/exercises", async () => {

    const authUserA = await createAuthenticatedUser("good@user.a") ;
    const authUserB = await createAuthenticatedUser("good@user.b") ;
    const tokenA = authUserA.token ;
    const tokenB = authUserB.token ;

    const postResponse = await request(app)
        .post('/api/exercises')
        .send({
          "name": "Paradiddle",
          "current_tempo": null
        })
        .set('Authorization', `Bearer ${tokenA}`) ;

    expect(postResponse.status).toBe(201) ;

    const getResponse = await request(app)
    .get('/api/exercises')
    .send()
    .set('Authorization', `Bearer ${tokenB}`) ;

    expect(getResponse.status).toBe(200) ;
    expect(getResponse.body).toHaveLength(0) ;


  });

  it("PATCH sur l'exercice d'un autre utilisateur retourne 404 (pas de fuite d'existence)", async () => {

    const authUserA = await createAuthenticatedUser("good@user.a") ;
    const authUserB = await createAuthenticatedUser("good@user.b") ;
    const tokenA = authUserA.token ;
    const tokenB = authUserB.token ;

    const postResponse = await request(app)
        .post('/api/exercises')
        .send({
          "name": "Paradiddle",
          "current_tempo": null
        })
        .set('Authorization', `Bearer ${tokenA}`) ;

    expect(postResponse.status).toBe(201) ;

    const getResponse = await request(app)
        .get('/api/exercises')
        .send()
        .set('Authorization', `Bearer ${tokenA}`) ;

    expect(getResponse.status).toBe(200) ;
    const exerciseIdForA = getResponse.body[0]._id ;

    const patchResponse = await request(app)
        .patch(`/api/exercises/${exerciseIdForA}`)
        .send({
          "current_tempo": ExerciseConfig.TEMPO_MAX - 1
        })
        .set('Authorization', `Bearer ${tokenB}`) ;

    expect(patchResponse.status).toBe(404) ;

  });

  it("DELETE sur l'exercice d'un autre utilisateur retourne 404", async () => {

    const authUserA = await createAuthenticatedUser("good@user.a") ;
    const authUserB = await createAuthenticatedUser("good@user.b") ;
    const tokenA = authUserA.token ;
    const tokenB = authUserB.token ;

    const postResponse = await request(app)
        .post('/api/exercises')
        .send({
          "name": "Paradiddle",
          "current_tempo": null
        })
        .set('Authorization', `Bearer ${tokenA}`) ;

    expect(postResponse.status).toBe(201) ;

    const getResponse = await request(app)
        .get('/api/exercises')
        .send()
        .set('Authorization', `Bearer ${tokenA}`) ;

    expect(getResponse.status).toBe(200) ;
    const exerciseIdForA = getResponse.body[0]._id ;

    const deleteResponse = await request(app)
        .delete(`/api/exercises/${exerciseIdForA}`)
        .send()
        .set('Authorization', `Bearer ${tokenB}`) ;

    expect(deleteResponse.status).toBe(404) ;
  });
});
