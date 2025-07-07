const request = require('supertest');
const express = require('express');

// Create a mini-app for testing the health endpoint
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

describe('Health Check Endpoint', () => {
  it('should return status code 200', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
  });

  it('should return status "ok"', async () => {
    const response = await request(app).get('/health');
    expect(response.body.status).toBe('ok');
  });

  it('should include uptime', async () => {
    const response = await request(app).get('/health');
    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');
  });

  it('should include timestamp', async () => {
    const response = await request(app).get('/health');
    expect(response.body).toHaveProperty('timestamp');
    expect(typeof response.body.timestamp).toBe('number');
  });
}); 