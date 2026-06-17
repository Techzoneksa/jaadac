// ZATCA Phase 1 — Simplified Tax Invoice QR TLV encoding

export interface TLVData {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: number;
  vatTotal: number;
}

function toBytes(str: string): number[] {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(str));
}

function tlvEncode(tag: number, value: string): number[] {
  const bytes = toBytes(value);
  const len = bytes.length;
  if (len > 255) throw new Error(`TLV value too long for tag ${tag}: ${len} bytes`);
  return [tag, len, ...bytes];
}

export function encodeTLV(data: TLVData): number[] {
  const sellerBytes = tlvEncode(1, data.sellerName);
  const vatBytes = tlvEncode(2, data.vatNumber);
  const timeBytes = tlvEncode(3, data.timestamp);
  const totalBytes = tlvEncode(4, data.totalWithVat.toFixed(2));
  const vatTotalBytes = tlvEncode(5, data.vatTotal.toFixed(2));
  return [...sellerBytes, ...vatBytes, ...timeBytes, ...totalBytes, ...vatTotalBytes];
}

export function encodeTLVBase64(data: TLVData): string {
  const bytes = encodeTLV(data);
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}
