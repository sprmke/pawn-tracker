/** Brand-aligned chart tokens (hex for Recharts SVG compatibility) */
export const CHART_HEIGHT = 300;

export const CHART_MARGIN = {
  top: 12,
  right: 16,
  left: 4,
  bottom: 4,
} as const;

export const CHART_PALETTE = {
  primary: '#e8850c',
  primaryLight: '#f5b35a',
  teal: '#34b39a',
  tealLight: '#5ed4b8',
  coral: '#dc6b6b',
  coralLight: '#f08a8a',
  violet: '#7c6dcb',
  violetLight: '#9d8ee0',
  gold: '#d4a535',
  goldLight: '#e8c060',
} as const;

export const CHART_AXIS = {
  tick: { fill: '#9c958c', fontSize: 11, fontWeight: 500 },
  tickLine: false,
  axisLine: { stroke: '#e8e4df' },
} as const;

export const CHART_GRID = {
  stroke: '#ebe7e2',
  strokeDasharray: '4 6',
  vertical: false,
} as const;

export const DEFAULT_PIE_COLORS = [
  CHART_PALETTE.primary,
  CHART_PALETTE.teal,
  CHART_PALETTE.coral,
  CHART_PALETTE.violet,
  CHART_PALETTE.gold,
  '#c78da8',
  '#5bbfad',
  '#b87333',
] as const;

/** Lighten a hex color for gradient tops */
export function chartGradientPair(base: string): { light: string; base: string } {
  const pairs: Record<string, { light: string; base: string }> = {
    [CHART_PALETTE.primary]: {
      light: CHART_PALETTE.primaryLight,
      base: CHART_PALETTE.primary,
    },
    [CHART_PALETTE.teal]: { light: CHART_PALETTE.tealLight, base: CHART_PALETTE.teal },
    [CHART_PALETTE.coral]: {
      light: CHART_PALETTE.coralLight,
      base: CHART_PALETTE.coral,
    },
    [CHART_PALETTE.violet]: {
      light: CHART_PALETTE.violetLight,
      base: CHART_PALETTE.violet,
    },
    [CHART_PALETTE.gold]: { light: CHART_PALETTE.goldLight, base: CHART_PALETTE.gold },
  };
  return pairs[base] ?? { light: base, base };
}

export function chartGradientId(key: string) {
  return `chart-grad-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
}
