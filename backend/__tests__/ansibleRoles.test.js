const request = require('supertest');
const app = require('../server');

describe('Ansible Roles API Tests', () => {
  let authToken;
  let createdRoleId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'gunampalli',
        password: 'Raja@1358'
      });
    authToken = response.body.token;
  });

  test('GET /api/ansible-roles - should get all roles', async () => {
    const response = await request(app)
      .get('/api/ansible-roles');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/ansible-roles - should create a new role', async () => {
    const response = await request(app)
      .post('/api/ansible-roles')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        role_name: 'test-role',
        os_platform: 'Linux',
        requires_ldap: false
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    createdRoleId = response.body.id;
  });

  test('GET /api/ansible-roles/:id - should get role by ID', async () => {
    const response = await request(app)
      .get(`/api/ansible-roles/${createdRoleId}`);

    expect(response.status).toBe(200);
    expect(response.body.role_name).toBe('test-role');
  });

  test('DELETE /api/ansible-roles/:id - should delete role', async () => {
    const response = await request(app)
      .delete(`/api/ansible-roles/${createdRoleId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });
});
