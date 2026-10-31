export type PrivacyProcessor = {
  name: string;
  role: string;
  receives: string;
};

export type ProcessorFacts = {
  minutes: number;
  hasTelegram: boolean;
};

/** "<before> <link> <middle> <link> <or> <link> <after>", the spaces around the links written by the page. */
export type ContactText = {
  before: string;
  x: string;
  middle: string;
  telegram: string;
  or: string;
  signal: string;
  after: string;
};

export type PrivacyMessages = {
  metaTitle: string;
  metaDescription: string;
  crumbHome: string;
  crumbPrivacy: string;
  title: string;
  /** Followed by a space and the date. */
  lastUpdated: string;
  intro: string;
  withoutUs: { title: string; text: string; morpho: string };
  stored: { title: string; items: readonly string[]; telegram: string; attribution: string };
  notStored: { title: string; items: readonly string[] };
  whoCanSee: { title: string; tiedToWallet: string; anyone: (hasTelegram: boolean) => string; dontEnter: string };
  processors: {
    title: string;
    list: (facts: ProcessorFacts) => PrivacyProcessor[];
    receives: (receives: string) => string;
    ownPolicy: string;
  };
  /** The chain name is undefined when no target network has a paywall. */
  onChain: { title: string; text: (paymentChainName: string | undefined) => string };
  retention: { title: string; settings: string; telegramStop: string; contact: ContactText; payments: string };
  /** "<before><link><after>": the page links the home page. */
  homepage: { before: string; link: string; after: string };
};
