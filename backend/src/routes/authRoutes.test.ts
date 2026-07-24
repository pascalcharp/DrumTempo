import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../app';
import { UserConfig } from '../config/UserConfig';

describe('POST /api/auth/register', () => {
  it('crée un compte avec un email et un mot de passe valides (201)', async () => {

    const response = await request(app)
        .post('/api/auth/register')
        .send({
          "email": "koko@koko.com",
          "password": "1234567890"
        }) ;

    expect(response.status).toBe(201) ;
    expect(response.body).not.toHaveProperty('passwordHash') ;

  });

  it('refuse un email déjà utilisé (409)', async () => {

    const initial = await request(app)
    .post('/api/auth/register')
    .send({
      "email": "koko@koko.com",
      "password": "1234567890"
    })

    expect(initial.status).toBe(201) ;

    const following = await request(app)
    .post('/api/auth/register')
    .send({
      "email": "koko@koko.com",
      "password": "0987654321"
    })

    expect(following.status).toBe(409) ;
  });

  it('refuse un mot de passe trop court (400)', async () => {

    const response = await request(app)
        .post('/api/auth/register')
        .send({
          "email": "koko@koko.com",
          "password": "1234567"
        }) ;

    expect(response.status).toBe(400) ;

  });

  it('refuse un email malformé (400)', async () => {

    const response = await request(app)
        .post('/api/auth/register')
        .send({
          "email": "pas-un-email",
          "password": "0123456789"
        }) ;

    expect(response.status).toBe(400) ;
  }) ;
}) ;

describe('POST /api/auth/login', () => {
  it('retourne un token pour des identifiants valides (200)', async () => {

    const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          "email": "koko@koko.com",
          "password": "1234567890"
        }) ;

    expect(registerResponse.status).toBe(201) ;

    const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      "email": "koko@koko.com",
      "password": "1234567890"
    }) ;

    expect(loginResponse.status).toBe(200) ;
    expect(loginResponse.body.token).toBeDefined() ;

  }) ;

  it('refuse un mauvais mot de passe (401)', async () => {

    const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          "email": "koko@koko.com",
          "password": "1234567890"
        }) ;

    expect(registerResponse.status).toBe(201) ;

    const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      "email": "koko@koko.com",
      "password": "123456789"
    }) ;

    expect(loginResponse.status).toBe(401) ;

  });

  it('refuse un email inconnu (401)', async () => {

    const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      "email": "unknown@user.com",
      "password": "1234567890"
    }) ;

    expect(loginResponse.status).toBe(401) ;
    expect(loginResponse.body).toEqual({"message": expect.any(String)})

  });

  it("refuse une tentative d'injection d'opérateur Mongo sur email (400, pas un contournement)", async () => {

    const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      "email": "good@user.com",
      "password": "1234567890"
    }) ;

    expect(registerResponse.status).toBe(201) ;

    const injectionResponse = await request(app)
    .post('/api/auth/login')
    .send({
      "email": {"$ne": null},
      "password": "1234567890"
    }) ;

    expect(injectionResponse.status).toBe(400) ;
    expect(injectionResponse.body).toEqual({"message": expect.any(String)})
  });
});
