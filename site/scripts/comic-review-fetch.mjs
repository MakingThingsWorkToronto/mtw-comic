// Retry bounded, read-only transport failures; callers still compare exact served bytes.
function retryable(error) {
  const chain = [], seen = new Set();
  for (let current = error; current && !seen.has(current); current = current.cause) {
    seen.add(current); chain.push(current);
  }
  // An explicit/manual cancellation must never be converted into a timeout retry.
  if (chain.some(item => item.name === 'AbortError')) return false;
  return chain.some(item => item.name === 'TimeoutError' ||
    ['ECONNRESET', 'ECONNREFUSED', 'UND_ERR_SOCKET'].includes(item.code));
}

export async function reviewText(url, {
  fetcher = fetch,
  sleep = ms => new Promise(r => setTimeout(r, ms)),
  signal,
} = {}) {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try {
      const deadline = AbortSignal.timeout(5000);
      const response = await fetcher(url, {
        method: 'GET',
        signal: signal ? AbortSignal.any([deadline, signal]) : deadline,
      });
      if (!response.ok) throw new Error(`Review HTTP ${response.status}: ${url}`);
      const text = await response.text();
      signal?.throwIfAborted();
      return text;
    } catch (error) {
      signal?.throwIfAborted();
      if (attempt === 2 || !retryable(error)) throw error;
      await sleep(100 * (attempt + 1));
    }
  }
}
