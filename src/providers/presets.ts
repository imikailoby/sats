import { esplora } from "./esplora";

export const providers = {
    blockstream: (testnet = false) =>
        esplora(testnet ? "https://blockstream.info/testnet/api" : "https://blockstream.info/api"),
    mempool: (testnet = false) =>
        esplora(testnet ? "https://mempool.space/testnet/api" : "https://mempool.space/api"),
    esplora
};