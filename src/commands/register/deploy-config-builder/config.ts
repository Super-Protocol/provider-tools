export const deployConfig = {
  data: {
    PROVIDER_ACTION_ACCOUNT_KEY: '{{ action-account-private-key }}',
    PROVIDER_AUTH_ADDRESS: '{{ authority-account-address }}',
    PROVIDER_OFFERS_JSON: [
      {
        id: '{{ offer-id }}',
        argsPrivateKey: '{{ encryption-info }}',
        deviceId: '{{ device-id }}',
      },
    ],
  },
};
