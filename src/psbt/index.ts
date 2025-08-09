import * as bitcoin from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import { network } from "../net/index";
import type { Utxo } from "../types";
import { ecPairToSigner } from "../crypto/signer";
import { InsufficientFundsError, PsbtBuildError } from "../core/errors";
import { toBuffer } from "../utils/bytes";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

/** Sum input values in satoshis. */
export function sumInputs(utxos: Utxo[]): number {
  return utxos.reduce((s, u) => s + u.value, 0);
}

/** Sum output values plus a fixed fee. */
export function sumOutputs(outputs: { address: string; value: number }[], fee: number): number {
  return outputs.reduce((s, o) => s + o.value, 0) + fee;
}

/** Calculate non-negative change amount. */
export function calcChange(totalIn: number, totalOut: number): number {
  return Math.max(0, totalIn - totalOut);
}

/**
 * Build a PSBT for P2WPKH-like inputs.
 * @throws PsbtBuildError | InsufficientFundsError
 */
export function buildPsbt(params: {
  utxos: Utxo[];
  outputs: { address: string; value: number }[];
  changeAddress: string;
  fee: number;
  testnet?: boolean;
}) {
  const n = network(!!params.testnet);
  const psbt = new bitcoin.Psbt({ network: n });

  if (params.fee < 0) throw new PsbtBuildError("fee must be >= 0");
  params.outputs.forEach((o) => {
    if (o.value <= 0) throw new PsbtBuildError("output value must be > 0");
  });

  const totalIn = sumInputs(params.utxos);
  const totalOut = sumOutputs(params.outputs, params.fee);

  if (totalOut > totalIn) throw new InsufficientFundsError("insufficient funds");

  params.utxos.forEach((u) => {
    psbt.addInput({
      hash: u.txid,
      index: u.vout,
      witnessUtxo: {
        value: u.value,
        script: u.scriptPubKey
          ? Buffer.from(u.scriptPubKey, "hex")
          : bitcoin.address.toOutputScript(params.changeAddress, n),
      },
    });
  });

  params.outputs.forEach((o) => psbt.addOutput({ address: o.address, value: o.value }));
  const change = calcChange(totalIn, totalOut);
  if (change > 0) psbt.addOutput({ address: params.changeAddress, value: change });

  return psbt;
}

/** Sign PSBT with WIF or raw private key. */
export function signPsbt(psbt: bitcoin.Psbt, priv: Buffer | string, testnet?: boolean) {
  const kp =
    typeof priv === "string"
      ? ECPair.fromWIF(priv, network(!!testnet))
      : ECPair.fromPrivateKey(toBuffer(priv), { network: network(!!testnet) });

  psbt.signAllInputs(ecPairToSigner(kp));
  return psbt;
}

/** Finalize all inputs and return hex and txid. */
export function finalizePsbt(psbt: bitcoin.Psbt) {
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  return { hex: tx.toHex(), txid: tx.getId() };
}


