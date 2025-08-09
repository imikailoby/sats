import { ProviderError, TimeoutError } from "../core/errors";

/**
 * Wrap a promise with a timeout.
 * @param promise - promise to wrap
 * @param ms - timeout in milliseconds
 * @throws TimeoutError on timeout
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(`timeout after ${ms}ms`)), ms);
    // Hint to Node to not keep the event loop alive for this timer.
    // Optional chaining for browser compatibility.
    (timer as any)?.unref?.();
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export type HttpOptions = { timeoutMs?: number };

/**
 * GET JSON helper with timeout.
 */
export async function getJson<T = unknown>(baseUrl: string, path: string, opts: HttpOptions = {}): Promise<T> {
  const url = baseUrl + path;
  const request = fetch(url).then(async (r) => {
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new ProviderError(`GET ${url} failed: ${r.status} ${body}`);
    }
    return r.json() as Promise<T>;
  });
  return opts.timeoutMs ? withTimeout(request, opts.timeoutMs) : request;
}

/**
 * POST text helper with timeout. Returns raw response text.
 */
export async function postText(baseUrl: string, path: string, body: string, opts: HttpOptions = {}): Promise<string> {
  const url = baseUrl + path;
  const request = fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
  }).then(async (r) => {
    const text = await r.text();
    if (!r.ok) throw new ProviderError(`POST ${url} failed: ${r.status} ${text}`);
    return text;
  });
  return opts.timeoutMs ? withTimeout(request, opts.timeoutMs) : request;
}


