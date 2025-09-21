export const bytes32ToString = (hex: `0x${string}`): string => {
  try {
    const clean = hex.slice(2);
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 2) {
      const byte = parseInt(clean.slice(i, i + 2), 16);
      if (byte === 0) break;
      bytes.push(byte);
    }
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
  } catch {
    return "";
  }
};
