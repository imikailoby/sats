import * as bitcoin from "bitcoinjs-lib";
import { NetworkError } from "../core/errors";

/**
 * Selects bitcoin network by flag.
 * @param testnet - when true, returns testnet network; otherwise mainnet
 * @throws NetworkError when network cannot be resolved
 */
export const network = (testnet?: boolean) => {
  const n = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  if (!n) throw new NetworkError("Unknown bitcoin network");
  return n;
};

export type Network = bitcoin.Network;


