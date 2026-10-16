type DecimalsHintProps = {
  decimals: number | undefined;
  isLoading: boolean;
  /** The action that waits for the decimals, e.g. "Saving". */
  action: string;
};

/** The token address field's description: plain text, so it fits inside the Field's description paragraph. */
export const DecimalsHint = ({ decimals, isLoading, action }: DecimalsHintProps) => (
  <>
    {decimals !== undefined
      ? `Detected decimals: ${decimals}`
      : isLoading
        ? "Loading token decimals"
        : `Token decimals unknown: check the token address. ${action} is disabled until they load.`}
  </>
);
