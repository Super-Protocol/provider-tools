import { hasAccountChanges, Answers } from './setup';
import { AccountConfig } from './types';

describe('setup', () => {
  describe('hasAccountChanges', () => {
    const check = (
      answers: Answers['account'],
      config: Partial<AccountConfig>,
      result: boolean,
    ): void => expect(hasAccountChanges(answers, config)).toBe(result);

    describe('true', () => {
      it('when config does not have one account type', () => {
        const config: Partial<AccountConfig> = {
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
        };
        const answers: Partial<Answers['account']> = {
          isAutoGenerationNeeded: {
            action: true,
            tokenReceiver: false,
            authority: false,
          },
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          needToClearProviderOffers: true,
        };

        check(answers as never, config, true);
      });

      it('when config is empty', () => {
        const answers: Partial<Answers['account']> = {
          isAutoGenerationNeeded: {
            action: true,
            tokenReceiver: false,
            authority: false,
          },
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          needToClearProviderOffers: false,
        };

        check(answers as never, {}, true);
      });

      it('when we have one new private key by manually', () => {
        const config: Partial<AccountConfig> = {
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          action: 'private-key-3',
        };
        const answers: Partial<Answers['account']> = {
          isAutoGenerationNeeded: {
            action: false,
            tokenReceiver: false,
            authority: false,
          },
          action: 'new-private-key-3',
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          needToClearProviderOffers: true,
        };

        check(answers as never, config, true);
      });

      it('when we have all new private key by auto', () => {
        const config: Partial<AccountConfig> = {
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          action: 'private-key-3',
        };
        const answers: Partial<Answers['account']> = {
          isAutoGenerationNeeded: {
            action: false,
            tokenReceiver: false,
            authority: false,
          },
          action: 'new-private-key-3',
          authority: 'new-private-key-1',
          tokenReceiver: 'new-private-key-2',
          needToClearProviderOffers: true,
        };

        check(answers as never, config, true);
      });
    });
    describe('false', () => {
      it('when we have the same value', () => {
        const config: Partial<AccountConfig> = {
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          action: 'private-key-3',
        };
        const answers: Partial<Answers['account']> = {
          isAutoGenerationNeeded: {
            action: false,
            tokenReceiver: false,
            authority: false,
          },
          action: 'private-key-3',
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          needToClearProviderOffers: true,
        };

        check(answers as never, config, false);
      });

      it('when we did not confirm to clear provider offers', () => {
        const config: Partial<AccountConfig> = {
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          action: 'private-key-3',
        };
        const answers: Partial<Answers['account']> = {
          isAutoGenerationNeeded: {
            action: false,
            tokenReceiver: false,
            authority: false,
          },
          authority: 'private-key-1',
          tokenReceiver: 'private-key-2',
          action: 'private-key-3',
          needToClearProviderOffers: false,
        };

        check(answers as never, config, false);
      });
    });
  });
});
