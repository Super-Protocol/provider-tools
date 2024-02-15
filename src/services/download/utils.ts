export const supportedPlatform: NodeJS.Platform[] = ['darwin', 'linux', 'win32'];
export const supportedArch: NodeJS.Architecture[] = ['arm64', 'x64'];
export const getOSAndArch = (): { platform: string; arch: string } => {
  const platform = process.platform;
  if (!supportedPlatform.includes(platform)) {
    throw new Error(`Unsupported OS: ${platform}`);
  }
  const arch = process.arch;
  if (!supportedArch.includes(arch)) {
    throw new Error(`Unsupported arch: ${arch}`);
  }

  return {
    platform: platform === 'darwin' ? 'macos' : platform,
    arch,
  };
};
