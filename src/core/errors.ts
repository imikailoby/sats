/**
 * Domain error hierarchy for @imikailoby/sats.
 * These errors are used instead of generic Error in all exported functions.
 */

export class SatsError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class DerivationError extends SatsError {}
export class AddressError extends SatsError {}
export class PsbtBuildError extends SatsError {}
export class ProviderError extends SatsError {}
export class NetworkError extends SatsError {}
export class TimeoutError extends SatsError {}
export class BroadcastError extends SatsError {}
export class InsufficientFundsError extends SatsError {}

export type SatsKnownError =
  | DerivationError
  | AddressError
  | PsbtBuildError
  | ProviderError
  | NetworkError
  | TimeoutError
  | BroadcastError
  | InsufficientFundsError;


