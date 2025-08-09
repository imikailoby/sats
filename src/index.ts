// Public API facade. Re-export with same names and signatures as before.
export * from "./types";

/**
 * Network helpers (mainnet/testnet).
 */
export { network } from "./net";

/**
 * Keys and wallet helpers (BIP39/BIP84).
 */
export * from "./keys";

/**
 * Address helpers.
 */
export * from "./addresses";

/**
 * PSBT helpers: build, sign, finalize.
 */
export { buildPsbt, signPsbt, finalizePsbt } from "./psbt";

/**
 * Providers: chain of providers and presets.
 */
export { createProviderChain } from "./providers/base";
export { providers } from "./providers/presets";