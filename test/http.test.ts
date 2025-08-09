import { getJson, postText, withTimeout } from '../src/utils/http.js';

describe('utils/http', () => {
  it('withTimeout rejects after deadline', async () => {
    await expect(withTimeout(new Promise((r) => setTimeout(() => r('ok'), 50)), 10)).rejects.toBeInstanceOf(Error);
  });

  it('getJson/postText are functions', () => {
    expect(typeof getJson).toBe('function');
    expect(typeof postText).toBe('function');
  });
});


