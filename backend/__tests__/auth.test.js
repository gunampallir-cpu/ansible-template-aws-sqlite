const request = require('supertest');
const app = require('../server');

describe('Auth API Tests', () => {
  let authToken;

  test('POST /api/auth/login - should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'gunampalli',
        password: 'Raja@1358'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.username).toBe('gunampalli');
    
    authToken = response.body.token;
  });

  test('POST /api/auth/login - should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'invaliduser',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('GET /api/auth/verify - should verify valid token', async () => {
    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
  });

  test('GET /api/auth/verify - should fail without token', async () => {
    const response = await request(app)
      .get('/api/auth/verify');

    expect(response.status).toBe(401);
  });
});
