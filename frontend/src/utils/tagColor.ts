// Consistent, deterministic pastel color per tag value (sector, funding stage, etc.)
// so the same label always renders in the same color across the whole app.
const PALETTE: Array<{ bg: string; color: string }> = [
  { bg: '#e8f0fe', color: '#1d4ed8' }, // blue
  { bg: '#f3e8fd', color: '#7c3aed' }, // purple
  { bg: '#e6f7ee', color: '#15803d' }, // green
  { bg: '#fef3e0', color: '#b45309' }, // amber
  { bg: '#fde8f3', color: '#be185d' }, // pink
  { bg: '#e0f7f5', color: '#0f766e' }, // teal
  { bg: '#e8eafd', color: '#4338ca' }, // indigo
  { bg: '#fde8e8', color: '#b91c1c' }, // rose
];

export const getTagColor = (value: string | undefined | null): { bg: string; color: string } => {
  if (!value) return { bg: '#f1f5f9', color: '#475569' };
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
};
