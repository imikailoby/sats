import * as bitcoin from "bitcoinjs-lib";
import { network } from "./net";

export function p2wpkhAddress(pubkey: Buffer, testnet = false) {
    const pay = bitcoin.payments.p2wpkh({ pubkey, network: network(testnet) });
    if (!pay.address || !pay.output) throw new Error("address fail");
    return { address: pay.address, scriptPubKey: pay.output.toString("hex") };
}