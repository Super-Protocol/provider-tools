export const deployConfig = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'golden-execution-controller-tee-prov',
  },
  data: {
    APP_NAME: 'execution-controller-tee',
    PROVIDER_ACTION_ACCOUNT_KEY: '{{ action-account-private-key }}',
    PROVIDER_AUTH_ADDRESS: '{{ authority-account-address }}',
    PROVIDER_OFFERS_JSON: [
      {
        id: '{{ offer-id }}',
        argsPrivateKey: '{{ encryption-info }}',
        deviceId: '{{ device-id }}',
      },
    ],
    PROVIDER_PRIVATE_KEY: '{{ authority-account-private-key }}',
  },
};
