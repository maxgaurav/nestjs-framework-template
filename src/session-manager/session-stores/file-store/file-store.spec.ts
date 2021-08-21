import { FileStore } from './file-store';

describe('FileStore', () => {
  it('should be defined', () => {
    expect(new FileStore({}, {})).toBeDefined();
  });
});
