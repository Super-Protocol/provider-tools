export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export type SleepFn = () => Promise<void>;

export const sleepLinearFn =
  (ms: number): SleepFn =>
  async () =>
    sleep(ms);

export const sleepExpFn = (ms: number, multiplier: number): SleepFn => {
  let previous = 0;

  return async (): Promise<void> => {
    previous = ms;
    ms *= multiplier;

    return sleep(previous);
  };
};
