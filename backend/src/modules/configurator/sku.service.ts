export interface JewelryConfigInput {
  category: string;
  style: string;
  setting: string;
  cut: string;
  caratWeight: number;
  metalPurity: string;
  metalColor: string;
  stone: string;
  orientation?: string;
  ringSize?: string;
  chainLength?: number;
  engraving?: string;
  stoneCount?: number;
  quantity?: number;
  authorHandle?: string;
}

export const skuService = {
  /**
   * Encode config into canonical Heirest SKU format:
   * e.g. RG-5S-CLW-OV-10018YG-WLD
   */
  encode(config: JewelryConfigInput): string {
    const cat = (config.category || 'RG').toUpperCase();
    const style = (config.style || '5S').toUpperCase();
    const setting = (config.setting || 'CLW').toUpperCase();
    const cut = (config.cut || 'OV').toUpperCase();
    const caratPadded = Math.round(Number(config.caratWeight || 1.0) * 100)
      .toString()
      .padStart(3, '0');
    const purity = (config.metalPurity || '18K').toUpperCase();
    const color = (config.metalColor || 'YG').toUpperCase();
    const stone = (config.stone || 'WLD').toUpperCase();

    return `${cat}-${style}-${setting}-${cut}-${caratPadded}${purity}${color}-${stone}`;
  },

  /**
   * Decode canonical SKU into structured JewelryConfig attributes
   */
  decode(sku: string): Partial<JewelryConfigInput> {
    const parts = sku.split('-');
    if (parts.length < 6) {
      throw new Error(`Invalid SKU format: ${sku}`);
    }

    const [category, style, setting, cut, metalPart, stone] = parts;
    const caratNum = parseInt(metalPart.slice(0, 3), 10) / 100;
    const rest = metalPart.slice(3); // e.g. "18KYG" or "18YG" or "PT950PT"

    let metalPurity = '18K';
    let metalColor = 'YG';

    if (rest.startsWith('PT950')) {
      metalPurity = 'PT950';
      metalColor = rest.slice(5) || 'PT';
    } else if (rest.startsWith('9K') || rest.startsWith('14K') || rest.startsWith('18K')) {
      const match = rest.match(/^(9K|14K|18K)(.*)$/);
      if (match) {
        metalPurity = match[1];
        metalColor = match[2] || 'YG';
      }
    }

    return {
      category,
      style,
      setting,
      cut,
      caratWeight: caratNum,
      metalPurity,
      metalColor,
      stone
    };
  }
};
