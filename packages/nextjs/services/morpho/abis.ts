// The few view functions Tokenping reads, from Morpho's interfaces (github.com/morpho-org/morpho-blue src/interfaces,
// morpho-org/pre-liquidation, morpho-org/midnight src/interfaces/IMidnight.sol); each was checked against the deployed
// contracts on 25 Oct 2026.

const MARKET_PARAMS_COMPONENTS = [
  { name: "loanToken", type: "address" },
  { name: "collateralToken", type: "address" },
  { name: "oracle", type: "address" },
  { name: "irm", type: "address" },
  { name: "lltv", type: "uint256" },
] as const;

const MARKET_COMPONENTS = [
  { name: "totalSupplyAssets", type: "uint128" },
  { name: "totalSupplyShares", type: "uint128" },
  { name: "totalBorrowAssets", type: "uint128" },
  { name: "totalBorrowShares", type: "uint128" },
  { name: "lastUpdate", type: "uint128" },
  { name: "fee", type: "uint128" },
] as const;

export const MORPHO_BLUE_ABI = [
  {
    type: "function",
    name: "position",
    stateMutability: "view",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "user", type: "address" },
    ],
    outputs: [
      { name: "supplyShares", type: "uint256" },
      { name: "borrowShares", type: "uint128" },
      { name: "collateral", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "market",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: MARKET_COMPONENTS,
  },
  {
    type: "function",
    name: "idToMarketParams",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: MARKET_PARAMS_COMPONENTS,
  },
  {
    type: "function",
    name: "isAuthorized",
    stateMutability: "view",
    inputs: [
      { name: "authorizer", type: "address" },
      { name: "authorized", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const MORPHO_IRM_ABI = [
  {
    type: "function",
    name: "borrowRateView",
    stateMutability: "view",
    inputs: [
      { name: "marketParams", type: "tuple", components: MARKET_PARAMS_COMPONENTS },
      { name: "market", type: "tuple", components: MARKET_COMPONENTS },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** Morpho's oracles: the price of one collateral unit in loan-token units, scaled by 1e36. */
export const MORPHO_ORACLE_ABI = [
  { type: "function", name: "price", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

export const PRE_LIQUIDATION_ABI = [
  { type: "function", name: "ID", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bytes32" }] },
  {
    type: "function",
    name: "preLiquidationParams",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "preLltv", type: "uint256" },
          { name: "preLCF1", type: "uint256" },
          { name: "preLCF2", type: "uint256" },
          { name: "preLIF1", type: "uint256" },
          { name: "preLIF2", type: "uint256" },
          { name: "preLiquidationOracle", type: "address" },
        ],
      },
    ],
  },
] as const;

export const PRE_LIQUIDATION_FACTORY_ABI = [
  {
    type: "function",
    name: "isPreLiquidation",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const MORPHO_MIDNIGHT_ABI = [
  {
    type: "function",
    name: "toMarket",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "chainId", type: "uint256" },
          { name: "midnight", type: "address" },
          { name: "loanToken", type: "address" },
          {
            name: "collateralParams",
            type: "tuple[]",
            components: [
              { name: "token", type: "address" },
              { name: "lltv", type: "uint256" },
              { name: "liquidationCursor", type: "uint256" },
              { name: "oracle", type: "address" },
            ],
          },
          { name: "maturity", type: "uint256" },
          { name: "rcfThreshold", type: "uint256" },
          { name: "enterGate", type: "address" },
          { name: "liquidatorGate", type: "address" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "debt",
    stateMutability: "view",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "uint128" }],
  },
  {
    type: "function",
    name: "collateralBitmap",
    stateMutability: "view",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "uint128" }],
  },
  {
    type: "function",
    name: "collateral",
    stateMutability: "view",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "user", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint128" }],
  },
] as const;

/** Multicall3's own views, so a reading carries the block it was taken at. */
export const MULTICALL3_BLOCK_ABI = [
  {
    type: "function",
    name: "getCurrentBlockTimestamp",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "timestamp", type: "uint256" }],
  },
] as const;

export const ERC20_METADATA_ABI = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
] as const;
