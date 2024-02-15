import fs from 'fs';
import * as Config from './config';
import { createLogger, ILogger } from './logger';

export class ConfigLoader {
  private static validatedConfig?: Config.Config;
  private static logger?: ILogger;

  constructor(private readonly configPath: string) {}

  static async init(logger?: ILogger): Promise<void> {
    this.logger = createLogger({
      parentLogger: logger,
      bindings: { module: ConfigLoader.name },
    });
    const configPath = Config.getConfigPath();
    let config: Config.Config | undefined;
    try {
      config = Config.getRawConfig(configPath);
      ConfigLoader.validatedConfig = Config.validate(config);
    } catch (err: unknown) {
      this.logger?.debug({ err }, `Configuration file ${configPath} was not read successfully`);
    }

    if (!ConfigLoader.validatedConfig) {
      this.logger?.info(`Config file ${configPath} will be generated interactively`);
      const defaultConfig = await Config.setup(config);
      ConfigLoader.upsertConfig(configPath, defaultConfig);
      this.logger?.info(
        `Config file was generated and stores to ${configPath}. Please run your command again`,
      );

      process.exit(0);
    }
  }

  static upsertConfig(configPath: string, config: Config.Config): void {
    const configJson = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, configJson);
  }

  loadSection<T extends keyof Config.Config>(sectionName: T): Config.Config[T] {
    if (!ConfigLoader.validatedConfig) {
      throw new Error(`Config is missing! Please run 'spctl setup' command`);
    }

    return ConfigLoader.validatedConfig[sectionName];
  }

  updateSection<T extends keyof Config.Config>(
    sectionName: T,
    newValues: Partial<Config.Config[T]>,
  ): void {
    if (!ConfigLoader.validatedConfig) {
      throw new Error(`Config is missing! Please run 'spctl setup' command`);
    }

    ConfigLoader.validatedConfig[sectionName] = {
      ...ConfigLoader.validatedConfig[sectionName],
      ...newValues,
    };

    fs.writeFileSync(this.configPath, JSON.stringify(ConfigLoader.validatedConfig, null, 4));
  }
}
