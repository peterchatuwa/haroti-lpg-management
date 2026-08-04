/** Web Serial API helpers for bench scales (9600 baud, line-delimited weight). */

export function serialScaleSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

function parseWeightLine(text: string): number | null {
  const match = text.match(/[-+]?\d+\.\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export async function readScaleWeight(timeoutMs = 8000): Promise<number> {
  if (!serialScaleSupported()) {
    throw new Error('Web Serial API is not supported in this browser (use Chrome/Edge).');
  }

  const port = await (navigator as Navigator & {
    serial: { requestPort: () => Promise<{ open: (opts: { baudRate: number }) => Promise<void>; readable?: ReadableStream<Uint8Array>; close: () => Promise<void> }> };
  }).serial.requestPort();

  await port.open({ baudRate: 9600 });

  try {
    const reader = port.readable?.getReader();
    if (!reader) throw new Error('Scale port not readable');

    const decoder = new TextDecoder();
    let buffer = '';
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const weight = parseWeightLine(line.trim());
        if (weight !== null) {
          reader.releaseLock();
          return weight;
        }
      }
    }

    reader.releaseLock();
    throw new Error('No weight reading received from scale — check connection.');
  } finally {
    await port.close();
  }
}
