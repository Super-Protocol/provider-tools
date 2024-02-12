import { Command } from 'commander';

export const processSubCommands = (program: Command, process: (command: Command) => void): void => {
  process(program);

  const processRecursive = (cmd: Command): void => {
    cmd.commands.forEach((cmd) => {
      process(cmd);
      processRecursive(cmd);
    });
  };

  processRecursive(program);
};
