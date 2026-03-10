export type PaymentTokenConfig =
  | {
      mode: "canonical";
      label: string;
      address: string;
    }
  | {
      mode: "mock";
      label: string;
    };

export type NetworkDeployConfig = {
  chainId: number;
  name: string;
  planDurationDays: number;
  maxDurationDays: number;
  paymentToken: PaymentTokenConfig;
};
