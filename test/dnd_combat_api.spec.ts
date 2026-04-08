import pactum from 'pactum';
import { eachLike, like } from 'pactum-matchers';
import { StatusCodes } from 'http-status-codes';
import { SimpleReporter } from '../simple-reporter';

describe('D&D Combat API - Full Coverage', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://dnd-combat-api-7f3660dcecb1.herokuapp.com/api';

  const validCharacter = {
    name: 'Kaya',
    strength: 10,
    dexterity: 7,
    hitPoints: 11,
    armorClass: 12
  };

  const invalidCharacter = {
    name: '',
    strength: -1,
    dexterity: 0,
    hitPoints: 0,
    armorClass: 0
  };

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  // ========================
  // CHARACTERS
  // ========================
  describe('CHARACTERS', () => {

    it('GET example character', async () => {
      await p.spec()
        .get(`${baseUrl}/characters/example`)
        .expectStatus(StatusCodes.OK)
        .expectJsonMatch({
          name: like(''),
          strength: like(0),
          dexterity: like(0),
          hitPoints: like(0),
          armorClass: like(0)
        });
    });

    it('POST valid character check', async () => {
      await p.spec()
        .post(`${baseUrl}/characters/check`)
        .withJson(validCharacter)
        .expectStatus(StatusCodes.OK);
    });

    it('POST invalid character check', async () => {
      await p.spec()
        .post(`${baseUrl}/characters/check`)
        .withJson(invalidCharacter)
        .expectStatus(StatusCodes.BAD_REQUEST);
    });

    it('DELETE invalid character', async () => {
      await p.spec()
        .delete(`${baseUrl}/characters/nonexistent-id`)
        .expectStatus(StatusCodes.NOT_FOUND);
    });

  });

  // ========================
  // MONSTERS
  // ========================
  describe('MONSTERS', () => {

    it('GET monster names page 1', async () => {
      await p.spec()
        .get(`${baseUrl}/monsters/names/1`)
        .expectStatus(StatusCodes.OK)
        .expectJsonMatch(eachLike(like('')));
    });

    it('GET monster names invalid page', async () => {
      await p.spec()
        .get(`${baseUrl}/monsters/names/999`)
        .expectStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('GET monster names page zero', async () => {
      await p.spec()
        .get(`${baseUrl}/monsters/names/0`)
        .expectStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('GET monster by name (goblin)', async () => {
      await p.spec()
        .get(`${baseUrl}/monsters/goblin`)
        .expectStatus(StatusCodes.OK)
        .expectJsonMatch({ name: 'Goblin' });
    });

    it('GET invalid monster', async () => {
      await p.spec()
        .get(`${baseUrl}/monsters/invalid-monster`)
        .expectStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    });

  });

  // ========================
  // BATTLE
  // ========================
  describe('BATTLE', () => {

    it('POST battle vs goblin', async () => {
      await p.spec()
        .post(`${baseUrl}/battle/goblin`)
        .withJson(validCharacter)
        .expectStatus(StatusCodes.OK)
        .expectJsonMatch({
          winner: like(''),
          battleLog: eachLike(like(''))
        });
    });

    it('POST battle with invalid character', async () => {
      await p.spec()
        .post(`${baseUrl}/battle/goblin`)
        .withJson({})
        .expectStatus(StatusCodes.BAD_REQUEST);
    });

    it('POST battle with invalid monster', async () => {
      await p.spec()
        .post(`${baseUrl}/battle/unknown-monster`)
        .withJson(validCharacter)
        .expectStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('POST battle with weak character', async () => {
      const weakCharacter = { ...validCharacter, strength: 1, hitPoints: 1 };
      await p.spec()
        .post(`${baseUrl}/battle/goblin`)
        .withJson(weakCharacter)
        .expectStatus(StatusCodes.OK)
        .expectJsonMatch({ winner: 'Goblin' });
    });

    it('POST battle with very strong character', async () => {
      const strongCharacter = { ...validCharacter, strength: 20, hitPoints: 50 };
      await p.spec()
        .post(`${baseUrl}/battle/goblin`)
        .withJson(strongCharacter)
        .expectStatus(StatusCodes.OK)
        .expectJsonMatch({ winner: 'Kaya' });
    });

  });

});