import fs, { PathLike } from 'fs-extra';
import jsonfile from 'jsonfile';

export const removeFileIfExist = (path: string): Promise<void> => {
  return fs.remove(path);
};

type WriteToFileSerializer = (content: unknown) => string;
const defaultSerializer: WriteToFileSerializer = (data) => JSON.stringify(data, null, 2);
export const writeToFile = async (
  filePath: string,
  content: unknown,
  serializer: WriteToFileSerializer = defaultSerializer,
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

export const readJsonFile = async (
  filePath: PathLike,
  throws = true,
): Promise<Record<string, unknown>> => {
  return jsonfile.readFile(filePath, { throws });
};
