import type {
  JewelryConfig,
  JewelryCategory,
  JewelryStyle,
  SettingStyle,
  StoneCut,
  MetalPurity,
  MetalColor,
  StoneType,
} from '../types/jewelry';

// ---------------------------------------------------------------
// SKU segment maps
// ---------------------------------------------------------------
const CATEGORY_MAP: Record<JewelryCategory, string> = {
  RG: 'RG', PD: 'PD', ER: 'ER', BR: 'BR', NK: 'NK',
};
const STYLE_MAP: Record<JewelryStyle, string> = {
  '5S': '5S', SL: 'SL', ET: 'ET', SG: 'SG', LT: 'LT',
  MD: 'MD', ST: 'ST', DR: 'DR', HG: 'HG', TN: 'TN',
};
const SETTING_MAP: Record<SettingStyle, string> = {
  CLW: 'CLW', BEZ: 'BEZ', COL: 'COL', PAV: 'PAV', CHN: 'CHN', BAR: 'BAR',
};
const CUT_MAP: Record<StoneCut, string> = {
  RND: 'RND', OV: 'OV', EMC: 'EMC', PR: 'PR', HT: 'HT',
  MQ: 'MQ', CU: 'CU', AS: 'AS',
};
const METAL_PURITY_MAP: Record<MetalPurity, string> = {
  '9K': '09', '14K': '14', '18K': '18', PT950: 'PT',
};
const METAL_COLOR_MAP: Record<MetalColor, string> = {
  YG: 'YG', WG: 'WG', RG: 'RG', PT: 'PT',
};
const STONE_MAP: Record<StoneType, string> = {
  WLD: 'WLD', NTD: 'NTD', SAP: 'SAP', EMR: 'EMR',
  RBY: 'RBY', AQM: 'AQM', MRG: 'MRG', OPA: 'OPA',
};

// Reverse maps
const REV_CATEGORY: Record<string, JewelryCategory> = Object.fromEntries(
  Object.entries(CATEGORY_MAP).map(([k, v]) => [v, k as JewelryCategory])
);
const REV_STYLE: Record<string, JewelryStyle> = Object.fromEntries(
  Object.entries(STYLE_MAP).map(([k, v]) => [v, k as JewelryStyle])
);
const REV_SETTING: Record<string, SettingStyle> = Object.fromEntries(
  Object.entries(SETTING_MAP).map(([k, v]) => [v, k as SettingStyle])
);
const REV_CUT: Record<string, StoneCut> = Object.fromEntries(
  Object.entries(CUT_MAP).map(([k, v]) => [v, k as StoneCut])
);
const REV_PURITY: Record<string, MetalPurity> = Object.fromEntries(
  Object.entries(METAL_PURITY_MAP).map(([k, v]) => [v, k as MetalPurity])
);
const REV_COLOR: Record<string, MetalColor> = Object.fromEntries(
  Object.entries(METAL_COLOR_MAP).map(([k, v]) => [v, k as MetalColor])
);
const REV_STONE: Record<string, StoneType> = Object.fromEntries(
  Object.entries(STONE_MAP).map(([k, v]) => [v, k as StoneType])
);

// ---------------------------------------------------------------
// Encode config → SKU string
// Format: [CAT]-[STYLE]-[SETTING]-[CUT]-[CARATPURITY COLOR]-[STONE]
// Example: RG-5S-CLW-OV-10014YG-WLD
// ---------------------------------------------------------------
export function encodeSkuFromConfig(config: JewelryConfig): string {
  const carat = Math.round(config.caratWeight * 100)
    .toString()
    .padStart(3, '0');
  const purity = METAL_PURITY_MAP[config.metalPurity];
  const color = METAL_COLOR_MAP[config.metalColor];
  const stone = STONE_MAP[config.stone];
  const cat = CATEGORY_MAP[config.category];
  const style = STYLE_MAP[config.style];
  const setting = SETTING_MAP[config.setting];
  const cut = CUT_MAP[config.cut];
  return `${cat}-${style}-${setting}-${cut}-${carat}${purity}${color}-${stone}`;
}

// ---------------------------------------------------------------
// Decode SKU string → partial JewelryConfig
// ---------------------------------------------------------------
export function decodeSkuToConfig(sku: string): Partial<JewelryConfig> | null {
  try {
    const parts = sku.toUpperCase().split('-');
    if (parts.length < 6) return null;

    const [cat, style, setting, cut, metalBlock, stone] = parts;

    // metalBlock: e.g. "10014YG" → carat="100" purity="14" color="YG"
    // Or "100PTYG" won't happen — PT uses "PT" purity + "PT" color
    // Parse: first 3 chars = carat*100, then "09"|"14"|"18"|"PT", then 2 chars color
    let caratStr = metalBlock.slice(0, 3);
    let rest = metalBlock.slice(3);
    let purityStr: string;
    let colorStr: string;

    if (rest.startsWith('PT')) {
      purityStr = 'PT';
      colorStr = rest.slice(2);
    } else {
      purityStr = rest.slice(0, 2);
      colorStr = rest.slice(2);
    }

    const caratWeight = parseInt(caratStr, 10) / 100;

    return {
      category: REV_CATEGORY[cat],
      style: REV_STYLE[style],
      setting: REV_SETTING[setting],
      cut: REV_CUT[cut],
      caratWeight,
      metalPurity: REV_PURITY[purityStr],
      metalColor: REV_COLOR[colorStr],
      stone: REV_STONE[stone],
      stoneCount: 1,
      quantity: 1,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------
// Human-readable label helpers
// ---------------------------------------------------------------
export const CATEGORY_LABELS: Record<JewelryCategory, string> = {
  RG: 'Ring', PD: 'Pendant', ER: 'Earrings', BR: 'Bracelet', NK: 'Necklace',
};
export const STYLE_LABELS: Record<JewelryStyle, string> = {
  '5S': '5-Stone', SL: 'Solitaire', ET: 'Eternity', SG: 'Signet',
  LT: 'Letter', MD: 'Medallion', ST: 'Studs', DR: 'Drop',
  HG: 'Huggie', TN: 'Tennis',
};
export const SETTING_LABELS: Record<SettingStyle, string> = {
  CLW: 'Claw Prong', BEZ: 'Bezel', COL: 'Georgian Collet',
  PAV: 'Pavé', CHN: 'Channel', BAR: 'Bar',
};
export const CUT_LABELS: Record<StoneCut, string> = {
  RND: 'Round Brilliant', OV: 'Oval', EMC: 'Emerald Cut', PR: 'Pear',
  HT: 'Heart', MQ: 'Marquise', CU: 'Cushion', AS: 'Asscher',
};
export const METAL_PURITY_LABELS: Record<MetalPurity, string> = {
  '9K': '9K', '14K': '14K', '18K': '18K', PT950: 'Platinum 950',
};
export const METAL_COLOR_LABELS: Record<MetalColor, string> = {
  YG: 'Yellow Gold', WG: 'White Gold', RG: 'Rose Gold', PT: 'Platinum',
};
export const STONE_LABELS: Record<StoneType, string> = {
  WLD: 'White Lab Diamond', NTD: 'Natural Diamond',
  SAP: 'Ceylon Blue Sapphire', EMR: 'Zambian Emerald',
  RBY: 'Pigeon Blood Ruby', AQM: 'Aquamarine',
  MRG: 'Morganite', OPA: 'Opal',
};

export function formatSku(sku: string): string {
  return sku.toUpperCase();
}

export function generateShareUrl(sku: string, productSlug: string): string {
  return `${window.location.origin}/configure/${productSlug}?sku=${sku}`;
}
