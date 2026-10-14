type DecimalsHintProps = {
  decimals: number | undefined;
  isLoading: boolean;
  /** The action that waits for the decimals, e.g. "Saving". */
  action: string;
};

export const DecimalsHint = ({ decimals, isLoading, action }: DecimalsHintProps) => (
  <div className="text-xs text-base-content/70">
    {decimals !== undefined
      ? `Detected decimals: ${decimals}`
      : isLoading
        ? "Loading token decimals..."
        : `Token decimals unknown: check the token address. ${action} is disabled until they load.`}
  </div>
);
