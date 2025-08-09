import { SatsError } from "../core/errors";

/**
 * Asserts a condition and throws provided SatsError when the condition is false.
 *
 * @param condition - Condition expected to be truthy
 * @param error - Error instance to throw when condition is false
 */
export function assert(condition: unknown, error: SatsError): asserts condition {
  if (!condition) throw error;
}


