import { esplora } from "./esplora";

export const providers = {
  blockstream: (testnet = false, opts?: { timeoutMs?: number }) =>
    esplora(testnet ? "https://blockstream.info/testnet/api" : "https://blockstream.info/api", opts),
  mempool: (testnet = false, opts?: { timeoutMs?: number }) =>
    esplora(testnet ? "https://mempool.space/testnet/api" : "https://mempool.space/api", opts),
  esplora,
};