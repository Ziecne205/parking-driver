import { test } from 'node:test'
import * as assert from 'node:assert'

// Mock localStorage for Zustand persist middleware in Node.js environment
const mockStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};
Object.defineProperty(global, 'localStorage', { value: mockStorage });
Object.defineProperty(global, 'window', { value: { localStorage: mockStorage } });


import { useAuthStore } from './auth'
import { api } from '../lib/api'

// Simple mock for api.post
const originalPost = api.post;

test('register payload omits roleName', async (t) => {
  let capturedPayload: any = null;
  
  // Mock the api.post call to capture the payload
  api.post = async (path: string, body?: any) => {
    capturedPayload = body;
    return { token: 'mock-token', username: 'mock-username' } as any;
  };

  try {
    const store = useAuthStore.getState();
    await store.register({
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '0123456789',
      password: 'password123',
    });

    assert.ok(capturedPayload, 'API post should have been called');
    assert.strictEqual(capturedPayload.email, 'test@example.com');
    assert.strictEqual(capturedPayload.roleName, undefined, 'roleName must be omitted from payload');
    
  } finally {
    // Restore original
    api.post = originalPost;
  }
});
