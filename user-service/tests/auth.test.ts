import request from 'supertest';
import app from '../src/app';
import pool from '../src/db/pool';

describe('Auth flow', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!'
  };

  beforeAll(async () => {
    // assume CI ran migrations; also clean tables if present
    await pool.execute('DELETE FROM refresh_tokens');
    await pool.execute('DELETE FROM user_profiles');
    await pool.execute('DELETE FROM user_streaks');
    await pool.execute('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('register -> login -> refresh -> logout', async () => {
    const agent = request.agent(app);

    const r1 = await agent.post('/api/v1/auth/register').send(testUser).expect(201);
    expect(r1.body.success).toBe(true);

    const r2 = await agent.post('/api/v1/auth/login').send({ emailOrUsername: testUser.email, password: testUser.password }).expect(200);
    expect(r2.body.data.accessToken).toBeTruthy();
    // cookie should be set
    const rawSetCookie = r2.headers['set-cookie'];
    const setCookie = Array.isArray(rawSetCookie) ? rawSetCookie : (rawSetCookie ? [rawSetCookie as string] : []);
    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie.find((c: string) => c.startsWith('refreshToken='))).toBeTruthy();

    const r3 = await agent.post('/api/v1/auth/refresh').send({}).expect(200);
    expect(r3.body.data.accessToken).toBeTruthy();
    const rawSetCookie2 = r3.headers['set-cookie'];
    const setCookie2 = Array.isArray(rawSetCookie2) ? rawSetCookie2 : (rawSetCookie2 ? [rawSetCookie2 as string] : []);
    expect(setCookie2.length).toBeGreaterThan(0);
    expect(setCookie2.find((c: string) => c.startsWith('refreshToken='))).toBeTruthy();

    const r4 = await agent.post('/api/v1/auth/logout').send({}).expect(200);
    expect(r4.body.success).toBe(true);
  }, 20000);
});
