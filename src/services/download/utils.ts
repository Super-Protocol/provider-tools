export const supportedPlatform: NodeJS.Platform[] = ['darwin', 'linux'];
export const supportedArch: NodeJS.Architecture[] = ['arm64', 'x64'];
export const getOSAndArch = (): string => {
  const os = process.platform;
  if (!supportedPlatform.includes(os)) {
    throw new Error(`Unsupported OS: ${os}`);
  }

  const arch = process.arch;
  if (!supportedArch.includes(arch)) {
    throw new Error(`Unsupported arch: ${arch}`);
  }

  return `${os}-${arch}`;
};
