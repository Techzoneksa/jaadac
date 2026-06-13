// Tiny pure-SVG QR code generator using a minimal QR library.
// For V1 we use a stylized placeholder pattern derived from the input string —
// the layout/structure is in place for ZATCA Phase 2 wiring later.
export function QRCode({ value, size = 96 }: { value: string; size?: number }) {
  const grid = 21;
  const cell = size / grid;
  // deterministic pseudo-random pattern from input
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  const rand = (i: number, j: number) => {
    const v = Math.sin((i * 374761 + j * 668265263 + h) % 1000) * 10000;
    return Math.abs(v - Math.floor(v)) > 0.5;
  };
  const cells: { x: number; y: number }[] = [];
  for (let i = 0; i < grid; i++) for (let j = 0; j < grid; j++) {
    // finder squares
    const inFinder = (i < 7 && j < 7) || (i < 7 && j > grid - 8) || (i > grid - 8 && j < 7);
    if (inFinder) continue;
    if (rand(i, j)) cells.push({ x: j * cell, y: i * cell });
  }
  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width={cell * 7} height={cell * 7} fill="black" />
      <rect x={x + cell} y={y + cell} width={cell * 5} height={cell * 5} fill="white" />
      <rect x={x + cell * 2} y={y + cell * 2} width={cell * 3} height={cell * 3} fill="black" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white">
      <rect width={size} height={size} fill="white" />
      {cells.map((c, i) => <rect key={i} x={c.x} y={c.y} width={cell} height={cell} fill="black" />)}
      {finder(0, 0)}
      {finder(cell * (grid - 7), 0)}
      {finder(0, cell * (grid - 7))}
    </svg>
  );
}
