import { PrismaClient, Role, OrderStage } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Seeding Heirest fine jewelry database...');

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedCustomerPassword = await bcrypt.hash('customer123', 10);

  // 1. Admin & Demo Customer Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@heirest.com' },
    update: {
      firstName: 'Heirest',
      lastName: 'Admin',
      authorHandle: '@heirest_admin',
      role: Role.ADMIN,
      membershipTier: 'Founding Author'
    },
    create: {
      id: 'admin-001',
      email: 'admin@heirest.com',
      passwordHash: hashedAdminPassword,
      firstName: 'Heirest',
      lastName: 'Admin',
      authorHandle: '@heirest_admin',
      role: Role.ADMIN,
      membershipTier: 'Founding Author'
    }
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: 'india@heirest.co' },
    update: {
      firstName: 'India',
      lastName: 'Moxley',
      authorHandle: '@indiemoxley',
      role: Role.CUSTOMER,
      membershipTier: 'Collector',
      sizingKitVoucherCode: 'HEIREST-KIT-19',
      savedSizes: [
        { hand: 'left', finger: 'ring', size: 'N' },
        { hand: 'right', finger: 'index', size: 'O' }
      ],
      preferredChainLengths: [18, 20]
    },
    create: {
      id: 'demo-001',
      email: 'india@heirest.co',
      passwordHash: hashedCustomerPassword,
      firstName: 'India',
      lastName: 'Moxley',
      authorHandle: '@indiemoxley',
      role: Role.CUSTOMER,
      membershipTier: 'Collector',
      sizingKitVoucherCode: 'HEIREST-KIT-19',
      savedSizes: [
        { hand: 'left', finger: 'ring', size: 'N' },
        { hand: 'right', finger: 'index', size: 'O' }
      ],
      preferredChainLengths: [18, 20]
    }
  });

  // 2. Pricing Matrix
  await prisma.pricingMatrix.deleteMany();
  await prisma.pricingMatrix.create({
    data: {
      id: 'matrix-001',
      metalRates: { '9K': 35, '14K': 55, '18K': 75, PT950: 85 },
      metalColorPremium: { YG: 1.0, WG: 1.05, RG: 1.05, PT: 1.1 },
      diamondRate: 1800,
      stoneTypeRate: {
        WLD: 1800,
        NTD: 2400,
        SAP: 1200,
        EMR: 1400,
        RBY: 1500,
        AQM: 900,
        MRG: 850,
        OPA: 750
      },
      cutPremiumMultiplier: {
        RND: 1.0,
        OV: 1.05,
        EMC: 1.08,
        PR: 1.04,
        HT: 1.06,
        MQ: 1.05,
        CU: 1.03,
        AS: 1.07
      },
      fxRates: { USD: 1.0, AUD: 1.52, GBP: 0.78, EUR: 0.92, INR: 83.5, AED: 3.67, CAD: 1.36 }
    }
  });

  // 3. Storefront CMS
  await prisma.storefrontCms.deleteMany();
  await prisma.storefrontCms.create({
    data: {
      id: 'cms-001',
      announcementBarVisible: true,
      announcementBarText: 'COMPLIMENTARY WORLDWIDE INSURED COURIER ON ALL BESPOKE COMMISSIONS',
      sizingKitPrice: 35.0,
      heroHeadline: 'Sculpted by You, Perfected by Masters',
      heroSubheadline: 'Parametric fine jewelry crafted in solid gold and lab-grown stones',
      heroMediaUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200'
    }
  });

  // 4. 12 Base Jewelry Models
  const catalog = [
    {
      id: 'rg-sig-5s-001',
      slug: 'signature-5-stone-ring',
      name: 'Signature 5-Stone Ring',
      shortDescription: 'Five hand-set stones in a timeless graduated band. The quintessential Heirest statement.',
      category: 'RG',
      style: '5S',
      defaultConfig: {
        category: 'RG', style: '5S', setting: 'CLW', cut: 'OV',
        caratWeight: 1.00, metalPurity: '18K', metalColor: 'YG',
        stone: 'WLD', orientation: 'NS', stoneCount: 5, quantity: 1, ringSize: 'N'
      },
      baseCraftsmanshipFee: 650,
      availableMetals: ['9K', '14K', '18K', 'PT950'],
      availableMetalColors: ['YG', 'WG', 'RG'],
      availableStones: ['WLD', 'NTD', 'SAP', 'EMR', 'RBY'],
      availableCuts: ['OV', 'RND', 'EMC', 'MQ'],
      availableSettings: ['CLW', 'BEZ', 'COL'],
      availableCaratWeights: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
      metalWeightGrams: 4.2,
      tags: ['bestseller', 'rings', '5-stone'],
      isBestseller: true,
      imagePlaceholderColor: '#C5A880'
    },
    {
      id: 'rg-geo-pk-002',
      slug: 'georgian-pinky-ring',
      name: 'Georgian Pinky Ring',
      shortDescription: 'Antique-inspired collet settings in an elegant pinky silhouette. Wearable history.',
      category: 'RG',
      style: 'SG',
      defaultConfig: {
        category: 'RG', style: 'SG', setting: 'COL', cut: 'RND',
        caratWeight: 0.25, metalPurity: '18K', metalColor: 'YG',
        stone: 'WLD', orientation: 'NS', stoneCount: 1, quantity: 1, ringSize: 'D'
      },
      baseCraftsmanshipFee: 480,
      availableMetals: ['9K', '14K', '18K'],
      availableMetalColors: ['YG', 'WG'],
      availableStones: ['WLD', 'SAP', 'EMR', 'RBY', 'AQM'],
      availableCuts: ['RND', 'OV', 'HT'],
      availableSettings: ['COL', 'BEZ', 'CLW'],
      availableCaratWeights: [0.25, 0.35, 0.5],
      metalWeightGrams: 2.8,
      tags: ['rings', 'pinky', 'georgian'],
      isNew: true,
      imagePlaceholderColor: '#B8A99A'
    },
    {
      id: 'rg-bez-et-003',
      slug: 'bezel-eternity-ring',
      name: 'Bezel Eternity Band',
      shortDescription: 'A continuous circle of bezel-set brilliants. Every angle, perfection.',
      category: 'RG',
      style: 'ET',
      defaultConfig: {
        category: 'RG', style: 'ET', setting: 'BEZ', cut: 'RND',
        caratWeight: 1.50, metalPurity: '18K', metalColor: 'WG',
        stone: 'WLD', orientation: 'NS', stoneCount: 14, quantity: 1, ringSize: 'M'
      },
      baseCraftsmanshipFee: 820,
      availableMetals: ['14K', '18K', 'PT950'],
      availableMetalColors: ['YG', 'WG', 'RG', 'PT'],
      availableStones: ['WLD', 'SAP', 'EMR', 'RBY'],
      availableCuts: ['RND', 'EMC', 'PR'],
      availableSettings: ['BEZ', 'CLW', 'CHN'],
      availableCaratWeights: [1.0, 1.5, 2.0, 2.5],
      metalWeightGrams: 5.1,
      tags: ['rings', 'eternity', 'wedding'],
      isBestseller: true,
      imagePlaceholderColor: '#C0B6A8'
    },
    {
      id: 'rg-her-sg-004',
      slug: 'heritage-signet-ring',
      name: 'Heritage Signet Ring',
      shortDescription: 'Solid gold signet with central gemstone flush-set into a polished mirror face.',
      category: 'RG',
      style: 'SG',
      defaultConfig: {
        category: 'RG', style: 'SG', setting: 'COL', cut: 'OV',
        caratWeight: 0.50, metalPurity: '18K', metalColor: 'YG',
        stone: 'NTD', orientation: 'NS', stoneCount: 1, quantity: 1, ringSize: 'P'
      },
      baseCraftsmanshipFee: 550,
      availableMetals: ['9K', '14K', '18K'],
      availableMetalColors: ['YG', 'WG', 'RG'],
      availableStones: ['WLD', 'NTD', 'SAP', 'EMR', 'RBY', 'OPA'],
      availableCuts: ['OV', 'EMC', 'CU'],
      availableSettings: ['COL', 'BEZ'],
      availableCaratWeights: [0.35, 0.5, 0.75, 1.0],
      metalWeightGrams: 7.2,
      tags: ['rings', 'signet', 'heritage'],
      imagePlaceholderColor: '#A89F91'
    },
    {
      id: 'pd-bez-sl-005',
      slug: 'bezel-solitaire-pendant',
      name: 'Bezel Solitaire Pendant',
      shortDescription: 'A pure floating stone framed in architectural gold bezel on a delicate cable chain.',
      category: 'PD',
      style: 'SL',
      defaultConfig: {
        category: 'PD', style: 'SL', setting: 'BEZ', cut: 'RND',
        caratWeight: 0.50, metalPurity: '18K', metalColor: 'YG',
        stone: 'WLD', orientation: 'NS', stoneCount: 1, quantity: 1, chainLength: 18
      },
      baseCraftsmanshipFee: 420,
      availableMetals: ['9K', '14K', '18K', 'PT950'],
      availableMetalColors: ['YG', 'WG', 'RG'],
      availableStones: ['WLD', 'NTD', 'SAP', 'EMR', 'RBY', 'AQM'],
      availableCuts: ['RND', 'OV', 'EMC', 'PR'],
      availableSettings: ['BEZ', 'CLW', 'COL'],
      availableCaratWeights: [0.35, 0.5, 0.75, 1.0, 1.5],
      metalWeightGrams: 2.4,
      tags: ['pendants', 'solitaire', 'minimalist'],
      isBestseller: true,
      imagePlaceholderColor: '#C8BEAF'
    },
    {
      id: 'pd-geo-ht-006',
      slug: 'georgian-heart-pendant',
      name: 'Georgian Heart Pendant',
      shortDescription: 'Romantic heart cut stone cradled in collet claws with hand-chased reverse detailing.',
      category: 'PD',
      style: 'SL',
      defaultConfig: {
        category: 'PD', style: 'SL', setting: 'COL', cut: 'HT',
        caratWeight: 0.75, metalPurity: '18K', metalColor: 'YG',
        stone: 'RBY', orientation: 'NS', stoneCount: 1, quantity: 1, chainLength: 18
      },
      baseCraftsmanshipFee: 460,
      availableMetals: ['9K', '14K', '18K'],
      availableMetalColors: ['YG', 'WG', 'RG'],
      availableStones: ['WLD', 'RBY', 'EMR', 'SAP', 'MRG'],
      availableCuts: ['HT', 'OV', 'RND'],
      availableSettings: ['COL', 'BEZ', 'CLW'],
      availableCaratWeights: [0.5, 0.75, 1.0, 1.5],
      metalWeightGrams: 3.1,
      tags: ['pendants', 'heart', 'georgian'],
      isNew: true,
      imagePlaceholderColor: '#B0A294'
    },
    {
      id: 'pd-ew-emc-007',
      slug: 'east-west-emerald-cut-pendant',
      name: 'East-West Emerald Cut Pendant',
      shortDescription: 'Horizontally oriented step-cut gemstone in an architectural open-back frame.',
      category: 'PD',
      style: 'SL',
      defaultConfig: {
        category: 'PD', style: 'SL', setting: 'BAR', cut: 'EMC',
        caratWeight: 1.00, metalPurity: '18K', metalColor: 'YG',
        stone: 'EMR', orientation: 'EW', stoneCount: 1, quantity: 1, chainLength: 18
      },
      baseCraftsmanshipFee: 510,
      availableMetals: ['14K', '18K', 'PT950'],
      availableMetalColors: ['YG', 'WG', 'RG', 'PT'],
      availableStones: ['WLD', 'EMR', 'SAP', 'AQM'],
      availableCuts: ['EMC', 'OV', 'MQ'],
      availableSettings: ['BAR', 'BEZ', 'CLW'],
      availableCaratWeights: [0.75, 1.0, 1.5, 2.0],
      metalWeightGrams: 3.6,
      tags: ['pendants', 'east-west', 'modern'],
      imagePlaceholderColor: '#B5A99B'
    },
    {
      id: 'pd-lt-md-008',
      slug: 'locket-medallion-pendant',
      name: 'Locket Medallion Pendant',
      shortDescription: 'Substantial solid gold hinged medallion with central star-set gemstone.',
      category: 'PD',
      style: 'MD',
      defaultConfig: {
        category: 'PD', style: 'MD', setting: 'COL', cut: 'RND',
        caratWeight: 0.35, metalPurity: '18K', metalColor: 'YG',
        stone: 'WLD', orientation: 'NS', stoneCount: 1, quantity: 1, chainLength: 20
      },
      baseCraftsmanshipFee: 620,
      availableMetals: ['9K', '14K', '18K'],
      availableMetalColors: ['YG', 'WG', 'RG'],
      availableStones: ['WLD', 'NTD', 'SAP', 'EMR', 'RBY', 'OPA'],
      availableCuts: ['RND', 'OV', 'HT'],
      availableSettings: ['COL', 'BEZ'],
      availableCaratWeights: [0.25, 0.35, 0.5],
      metalWeightGrams: 6.8,
      tags: ['pendants', 'locket', 'medallion'],
      imagePlaceholderColor: '#A59B8D'
    },
    {
      id: 'er-rnd-st-009',
      slug: 'round-brilliant-studs',
      name: 'Round Brilliant Studs',
      shortDescription: 'Pair of master-cut matching gemstones in low-profile martini or four-prong baskets.',
      category: 'ER',
      style: 'ST',
      defaultConfig: {
        category: 'ER', style: 'ST', setting: 'CLW', cut: 'RND',
        caratWeight: 1.00, metalPurity: '18K', metalColor: 'WG',
        stone: 'WLD', orientation: 'NS', stoneCount: 2, quantity: 1
      },
      baseCraftsmanshipFee: 380,
      availableMetals: ['9K', '14K', '18K', 'PT950'],
      availableMetalColors: ['YG', 'WG', 'RG', 'PT'],
      availableStones: ['WLD', 'NTD', 'SAP', 'EMR', 'RBY'],
      availableCuts: ['RND', 'CU', 'AS'],
      availableSettings: ['CLW', 'BEZ'],
      availableCaratWeights: [0.5, 0.75, 1.0, 1.5, 2.0],
      metalWeightGrams: 1.8,
      tags: ['earrings', 'studs', 'essentials'],
      isBestseller: true,
      imagePlaceholderColor: '#C4B9AA'
    },
    {
      id: 'er-ov-dr-010',
      slug: 'oval-drop-earrings',
      name: 'Oval Drop Earrings',
      shortDescription: 'Articulated drops with bezel-set accent stones leading to brilliant-cut ovals.',
      category: 'ER',
      style: 'DR',
      defaultConfig: {
        category: 'ER', style: 'DR', setting: 'BEZ', cut: 'OV',
        caratWeight: 1.50, metalPurity: '18K', metalColor: 'YG',
        stone: 'SAP', orientation: 'NS', stoneCount: 4, quantity: 1
      },
      baseCraftsmanshipFee: 580,
      availableMetals: ['14K', '18K', 'PT950'],
      availableMetalColors: ['YG', 'WG', 'RG'],
      availableStones: ['WLD', 'SAP', 'EMR', 'RBY', 'AQM'],
      availableCuts: ['OV', 'EMC', 'PR'],
      availableSettings: ['BEZ', 'CLW', 'COL'],
      availableCaratWeights: [1.0, 1.5, 2.0],
      metalWeightGrams: 3.8,
      tags: ['earrings', 'drops', 'evening'],
      isNew: true,
      imagePlaceholderColor: '#BFB3A3'
    },
    {
      id: 'br-tn-rnd-011',
      slug: 'tennis-bracelet',
      name: 'Tennis Bracelet',
      shortDescription: 'A continuous line of articulated links with precision-matched lab diamonds.',
      category: 'BR',
      style: 'TN',
      defaultConfig: {
        category: 'BR', style: 'TN', setting: 'CHN', cut: 'RND',
        caratWeight: 3.00, metalPurity: '18K', metalColor: 'WG',
        stone: 'WLD', orientation: 'NS', stoneCount: 45, quantity: 1
      },
      baseCraftsmanshipFee: 1100,
      availableMetals: ['14K', '18K', 'PT950'],
      availableMetalColors: ['YG', 'WG', 'RG', 'PT'],
      availableStones: ['WLD', 'SAP', 'EMR', 'RBY'],
      availableCuts: ['RND', 'EMC', 'PR'],
      availableSettings: ['CHN', 'BEZ', 'BAR'],
      availableCaratWeights: [2.0, 3.0, 4.0, 5.0],
      metalWeightGrams: 10.5,
      tags: ['bracelets', 'tennis', 'high-jewelry'],
      isBestseller: true,
      imagePlaceholderColor: '#B7AC9D'
    },
    {
      id: 'br-sl-bez-012',
      slug: 'sliding-bezel-bangle',
      name: 'Sliding Bezel Bangle',
      shortDescription: 'Solid gold oval bangle with flush-moving bezel stones and concealed closure.',
      category: 'BR',
      style: 'SL',
      defaultConfig: {
        category: 'BR', style: 'SL', setting: 'BEZ', cut: 'OV',
        caratWeight: 0.75, metalPurity: '18K', metalColor: 'YG',
        stone: 'WLD', orientation: 'EW', stoneCount: 3, quantity: 1
      },
      baseCraftsmanshipFee: 780,
      availableMetals: ['14K', '18K'],
      availableMetalColors: ['YG', 'WG', 'RG'],
      availableStones: ['WLD', 'NTD', 'SAP', 'EMR', 'RBY'],
      availableCuts: ['OV', 'RND', 'EMC'],
      availableSettings: ['BEZ', 'BAR'],
      availableCaratWeights: [0.5, 0.75, 1.0],
      metalWeightGrams: 12.0,
      tags: ['bracelets', 'bangle', 'sculptural'],
      imagePlaceholderColor: '#AFA496'
    }
  ];

  for (const item of catalog) {
    await prisma.baseProduct.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        category: item.category,
        style: item.style,
        shortDescription: item.shortDescription,
        baseCraftsmanshipFee: item.baseCraftsmanshipFee,
        metalWeightGrams: item.metalWeightGrams,
        availableMetals: item.availableMetals,
        availableMetalColors: item.availableMetalColors,
        availableStones: item.availableStones,
        availableCuts: item.availableCuts,
        availableSettings: item.availableSettings,
        availableCaratWeights: item.availableCaratWeights,
        defaultConfig: item.defaultConfig,
        imagePlaceholderColor: item.imagePlaceholderColor,
        tags: item.tags,
        isBestseller: item.isBestseller ?? false,
        isNew: item.isNew ?? false,
        isActive: true
      },
      create: {
        id: item.id,
        slug: item.slug,
        name: item.name,
        category: item.category,
        style: item.style,
        shortDescription: item.shortDescription,
        baseCraftsmanshipFee: item.baseCraftsmanshipFee,
        metalWeightGrams: item.metalWeightGrams,
        availableMetals: item.availableMetals,
        availableMetalColors: item.availableMetalColors,
        availableStones: item.availableStones,
        availableCuts: item.availableCuts,
        availableSettings: item.availableSettings,
        availableCaratWeights: item.availableCaratWeights,
        defaultConfig: item.defaultConfig,
        imagePlaceholderColor: item.imagePlaceholderColor,
        tags: item.tags,
        isBestseller: item.isBestseller ?? false,
        isNew: item.isNew ?? false,
        isActive: true
      }
    });
  }

  // 5. Sample Saved Designs for Demo Customer
  await prisma.savedDesign.deleteMany();
  await prisma.savedDesign.create({
    data: {
      id: 'sd-001',
      productId: 'rg-sig-5s-001',
      productName: 'Signature 5-Stone Ring',
      sku: 'RG-5S-CLW-OV-10018YG-WLD',
      config: {
        category: 'RG', style: '5S', setting: 'CLW', cut: 'OV',
        caratWeight: 1.0, metalPurity: '18K', metalColor: 'YG',
        stone: 'WLD', orientation: 'NS', stoneCount: 5, quantity: 1,
        ringSize: 'N', authorHandle: '@indiemoxley'
      },
      priceUSD: 5840.0,
      authorHandle: '@indiemoxley',
      shareUrl: 'https://heirest.com/configure/signature-5-stone-ring?sku=RG-5S-CLW-OV-10018YG-WLD',
      notes: 'Anniversary gift idea — 18k YG with oval cuts',
      isPublic: true,
      userId: demoCustomer.id
    }
  });

  await prisma.savedDesign.create({
    data: {
      id: 'sd-002',
      productId: 'pd-bez-sl-005',
      productName: 'Bezel Solitaire Pendant',
      sku: 'PD-SL-BEZ-RND-07518WG-SAP',
      config: {
        category: 'PD', style: 'SL', setting: 'BEZ', cut: 'RND',
        caratWeight: 0.75, metalPurity: '18K', metalColor: 'WG',
        stone: 'SAP', orientation: 'NS', stoneCount: 1, quantity: 1,
        chainLength: 18, authorHandle: '@indiemoxley'
      },
      priceUSD: 1920.0,
      authorHandle: '@indiemoxley',
      shareUrl: 'https://heirest.com/configure/bezel-solitaire-pendant?sku=PD-SL-BEZ-RND-07518WG-SAP',
      notes: 'Birthday — sapphire in white gold, 18" chain',
      isPublic: false,
      userId: demoCustomer.id
    }
  });

  // 6. Active 8-Stage Orders
  await prisma.vaultItem.deleteMany();
  await prisma.order.deleteMany();

  const stagesTimeline1 = [
    { stage: 'specs_locked', label: '01. Specs Locked', description: 'Your configuration has been confirmed.', isPending: false, isActive: false, completedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
    { stage: 'cad_approval', label: '02. 3D CAD Render Approval', description: 'Review precision 3D CAD render.', isPending: false, isActive: true, requiresApproval: true },
    { stage: 'metal_casting', label: '03. Metal Casting', description: 'Casting in solid gold.', isPending: true, isActive: false },
    { stage: 'stone_selection', label: '04. Hand-Picked Stone Selection', description: 'Curated gemologist selection.', isPending: true, isActive: false },
    { stage: 'master_setting', label: '05. Master Setting', description: 'Precision hand-setting.', isPending: true, isActive: false },
    { stage: 'hand_polishing', label: '06. Hand Polishing', description: 'Mirror polish finish.', isPending: true, isActive: false },
    { stage: 'quality_control', label: '07. 8-Point Quality Control', description: 'Independent inspection.', isPending: true, isActive: false },
    { stage: 'dispatched', label: '08. Insured DHL Express Dispatch', description: 'DHL Express courier.', isPending: true, isActive: false }
  ];

  const order1 = await prisma.order.create({
    data: {
      id: 'ord-2025-0938',
      orderNumber: 'HRS-2025-0938',
      userId: demoCustomer.id,
      totalAmount: 9240.0,
      currency: 'USD',
      currentStage: OrderStage.CAD_APPROVAL,
      stages: stagesTimeline1,
      shippingAddress: {
        name: 'India Moxley',
        line1: '42 Balmoral Avenue',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2041',
        country: 'Australia'
      },
      cadRenderApproved: false,
      cadRenderUrl: 'https://heirest.com/cad-renders/ord-2025-0938',
      estimatedCompletionDate: new Date(Date.now() + 9 * 86400000),
      items: [
        {
          id: 'ci-001',
          productId: 'rg-bez-et-003',
          sku: 'RG-ET-BEZ-RND-15018WG-WLD',
          priceUSD: 9240,
          quantity: 1,
          config: {
            category: 'RG', style: 'ET', setting: 'BEZ', cut: 'RND',
            caratWeight: 1.5, metalPurity: '18K', metalColor: 'WG',
            stone: 'WLD', orientation: 'NS', stoneCount: 14, quantity: 1, ringSize: 'M'
          }
        }
      ]
    }
  });

  const stagesTimeline2 = [
    { stage: 'specs_locked', label: '01. Specs Locked', description: 'Done', isPending: false, isActive: false, completedAt: new Date(Date.now() - 40 * 86400000).toISOString() },
    { stage: 'cad_approval', label: '02. 3D CAD Render Approval', description: 'Approved', isPending: false, isActive: false, completedAt: new Date(Date.now() - 35 * 86400000).toISOString() },
    { stage: 'metal_casting', label: '03. Metal Casting', description: 'Casting done', isPending: false, isActive: false, completedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { stage: 'stone_selection', label: '04. Hand-Picked Stone Selection', description: 'Selected', isPending: false, isActive: false, completedAt: new Date(Date.now() - 25 * 86400000).toISOString() },
    { stage: 'master_setting', label: '05. Master Setting', description: 'Set', isPending: false, isActive: false, completedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
    { stage: 'hand_polishing', label: '06. Hand Polishing', description: 'Polished', isPending: false, isActive: false, completedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
    { stage: 'quality_control', label: '07. 8-Point Quality Control', description: 'Passed', isPending: false, isActive: false, completedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
    { stage: 'dispatched', label: '08. Insured DHL Express Dispatch', description: 'Dispatched via DHL', isPending: false, isActive: true, completedAt: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];

  const order2 = await prisma.order.create({
    data: {
      id: 'ord-2025-0721',
      orderNumber: 'HRS-2025-0721',
      userId: demoCustomer.id,
      totalAmount: 6980.0,
      currency: 'USD',
      currentStage: OrderStage.DISPATCHED,
      stages: stagesTimeline2,
      shippingAddress: {
        name: 'India Moxley',
        line1: '42 Balmoral Avenue',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2041',
        country: 'Australia'
      },
      cadRenderApproved: true,
      trackingNumber: 'DHL-1Z999AA10123456784',
      estimatedCompletionDate: new Date(Date.now() - 2 * 86400000),
      items: [
        {
          id: 'ci-002',
          productId: 'rg-sig-5s-001',
          sku: 'RG-5S-CLW-OV-12518RG-WLD',
          priceUSD: 6980,
          quantity: 1,
          config: {
            category: 'RG', style: '5S', setting: 'CLW', cut: 'OV',
            caratWeight: 1.25, metalPurity: '18K', metalColor: 'RG',
            stone: 'WLD', orientation: 'NS', stoneCount: 5, quantity: 1, ringSize: 'O',
            engraving: 'Always & Forever'
          }
        }
      ]
    }
  });

  // 7. Digital Vault Certificates
  await prisma.vaultItem.create({
    data: {
      id: 'vi-001',
      certificateNumber: 'HRS-CERT-2025-0472',
      orderId: order2.id,
      userId: demoCustomer.id,
      productId: 'rg-sig-5s-001',
      productName: 'Signature 5-Stone Ring',
      sku: 'RG-5S-CLW-OV-10018YG-WLD',
      priceUSD: 5840.0,
      insuranceValuation: 7200.0,
      resizingUsed: false,
      config: {
        category: 'RG', style: '5S', setting: 'CLW', cut: 'OV',
        caratWeight: 1.0, metalPurity: '18K', metalColor: 'YG',
        stone: 'WLD', orientation: 'NS', stoneCount: 5, quantity: 1, ringSize: 'N'
      },
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
        measurements: '7.35 × 5.48 × 3.52 mm'
      },
      inspectionDue: new Date(Date.now() + 185 * 86400000),
      purchasedAt: new Date(Date.now() - 180 * 86400000)
    }
  });

  await prisma.vaultItem.create({
    data: {
      id: 'vi-002',
      certificateNumber: 'HRS-CERT-2024-1189',
      userId: demoCustomer.id,
      productId: 'pd-bez-sl-005',
      productName: 'Bezel Solitaire Pendant',
      sku: 'PD-SL-BEZ-RND-05018WG-WLD',
      priceUSD: 1640.0,
      insuranceValuation: 2100.0,
      resizingUsed: false,
      config: {
        category: 'PD', style: 'SL', setting: 'BEZ', cut: 'RND',
        caratWeight: 0.5, metalPurity: '18K', metalColor: 'WG',
        stone: 'WLD', orientation: 'NS', stoneCount: 1, quantity: 1, chainLength: 18
      },
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
        measurements: '5.15 × 5.13 × 3.15 mm'
      },
      inspectionDue: new Date(Date.now() + 365 * 86400000),
      purchasedAt: new Date(Date.now() - 420 * 86400000)
    }
  });

  console.log('✅ Seed complete: 1 Admin, 1 Demo Customer, 12 Products, Pricing Matrix, Storefront CMS, Saved Designs, Orders & Vault Pieces.');
}

if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
