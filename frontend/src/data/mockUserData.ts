import type {
  SavedDesign,
  VaultItem,
  Order,
  UserProfile,
  OrderStageRecord,
  OrderStage,
} from '../types/jewelry';

// ---------------------------------------------------------------
// Helper: build full stage timeline
// ---------------------------------------------------------------
function buildStageTimeline(
  currentStage: OrderStage,
  cadApproved: boolean
): OrderStageRecord[] {
  const stageOrder: OrderStage[] = [
    'specs_locked', 'cad_approval', 'metal_casting',
    'stone_selection', 'master_setting', 'hand_polishing',
    'quality_control', 'dispatched',
  ];
  const idx = stageOrder.indexOf(currentStage);

  const labels: Record<OrderStage, { label: string; description: string }> = {
    specs_locked: { label: '01. Specs Locked', description: 'Your configuration has been confirmed and sent to our design studio.' },
    cad_approval: { label: '02. 3D CAD Render Approval', description: 'Our master jeweller has created a precision 3D CAD render. Please review and approve before casting begins.' },
    metal_casting: { label: '03. Metal Casting', description: 'Your ring is being cast in solid gold using lost-wax casting by our third-generation craftsmen.' },
    stone_selection: { label: '04. Hand-Picked Stone Selection', description: 'Our gemologist hand-selects your stone from a curated lot to match your specifications precisely.' },
    master_setting: { label: '05. Master Setting', description: 'Your stone is hand-set by our master setter with loupes and precision tools.' },
    hand_polishing: { label: '06. Hand Polishing', description: 'Your piece is brought to a mirror finish using traditional hand-polishing techniques.' },
    quality_control: { label: '07. 8-Point Quality Control', description: 'Independent gemological inspection: stone security, metal integrity, finish, weight, dimensions, engraving, documentation.' },
    dispatched: { label: '08. Insured DHL Express Dispatch', description: 'Your piece ships fully insured via DHL Express with real-time tracking.' },
  };

  return stageOrder.map((stage, i) => ({
    stage,
    label: labels[stage].label,
    description: labels[stage].description,
    completedAt: i < idx ? new Date(Date.now() - (idx - i) * 86400000 * 2).toISOString() : undefined,
    isPending: i > idx,
    isActive: i === idx,
    requiresApproval: stage === 'cad_approval' && i === idx && !cadApproved,
  }));
}

// ============================================================
// MOCK SAVED DESIGNS (My Designs tab)
// ============================================================
export const MOCK_SAVED_DESIGNS: SavedDesign[] = [
  {
    id: 'sd-001',
    productId: 'rg-sig-5s-001',
    productName: 'Signature 5-Stone Ring',
    config: {
      category: 'RG', style: '5S', setting: 'CLW', cut: 'OV',
      caratWeight: 1.00, metalPurity: '18K', metalColor: 'YG',
      stone: 'WLD', orientation: 'NS', stoneCount: 5, quantity: 1,
      ringSize: 'N', authorHandle: '@me',
    },
    sku: 'RG-5S-CLW-OV-10018YG-WLD',
    priceUSD: 5840,
    savedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    authorHandle: '@me',
    shareUrl: 'https://heirest.com/configure/signature-5-stone-ring?sku=RG-5S-CLW-OV-10018YG-WLD',
    notes: 'Anniversary gift idea — 18k YG with oval cuts',
  },
  {
    id: 'sd-002',
    productId: 'pd-bez-sl-005',
    productName: 'Bezel Solitaire Pendant',
    config: {
      category: 'PD', style: 'SL', setting: 'BEZ', cut: 'RND',
      caratWeight: 0.75, metalPurity: '18K', metalColor: 'WG',
      stone: 'SAP', orientation: 'NS', stoneCount: 1, quantity: 1,
      chainLength: 18, authorHandle: '@me',
    },
    sku: 'PD-SL-BEZ-RND-07518WG-SAP',
    priceUSD: 1920,
    savedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    authorHandle: '@me',
    shareUrl: 'https://heirest.com/configure/bezel-solitaire-pendant?sku=PD-SL-BEZ-RND-07518WG-SAP',
    notes: 'Birthday — sapphire in white gold, 18" chain',
  },
];

// ============================================================
// MOCK VAULT ITEMS (purchased pieces)
// ============================================================
export const MOCK_VAULT_ITEMS: VaultItem[] = [
  {
    id: 'vi-001',
    orderId: 'ord-2025-0472',
    productId: 'rg-sig-5s-001',
    productName: 'Signature 5-Stone Ring',
    sku: 'RG-5S-CLW-OV-10018YG-WLD',
    config: {
      category: 'RG', style: '5S', setting: 'CLW', cut: 'OV',
      caratWeight: 1.00, metalPurity: '18K', metalColor: 'YG',
      stone: 'WLD', orientation: 'NS', stoneCount: 5, quantity: 1,
      ringSize: 'N',
    },
    purchasedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    priceUSD: 5840,
    certificateNumber: 'HRS-CERT-2025-0472',
    stoneGradingReport: {
      lab: 'IGI',
      reportNumber: 'IGI-2025-LB-087643',
      shape: 'OV',
      caratWeight: 1.05,
      color: 'E',
      clarity: 'VS1',
      cut: 'Excellent',
      polish: 'Excellent',
      symmetry: 'Excellent',
      fluorescence: 'None',
      measurements: '7.35 × 5.48 × 3.52 mm',
    },
    insuranceValuation: 7200,
    resizingUsed: false,
    inspectionDue: new Date(Date.now() + 185 * 86400000).toISOString(),
  },
  {
    id: 'vi-002',
    orderId: 'ord-2024-1189',
    productId: 'pd-bez-sl-005',
    productName: 'Bezel Solitaire Pendant',
    sku: 'PD-SL-BEZ-RND-05018WG-WLD',
    config: {
      category: 'PD', style: 'SL', setting: 'BEZ', cut: 'RND',
      caratWeight: 0.50, metalPurity: '18K', metalColor: 'WG',
      stone: 'WLD', orientation: 'NS', stoneCount: 1, quantity: 1,
      chainLength: 18,
    },
    purchasedAt: new Date(Date.now() - 420 * 86400000).toISOString(),
    priceUSD: 1640,
    certificateNumber: 'HRS-CERT-2024-1189',
    stoneGradingReport: {
      lab: 'IGI',
      reportNumber: 'IGI-2024-LB-054219',
      shape: 'RND',
      caratWeight: 0.52,
      color: 'F',
      clarity: 'VVS2',
      cut: 'Excellent',
      polish: 'Excellent',
      symmetry: 'Very Good',
      fluorescence: 'None',
      measurements: '5.15 × 5.13 × 3.15 mm',
    },
    insuranceValuation: 2100,
    resizingUsed: false,
    inspectionDue: new Date(Date.now() + 365 * 86400000).toISOString(),
  },
];

// ============================================================
// MOCK ORDERS (Orders & 8-Stage tracker)
// ============================================================
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-2025-0938',
    orderNumber: 'HRS-2025-0938',
    items: [
      {
        id: 'ci-001',
        productId: 'rg-bez-et-003',
        config: {
          category: 'RG', style: 'ET', setting: 'BEZ', cut: 'RND',
          caratWeight: 1.50, metalPurity: '18K', metalColor: 'WG',
          stone: 'WLD', orientation: 'NS', stoneCount: 14, quantity: 1,
          ringSize: 'M',
        },
        sku: 'RG-ET-BEZ-RND-15018WG-WLD',
        priceUSD: 9240,
        quantity: 1,
        addedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
    ],
    totalUSD: 9240,
    placedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    estimatedCompletionDate: new Date(Date.now() + 9 * 86400000).toISOString(),
    currentStage: 'cad_approval',
    stages: buildStageTimeline('cad_approval', false),
    shippingAddress: {
      name: 'Alexandra Chen',
      line1: '42 Balmoral Avenue',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2041',
      country: 'Australia',
    },
    cadRenderApproved: false,
    cadRenderUrl: 'https://heirest.com/cad-renders/ord-2025-0938',
  },
  {
    id: 'ord-2025-0721',
    orderNumber: 'HRS-2025-0721',
    items: [
      {
        id: 'ci-002',
        productId: 'rg-sig-5s-001',
        config: {
          category: 'RG', style: '5S', setting: 'CLW', cut: 'OV',
          caratWeight: 1.25, metalPurity: '18K', metalColor: 'RG',
          stone: 'WLD', orientation: 'NS', stoneCount: 5, quantity: 1,
          ringSize: 'O', engraving: 'Always & Forever',
        },
        sku: 'RG-5S-CLW-OV-12518RG-WLD',
        priceUSD: 6980,
        quantity: 1,
        addedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
    ],
    totalUSD: 6980,
    placedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    estimatedCompletionDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    currentStage: 'dispatched',
    stages: buildStageTimeline('dispatched', true),
    shippingAddress: {
      name: 'Alexandra Chen',
      line1: '42 Balmoral Avenue',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2041',
      country: 'Australia',
    },
    cadRenderApproved: true,
    trackingNumber: 'DHL-1Z999AA10123456784',
  },
];

// ============================================================
// MOCK USER PROFILE
// ============================================================
export const MOCK_USER_PROFILE: UserProfile = {
  id: 'usr-001',
  email: 'alex.chen@example.com',
  name: 'Alexandra Chen',
  authorHandle: '@alexchendesigns',
  avatarInitials: 'AC',
  fingerSizes: [
    { hand: 'left', finger: 'ring', size: 'N' },
    { hand: 'left', finger: 'pinky', size: 'H' },
    { hand: 'right', finger: 'ring', size: 'O' },
    { hand: 'right', finger: 'middle', size: 'P' },
    { hand: 'right', finger: 'index', size: 'Q' },
  ],
  preferredChainLengths: [18, 20],
  sizingKitVoucherCode: 'SKIT-2025-ALEX-19',
  sizingKitRedeemed: false,
  memberSince: '2024-03-15',
};
