const request = require('supertest');
const app = require('../server');

describe('OS Configuration API Tests', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'gunampalli',
        password: 'Raja@1358'
      });
    authToken = response.body.token;
  });

  test('GET /api/os-config/Linux - should get Linux configuration', async () => {
    const response = await request(app)
      .get('/api/os-config/Linux');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('os_platform', 'Linux');
    expect(response.body).toHaveProperty('config_content');
  });

  test('PUT /api/os-config/Linux - should update Linux configuration', async () => {
    const newConfig = 'test_config: value';
    
    const response = await request(app)
      .put('/api/os-config/Linux')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        os_platform: 'Linux',
        config_content: newConfig
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  test('PUT /api/os-config/Linux - should fail without auth token', async () => {
    const response = await request(app)
      .put('/api/os-config/Linux')
      .send({
        os_platform: 'Linux',
        config_content: 'test'
      });

    expect(response.status).toBe(401);
  });
});
