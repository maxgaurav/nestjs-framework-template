import { FileStore } from './file-store';
import { Store } from 'express-session';

describe('FileStore', () => {
  it('should be defined', () => {
    expect(new FileStore({}, {})).toBeDefined();
  });

  it('should return store instance', async () => {
    const instance = new FileStore({ Store: { call: () => ({}) } }, {});
    expect((await instance.store()) instanceof Store);
  });
});
