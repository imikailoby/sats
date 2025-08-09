import * as bitcoin from "bitcoinjs-lib";
export const network = (testnet?: boolean) =>
    testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;