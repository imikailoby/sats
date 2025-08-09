import * as bitcoin from "bitcoinjs-lib";
import { network } from "../net/index";
import { AddressError } from "../core/errors";

/**
 * Builds P2WPKH address and scriptPubKey for the given public key.
 * @param pubkey - compressed public key buffer
 * @param testnet - when true, builds testnet address
 * @returns address and scriptPubKey hex
 * @throws AddressError
 */
export function p2wpkhAddress(pubkey: Buffer, testnet = false) {
  const pay = bitcoin.payments.p2wpkh({ pubkey, network: network(testnet) });
  if (!pay.address || !pay.output) throw new AddressError("failed to build p2wpkh address");
  return { address: pay.address, scriptPubKey: pay.output.toString("hex") };
}


