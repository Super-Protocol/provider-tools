import fs from 'fs-extra';

export const removeFileIfExist = (path: string): Promise<void> => {
  return fs.remove(path);
};
