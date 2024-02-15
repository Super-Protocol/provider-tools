import fs, { PathLike } from 'fs-extra';

export const removeFileIfExist = (path: string): Promise<void> => {
  return fs.remove(path);
};

type WriteToFileSerializer = (content: unknown) => string;
export const writeToFile = async (
  filePath: string,
  content: unknown,
  serializer: WriteToFileSerializer = JSON.stringify,
): Promise<void> => {
  await fs.outputFile(filePath, serializer(content));
};

export const fileExist = async (filePath: PathLike): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    return false;
  }
};
