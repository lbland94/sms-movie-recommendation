export function byteToNumber(text: string): number {
  const powers = { k: 1, m: 2, g: 3, t: 4 };
  const regex = /(\d+(?:\.\d+)?)\s?(k|m|g|t)?b?/i;

  if (regex.test(text)) {
    const res = regex.exec(text);

    return Number(res[1]) * Math.pow(1024, powers[res[2].toLowerCase()]);
  }
  return NaN;
}

export function safeUrl(url: string): URL|undefined {
  try {
    return new URL(url);
  } catch (e) {
    // Bad url, bad
  }
  return undefined;
}
