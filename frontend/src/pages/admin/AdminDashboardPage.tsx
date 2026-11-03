import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, TrendingUp, Inbox, Globe,
  Plus, Edit3, Trash2, Copy, ToggleLeft, ToggleRight,
  Search, X, Save, AlertCircle,
  DollarSign, Gem, Scissors, ArrowRight, ArrowUpRight, CheckCircle, ChevronRight,
  Shield, Truck, FlaskConical, Award, ImageIcon, Settings, Eye,
  BarChart3, Users, Star, CreditCard,
} from 'lucide-react';
import { useJewelryStore, STAGE_ORDER, STAGE_LABELS } from '../../store/useJewelryStore';
import { adminApi } from '../../services/api';
import { calculatePriceUSDWithRates } from '../../store/useJewelryStore';
import type {
  JewelryProduct,
  MetalPurity,
  MetalColor,
  StoneType,
  StoneCut,
  SettingStyle,
  JewelryCategory,
  JewelryStyle,
  OrderStage,
  PricingRates,
} from '../../types/jewelry';

// ── Design Tokens ─────────────────────────────────────────────
const ADMIN_BG = '#0D0C0B';
const ADMIN_SURFACE = '#141413';
const ADMIN_PANEL = '#1C1B19';
const ADMIN_BORDER = 'rgba(197,168,128,0.12)';
const ADMIN_CHAMPAGNE = '#C5A880';
const ADMIN_STONE = '#8A867E';
const ADMIN_SUCCESS = '#2D8A5A';
const ADMIN_DANGER = '#CC2244';

// ── Sidebar nav items ─────────────────────────────────────────
type AdminTab = 'overview' | 'catalog' | 'pricing' | 'orders' | 'cms';

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { id: 'catalog', label: 'Jewelry Catalog', icon: <Package size={15} /> },
  { id: 'pricing', label: 'Pricing Matrix', icon: <TrendingUp size={15} /> },
  { id: 'orders', label: 'Order Pipeline', icon: <Inbox size={15} /> },
  { id: 'cms', label: 'Storefront CMS', icon: <Globe size={15} /> },
];

// ── Lookup maps ───────────────────────────────────────────────
const METAL_OPTIONS: { value: MetalPurity; label: string }[] = [
  { value: '9K', label: '9K Yellow Gold' },
  { value: '14K', label: '14K Gold' },
  { value: '18K', label: '18K Gold' },
  { value: 'PT950', label: 'Platinum 950' },
];
const METAL_COLOR_OPTIONS: { value: MetalColor; label: string }[] = [
  { value: 'YG', label: 'Yellow Gold' },
  { value: 'WG', label: 'White Gold' },
  { value: 'RG', label: 'Rose Gold' },
  { value: 'PT', label: 'Platinum' },
];
const STONE_OPTIONS: { value: StoneType; label: string }[] = [
  { value: 'WLD', label: 'White Lab Diamond' },
  { value: 'NTD', label: 'Natural Diamond' },
  { value: 'SAP', label: 'Ceylon Sapphire' },
  { value: 'EMR', label: 'Zambian Emerald' },
  { value: 'RBY', label: 'Ruby' },
  { value: 'AQM', label: 'Aquamarine' },
  { value: 'MRG', label: 'Morganite' },
  { value: 'OPA', label: 'Opal' },
];
const CUT_OPTIONS: { value: StoneCut; label: string }[] = [
  { value: 'RND', label: 'Round Brilliant' },
  { value: 'OV', label: 'Oval' },
  { value: 'EMC', label: 'Emerald Cut' },
  { value: 'PR', label: 'Pear' },
  { value: 'HT', label: 'Heart' },
  { value: 'MQ', label: 'Marquise' },
  { value: 'CU', label: 'Cushion' },
  { value: 'AS', label: 'Asscher' },
];
const SETTING_OPTIONS: { value: SettingStyle; label: string }[] = [
  { value: 'CLW', label: 'Claw / Prong' },
  { value: 'BEZ', label: 'Bezel' },
  { value: 'COL', label: 'Collet' },
  { value: 'PAV', label: 'Pavé' },
  { value: 'CHN', label: 'Channel' },
  { value: 'BAR', label: 'Bar' },
];
const CATEGORY_OPTIONS: { value: JewelryCategory; label: string }[] = [
  { value: 'RG', label: 'Rings' },
  { value: 'PD', label: 'Pendants' },
  { value: 'ER', label: 'Earrings' },
  { value: 'BR', label: 'Bracelets' },
  { value: 'NK', label: 'Necklaces' },
];
const STYLE_OPTIONS: { value: JewelryStyle; label: string }[] = [
  { value: '5S', label: '5-Stone' },
  { value: 'SL', label: 'Solitaire' },
  { value: 'ET', label: 'Eternity' },
  { value: 'SG', label: 'Signet' },
  { value: 'LT', label: 'Letter / Medallion' },
  { value: 'MD', label: 'Modern' },
  { value: 'ST', label: 'Stud' },
  { value: 'DR', label: 'Drop' },
  { value: 'HG', label: 'Huggie' },
  { value: 'TN', label: 'Tennis' },
];

// ─────────────────────────────────────────────────────────────
// Shared admin input styles
// ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: `1px solid ${ADMIN_BORDER}`,
  borderRadius: 2,
  color: '#F3F1EC',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.78rem',
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
};
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: ADMIN_STONE,
  display: 'block',
  marginBottom: 6,
};
const btnPrimaryStyle: React.CSSProperties = {
  backgroundColor: ADMIN_CHAMPAGNE,
  color: ADMIN_BG,
  border: 'none',
  padding: '8px 20px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};
const btnSecondaryStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: ADMIN_STONE,
  border: `1px solid ${ADMIN_BORDER}`,
  padding: '8px 16px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

// ─────────────────────────────────────────────────────────────
// Main Admin Dashboard
// ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { authUser } = useJewelryStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Read ?tab= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as AdminTab | null;
    if (tab && NAV_ITEMS.some((n) => n.id === tab)) setActiveTab(tab);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: ADMIN_BG, fontFamily: 'var(--font-mono)' }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          backgroundColor: ADMIN_SURFACE,
          borderRight: `1px solid ${ADMIN_BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Logo area */}
        <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${ADMIN_BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Shield size={14} style={{ color: ADMIN_CHAMPAGNE }} />
            <span style={{ color: ADMIN_CHAMPAGNE, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Admin Console</span>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#F3F1EC', fontWeight: 300 }}>Heirest</div>
          <div style={{ fontSize: '0.55rem', color: ADMIN_STONE, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {authUser?.authorHandle} · Master Jeweller
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '16px 0', flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                background: activeTab === item.id ? `rgba(197,168,128,0.10)` : 'transparent',
                border: 'none',
                borderLeft: activeTab === item.id ? `2px solid ${ADMIN_CHAMPAGNE}` : '2px solid transparent',
                color: activeTab === item.id ? ADMIN_CHAMPAGNE : ADMIN_STONE,
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${ADMIN_BORDER}`, fontSize: '0.55rem', color: ADMIN_STONE }}>
          HEIREST ADMIN v2.0 · BUILD 2026
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewModule onTabChange={setActiveTab} />}
            {activeTab === 'catalog' && <CatalogManager />}
            {activeTab === 'pricing' && <PricingMatrixManager />}
            {activeTab === 'orders' && <OrderPipelineManager />}
            {activeTab === 'cms' && <StorefrontCmsManager />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Module 1: Executive Overview
// ─────────────────────────────────────────────────────────────
function OverviewModule({ onTabChange }: { onTabChange: (tab: AdminTab) => void }) {
  const { orders, catalog, savedDesigns, vaultItems, communityDesigns } = useJewelryStore();

  const totalRevenue = orders.reduce((s, o) => s + o.totalUSD, 0);
  const activeOrders = orders.filter(
    (o) => o.currentStage !== 'dispatched' && o.currentStage !== 'specs_locked'
  ).length;
  const sizingKitsSold = 127; // mock
  const communityTotal = communityDesigns.length;

  const kpis = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      sub: `From ${orders.length} bespoke orders`,
      icon: <DollarSign size={18} style={{ color: ADMIN_CHAMPAGNE }} />,
      color: ADMIN_CHAMPAGNE,
    },
    {
      label: 'Active In Production',
      value: String(activeOrders),
      sub: `Orders across stages 2–7`,
      icon: <Gem size={18} style={{ color: '#6AC8E8' }} />,
      color: '#6AC8E8',
    },
    {
      label: 'Sizing Kits Sold',
      value: String(sizingKitsSold),
      sub: `${Math.round((sizingKitsSold / 312) * 100)}% conversion to bespoke`,
      icon: <BarChart3 size={18} style={{ color: '#8AC88A' }} />,
      color: '#8AC88A',
    },
    {
      label: 'Community Designs',
      value: String(savedDesigns.length + communityTotal),
      sub: `${vaultItems.length} vault items authenticated`,
      icon: <Star size={18} style={{ color: '#E8B86A' }} />,
      color: '#E8B86A',
    },
  ];

  return (
    <div>
      <PageHeader title="Executive Overview" subtitle="Real-time store intelligence & operations hub" />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, padding: '20px 24px', borderRadius: 2 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              {kpi.icon}
              <ArrowUpRight size={12} style={{ color: ADMIN_STONE }} />
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#F3F1EC', fontWeight: 300 }}>{kpi.value}</div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: kpi.color, marginTop: 2, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: '0.62rem', color: ADMIN_STONE }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Orders */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2 }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${ADMIN_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: ADMIN_STONE }}>Recent Orders</span>
            <button onClick={() => onTabChange('orders')} style={{ ...btnSecondaryStyle, padding: '4px 10px', fontSize: '0.58rem' }}>
              View All <ArrowRight size={10} />
            </button>
          </div>
          <div style={{ padding: 0 }}>
            {orders.map((order, i) => (
              <div key={order.id} style={{ padding: '12px 24px', borderBottom: i < orders.length - 1 ? `1px solid ${ADMIN_BORDER}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#F3F1EC', marginBottom: 2 }}>{order.orderNumber}</div>
                  <div style={{ fontSize: '0.6rem', color: ADMIN_STONE }}>{STAGE_LABELS[order.currentStage]?.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: ADMIN_CHAMPAGNE }}>${order.totalUSD.toLocaleString()}</div>
                  <StagePill stage={order.currentStage} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2 }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${ADMIN_BORDER}` }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: ADMIN_STONE }}>Quick Actions</span>
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: '+ Add New Jewelry Model', tab: 'catalog' as AdminTab, icon: <Plus size={13} /> },
              { label: 'Update Gold Spot Rate', tab: 'pricing' as AdminTab, icon: <TrendingUp size={13} /> },
              { label: 'Advance Order Stage', tab: 'orders' as AdminTab, icon: <ChevronRight size={13} /> },
              { label: 'Edit Homepage Hero', tab: 'cms' as AdminTab, icon: <Globe size={13} /> },
              { label: 'Curate Community Designs', tab: 'cms' as AdminTab, icon: <Star size={13} /> },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => onTabChange(action.tab)}
                style={{
                  ...btnSecondaryStyle,
                  justifyContent: 'space-between',
                  borderColor: ADMIN_BORDER,
                  padding: '12px 16px',
                  fontSize: '0.68rem',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{action.icon}{action.label}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog summary */}
      <div style={{ marginTop: 24, backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: '16px 24px' }}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: ADMIN_STONE }}>
          Catalog Summary — {catalog.length} Products
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 16 }}>
          {(['RG', 'PD', 'ER', 'BR', 'NK'] as const).map((cat) => {
            const count = catalog.filter((p) => p.category === cat).length;
            const names = { RG: 'Rings', PD: 'Pendants', ER: 'Earrings', BR: 'Bracelets', NK: 'Necklaces' };
            return (
              <div key={cat} style={{ textAlign: 'center', padding: '12px 8px', border: `1px solid ${ADMIN_BORDER}` }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#F3F1EC' }}>{count}</div>
                <div style={{ fontSize: '0.58rem', color: ADMIN_STONE, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{names[cat]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Module 2: Catalog Manager
// ─────────────────────────────────────────────────────────────
function CatalogManager() {
  const { catalog, adminAddProduct, adminUpdateProduct, adminDeleteProduct, adminToggleProductStatus } = useJewelryStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<JewelryCategory | 'ALL'>('ALL');
  const [editingProduct, setEditingProduct] = useState<JewelryProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() =>
    catalog.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search);
      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchSearch && matchCat;
    }),
    [catalog, search, categoryFilter]
  );

  const handleDuplicate = (product: JewelryProduct) => {
    const dup: JewelryProduct = {
      ...product,
      id: `prod-dup-${Date.now()}`,
      slug: `${product.slug}-copy`,
      name: `${product.name} (Copy)`,
    };
    adminAddProduct(dup);
  };

  const handleDelete = (id: string) => {
    adminDeleteProduct(id);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <PageHeader title="Jewelry Catalog" subtitle="Build, edit and publish your bespoke product library">
        <button style={btnPrimaryStyle} onClick={() => { setEditingProduct(null); setIsCreating(true); }}>
          <Plus size={13} /> Add Jewelry Piece
        </button>
      </PageHeader>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: ADMIN_STONE }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or slug..."
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'RG', 'PD', 'ER', 'BR', 'NK'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                ...btnSecondaryStyle,
                fontSize: '0.58rem',
                padding: '6px 12px',
                backgroundColor: categoryFilter === cat ? 'rgba(197,168,128,0.15)' : 'transparent',
                color: categoryFilter === cat ? ADMIN_CHAMPAGNE : ADMIN_STONE,
                borderColor: categoryFilter === cat ? ADMIN_CHAMPAGNE : ADMIN_BORDER,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px', padding: '10px 20px', borderBottom: `1px solid ${ADMIN_BORDER}`, backgroundColor: ADMIN_PANEL }}>
          {['Product', 'Category', 'Base Labor', 'Metal Weight', 'Status', 'Actions'].map((h) => (
            <span key={h} style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: ADMIN_STONE }}>{h}</span>
          ))}
        </div>

        {filtered.map((product, i) => (
          <div
            key={product.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
              padding: '12px 20px',
              borderBottom: i < filtered.length - 1 ? `1px solid ${ADMIN_BORDER}` : 'none',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ADMIN_PANEL)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: '#F3F1EC', marginBottom: 2 }}>{product.name}</div>
              <div style={{ fontSize: '0.58rem', color: ADMIN_STONE }}>{product.slug}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.62rem', color: ADMIN_CHAMPAGNE, padding: '2px 6px', border: `1px solid rgba(197,168,128,0.3)`, borderRadius: 2 }}>
                {CATEGORY_OPTIONS.find(c => c.value === product.category)?.label ?? product.category}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#F3F1EC' }}>${product.baseCraftsmanshipFee}</div>
            <div style={{ fontSize: '0.72rem', color: '#F3F1EC' }}>{product.metalWeightGrams}g</div>
            <div>
              <button
                onClick={() => adminToggleProductStatus(product.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {(product as any).isActive !== false
                  ? <><ToggleRight size={18} style={{ color: ADMIN_SUCCESS }} /><span style={{ fontSize: '0.6rem', color: ADMIN_SUCCESS }}>Active</span></>
                  : <><ToggleLeft size={18} style={{ color: ADMIN_STONE }} /><span style={{ fontSize: '0.6rem', color: ADMIN_STONE }}>Draft</span></>
                }
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <ActionIconBtn icon={<Edit3 size={12} />} title="Edit" onClick={() => { setEditingProduct(product); setIsCreating(true); }} />
              <ActionIconBtn icon={<Copy size={12} />} title="Duplicate" onClick={() => handleDuplicate(product)} />
              <ActionIconBtn
                icon={<Trash2 size={12} />}
                title="Delete"
                onClick={() => setDeleteConfirm(product.id)}
                danger
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: ADMIN_STONE, fontSize: '0.72rem' }}>
            No products found matching your filters.
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Overlay onClose={() => setDeleteConfirm(null)}>
          <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, padding: 32, width: 420, borderRadius: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <AlertCircle size={18} style={{ color: ADMIN_DANGER }} />
              <span style={{ fontSize: '0.8rem', color: '#F3F1EC' }}>Confirm Delete</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: ADMIN_STONE, marginBottom: 24, lineHeight: 1.6 }}>
              This will permanently remove the product from the catalog and it will no longer appear on the storefront.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ ...btnPrimaryStyle, backgroundColor: ADMIN_DANGER }} onClick={() => handleDelete(deleteConfirm)}>
                Delete Product
              </button>
              <button style={btnSecondaryStyle} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Add / Edit Drawer */}
      {isCreating && (
        <ProductFormDrawer
          product={editingProduct}
          onClose={() => { setIsCreating(false); setEditingProduct(null); }}
          onSave={(p) => {
            if (editingProduct) {
              adminUpdateProduct(editingProduct.id, p);
              adminApi.updateProduct(editingProduct.id, p);
            } else {
              adminAddProduct(p);
              adminApi.createProduct(p);
            }
            setIsCreating(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Product Form Drawer ──────────────────────────────────────
function ProductFormDrawer({
  product,
  onClose,
  onSave,
}: {
  product: JewelryProduct | null;
  onClose: () => void;
  onSave: (p: JewelryProduct) => void;
}) {
  const [form, setForm] = useState<Partial<JewelryProduct>>(
    product ?? {
      name: '',
      slug: '',
      category: 'RG',
      style: '5S',
      shortDescription: '',
      baseCraftsmanshipFee: 400,
      metalWeightGrams: 3.5,
      availableMetals: ['14K', '18K'],
      availableMetalColors: ['YG', 'WG'],
      availableStones: ['WLD'],
      availableCuts: ['RND', 'OV'],
      availableSettings: ['CLW', 'BEZ'],
      availableCaratWeights: [0.5, 1.0, 1.5],
      imagePlaceholderColor: '#C5A880',
      tags: [],
      isNew: false,
      isBestseller: false,
    }
  );

  const update = (key: keyof JewelryProduct, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleArrayItem = <T,>(key: keyof JewelryProduct, val: T) => {
    const arr = (form[key] as T[]) ?? [];
    const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    update(key, next);
  };

  const skuPreview = `${form.category}-${form.style}-${form.availableCuts?.[0] ?? 'RND'}-${form.availableMetals?.[0] ?? '18K'}${form.availableMetalColors?.[0] ?? 'YG'}-${form.availableStones?.[0] ?? 'WLD'}`;

  const handleSave = () => {
    const slug = form.slug || form.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
    const product: JewelryProduct = {
      id: `prod-${Date.now()}`,
      slug,
      name: form.name ?? 'Untitled',
      shortDescription: form.shortDescription ?? '',
      category: form.category ?? 'RG',
      style: form.style ?? '5S',
      baseCraftsmanshipFee: Number(form.baseCraftsmanshipFee) || 0,
      metalWeightGrams: Number(form.metalWeightGrams) || 0,
      availableMetals: form.availableMetals ?? ['18K'],
      availableMetalColors: form.availableMetalColors ?? ['YG'],
      availableStones: form.availableStones ?? ['WLD'],
      availableCuts: form.availableCuts ?? ['RND'],
      availableSettings: form.availableSettings ?? ['CLW'],
      availableCaratWeights: form.availableCaratWeights ?? [1.0],
      imagePlaceholderColor: form.imagePlaceholderColor ?? '#C5A880',
      tags: form.tags ?? [],
      isNew: form.isNew,
      isBestseller: form.isBestseller,
      defaultConfig: {
        category: form.category ?? 'RG',
        style: form.style ?? '5S',
        setting: form.availableSettings?.[0] ?? 'CLW',
        cut: form.availableCuts?.[0] ?? 'RND',
        caratWeight: form.availableCaratWeights?.[0] ?? 1.0,
        metalPurity: form.availableMetals?.[0] ?? '18K',
        metalColor: form.availableMetalColors?.[0] ?? 'YG',
        stone: form.availableStones?.[0] ?? 'WLD',
        orientation: 'NS',
        stoneCount: 1,
        quantity: 1,
      },
    };
    onSave(product);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: 560,
        backgroundColor: ADMIN_SURFACE,
        borderLeft: `1px solid ${ADMIN_BORDER}`,
        zIndex: 100,
        overflowY: 'auto',
        boxShadow: '-32px 0 80px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: `1px solid ${ADMIN_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: ADMIN_SURFACE, zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: ADMIN_STONE, marginBottom: 2 }}>
            {product ? 'Edit' : 'New'} Jewelry Piece
          </div>
          <div style={{ fontSize: '1rem', color: '#F3F1EC', fontFamily: 'var(--font-serif)' }}>
            {form.name || 'Untitled Piece'}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ADMIN_STONE }}>
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic info */}
        <FormSection title="Basic Information">
          <FormField label="Product Name *">
            <input style={inputStyle} value={form.name ?? ''} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Georgian Bezel Pendant" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Slug (URL)">
              <input style={inputStyle} value={form.slug ?? ''} onChange={(e) => update('slug', e.target.value)} placeholder="georgian-bezel-pendant" />
            </FormField>
            <FormField label="Category">
              <select style={inputStyle} value={form.category} onChange={(e) => update('category', e.target.value as JewelryCategory)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Style">
              <select style={inputStyle} value={form.style} onChange={(e) => update('style', e.target.value as JewelryStyle)}>
                {STYLE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FormField>
            <FormField label="Image Color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.imagePlaceholderColor ?? '#C5A880'} onChange={(e) => update('imagePlaceholderColor', e.target.value)} style={{ width: 36, height: 32, border: 'none', cursor: 'pointer', borderRadius: 2 }} />
                <input style={{ ...inputStyle, flex: 1 }} value={form.imagePlaceholderColor ?? ''} onChange={(e) => update('imagePlaceholderColor', e.target.value)} />
              </div>
            </FormField>
          </div>
          <FormField label="Short Description">
            <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={form.shortDescription ?? ''} onChange={(e) => update('shortDescription', e.target.value)} placeholder="One sentence about this piece..." />
          </FormField>
        </FormSection>

        {/* Pricing */}
        <FormSection title="Pricing & Weight">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Base Labor Cost ($)">
              <input type="number" style={inputStyle} value={form.baseCraftsmanshipFee ?? ''} onChange={(e) => update('baseCraftsmanshipFee', Number(e.target.value))} placeholder="400" />
            </FormField>
            <FormField label="Metal Weight (grams)">
              <input type="number" style={inputStyle} value={form.metalWeightGrams ?? ''} onChange={(e) => update('metalWeightGrams', Number(e.target.value))} placeholder="3.5" step="0.1" />
            </FormField>
          </div>
        </FormSection>

        {/* Customization axes */}
        <FormSection title="Customization Axes">
          <CheckboxGroup
            label="Available Metals"
            options={METAL_OPTIONS}
            selected={(form.availableMetals ?? []) as string[]}
            onToggle={(v) => toggleArrayItem('availableMetals', v as MetalPurity)}
          />
          <CheckboxGroup
            label="Metal Colors"
            options={METAL_COLOR_OPTIONS}
            selected={(form.availableMetalColors ?? []) as string[]}
            onToggle={(v) => toggleArrayItem('availableMetalColors', v as MetalColor)}
          />
          <CheckboxGroup
            label="Stone Types"
            options={STONE_OPTIONS}
            selected={(form.availableStones ?? []) as string[]}
            onToggle={(v) => toggleArrayItem('availableStones', v as StoneType)}
          />
          <CheckboxGroup
            label="Stone Cuts"
            options={CUT_OPTIONS}
            selected={(form.availableCuts ?? []) as string[]}
            onToggle={(v) => toggleArrayItem('availableCuts', v as StoneCut)}
          />
          <CheckboxGroup
            label="Setting Styles"
            options={SETTING_OPTIONS}
            selected={(form.availableSettings ?? []) as string[]}
            onToggle={(v) => toggleArrayItem('availableSettings', v as SettingStyle)}
          />
        </FormSection>

        {/* Tags */}
        <FormSection title="Metadata">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.isNew} onChange={(e) => update('isNew', e.target.checked)} style={{ accentColor: ADMIN_CHAMPAGNE }} />
              <span style={{ fontSize: '0.68rem', color: '#F3F1EC' }}>Mark as New</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.isBestseller} onChange={(e) => update('isBestseller', e.target.checked)} style={{ accentColor: ADMIN_CHAMPAGNE }} />
              <span style={{ fontSize: '0.68rem', color: '#F3F1EC' }}>Bestseller Badge</span>
            </label>
          </div>
        </FormSection>

        {/* SKU Preview */}
        <div style={{ backgroundColor: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}`, padding: '12px 16px', borderRadius: 2 }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Live SKU Preview</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: ADMIN_CHAMPAGNE, letterSpacing: '0.1em' }}>{skuPreview}</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: `1px solid ${ADMIN_BORDER}` }}>
          <button style={btnPrimaryStyle} onClick={handleSave}>
            <Save size={13} /> {product ? 'Save Changes' : 'Create Product'}
          </button>
          <button style={btnSecondaryStyle} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Module 3: Pricing Matrix Manager
// ─────────────────────────────────────────────────────────────
function PricingMatrixManager() {
  const { pricingRates, adminUpdatePricingRates } = useJewelryStore();
  const [draft, setDraft] = useState<PricingRates>(JSON.parse(JSON.stringify(pricingRates)));
  const [saved, setSaved] = useState(false);

  const updateMetal = (key: keyof PricingRates['metalPurityRate'], val: number) =>
    setDraft((d) => ({ ...d, metalPurityRate: { ...d.metalPurityRate, [key]: val } }));

  const updateStone = (key: keyof PricingRates['stoneTypeRate'], val: number) =>
    setDraft((d) => ({ ...d, stoneTypeRate: { ...d.stoneTypeRate, [key]: val } }));

  const updateCut = (key: keyof PricingRates['cutPremiumMultiplier'], val: number) =>
    setDraft((d) => ({ ...d, cutPremiumMultiplier: { ...d.cutPremiumMultiplier, [key]: val } }));

  // Simulator: 1.0ct 14K Yellow Gold Ring, base fee $400, weight 4.2g
  const simConfig = useMemo(() => ({
    category: 'RG' as const, style: '5S' as const, setting: 'CLW' as const, cut: 'RND' as const,
    caratWeight: 1.0, metalPurity: '14K' as const, metalColor: 'YG' as const, stone: 'WLD' as const,
    orientation: 'NS' as const, stoneCount: 1, quantity: 1,
  }), []);
  const livePrice = calculatePriceUSDWithRates(simConfig, 400, 4.2, draft);
  const originalPrice = calculatePriceUSDWithRates(simConfig, 400, 4.2, pricingRates);
  const priceDelta = livePrice - originalPrice;

  const handlePublish = async () => {
    adminUpdatePricingRates(draft);
    await adminApi.updatePricingMatrix(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <PageHeader title="Pricing Matrix" subtitle="Control the global pricing engine — changes reflect instantly across all configurators">
        <button style={btnPrimaryStyle} onClick={handlePublish}>
          {saved ? <><CheckCircle size={13} /> Published!</> : <><Save size={13} /> Publish New Pricing Matrix</>}
        </button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Metal Rates */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
          <SectionTitle icon={<Gem size={14} />}>Metal Rates ($ per gram)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            {([
              { key: '9K' as const, label: '9K Yellow Gold (37.5%)' },
              { key: '14K' as const, label: '14K Gold (58.3%)' },
              { key: '18K' as const, label: '18K Gold (75%)' },
              { key: 'PT950' as const, label: 'Platinum 950' },
            ]).map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 1, fontSize: '0.72rem', color: '#F3F1EC' }}>{label}</span>
                <span style={{ fontSize: '0.62rem', color: ADMIN_STONE }}>$/g</span>
                <input
                  type="number"
                  value={draft.metalPurityRate[key]}
                  onChange={(e) => updateMetal(key, Number(e.target.value))}
                  style={{ ...inputStyle, width: 80, textAlign: 'right' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gemstone Rates */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
          <SectionTitle icon={<FlaskConical size={14} />}>Gemstone Rates ($ per carat)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            {([
              { key: 'WLD' as const, label: 'Lab-Grown Diamond (D-F, VS2+)' },
              { key: 'NTD' as const, label: 'Natural Diamond' },
              { key: 'SAP' as const, label: 'Ceylon Sapphire' },
              { key: 'EMR' as const, label: 'Zambian Emerald' },
              { key: 'RBY' as const, label: 'Ruby' },
            ]).map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 1, fontSize: '0.72rem', color: '#F3F1EC' }}>{label}</span>
                <span style={{ fontSize: '0.62rem', color: ADMIN_STONE }}>$/ct</span>
                <input
                  type="number"
                  value={draft.stoneTypeRate[key]}
                  onChange={(e) => updateStone(key, Number(e.target.value))}
                  style={{ ...inputStyle, width: 80, textAlign: 'right' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Cut Multipliers */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
          <SectionTitle icon={<Scissors size={14} />}>Stone Cut Premium Multipliers</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            {([
              { key: 'RND' as const, label: 'Round Brilliant' },
              { key: 'OV' as const, label: 'Oval' },
              { key: 'EMC' as const, label: 'Emerald Cut' },
              { key: 'HT' as const, label: 'Heart' },
              { key: 'PR' as const, label: 'Pear' },
              { key: 'MQ' as const, label: 'Marquise' },
            ]).map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 1, fontSize: '0.72rem', color: '#F3F1EC' }}>{label}</span>
                <span style={{ fontSize: '0.62rem', color: ADMIN_STONE }}>×</span>
                <input
                  type="number"
                  step="0.01"
                  value={draft.cutPremiumMultiplier[key]}
                  onChange={(e) => updateCut(key, Number(e.target.value))}
                  style={{ ...inputStyle, width: 80, textAlign: 'right' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Live Simulator */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
          <SectionTitle icon={<BarChart3 size={14} />}>Live Price Simulator</SectionTitle>
          <p style={{ fontSize: '0.65rem', color: ADMIN_STONE, marginTop: 8, marginBottom: 24, lineHeight: 1.6 }}>
            Sample: 1.0 ct Round Brilliant · 14K Yellow Gold · White Lab Diamond · Base $400 labor · 4.2g metal
          </p>
          <div style={{ backgroundColor: ADMIN_PANEL, padding: 24, borderRadius: 2, textAlign: 'center', border: `1px solid ${ADMIN_BORDER}` }}>
            <div style={{ fontSize: '0.6rem', color: ADMIN_STONE, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Published Price</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: ADMIN_STONE, textDecoration: 'line-through', marginBottom: 4 }}>
              ${originalPrice.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.6rem', color: ADMIN_STONE, marginBottom: 16 }}>→ With new rates:</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.8rem', color: ADMIN_CHAMPAGNE, fontWeight: 300 }}>
              ${livePrice.toLocaleString()}
            </div>
            <div style={{ marginTop: 12, fontSize: '0.68rem', color: priceDelta >= 0 ? '#8AC88A' : ADMIN_DANGER }}>
              {priceDelta >= 0 ? '+' : ''}{priceDelta.toFixed(0)} USD vs current
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: '0.6rem', color: ADMIN_STONE, lineHeight: 1.7 }}>
            <div>Metal: ${(4.2 * draft.metalPurityRate['14K'] * draft.metalColorPremium['YG']).toFixed(0)}</div>
            <div>Stone: ${(1.0 * draft.stoneTypeRate['WLD'] * draft.cutPremiumMultiplier['RND']).toFixed(0)}</div>
            <div>Labor: $400</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Module 4: Order Pipeline Manager
// ─────────────────────────────────────────────────────────────
function OrderPipelineManager() {
  const {
    orders,
    adminAdvanceOrderStage,
    adminAttachCadRender,
    adminIssueCertificate,
    cancelOrder,
    refundOrder,
  } = useJewelryStore();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(orders[0]?.id ?? null);
  const [cadUrl, setCadUrl] = useState('');
  const [jewellersNote, setJewellersNote] = useState('');
  const [certIssued, setCertIssued] = useState<Set<string>>(new Set());
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const order = orders.find((o) => o.id === selectedOrder);

  const handleAttachCad = () => {
    if (!selectedOrder || !cadUrl) return;
    adminAttachCadRender(selectedOrder, cadUrl, jewellersNote);
    setCadUrl('');
    setJewellersNote('');
  };

  const handleIssueCert = () => {
    if (!selectedOrder) return;
    adminIssueCertificate(selectedOrder);
    setCertIssued((prev) => new Set([...prev, selectedOrder]));
  };

  const handleRefund = async () => {
    if (!order) return;
    if (!window.confirm(`Issue a full Razorpay refund for Order ${order.orderNumber} ($${order.totalUSD.toLocaleString()})?`)) return;
    setActionStatus('Processing Razorpay refund...');
    const ok = await refundOrder(order.id, 'Admin initiated refund from atelier dashboard');
    setActionStatus(ok ? '✓ Refund recorded and dispatched' : 'Refund processing completed');
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleCancel = async () => {
    if (!order) return;
    const reason = window.prompt('Enter cancellation reason:', 'Admin cancelled before gold lost-wax casting');
    if (!reason) return;
    setActionStatus('Cancelling order...');
    const ok = await cancelOrder(order.id, reason);
    setActionStatus(ok ? '✓ Order marked CANCELLED' : 'Cancellation failed');
    setTimeout(() => setActionStatus(null), 3000);
  };

  return (
    <div>
      <PageHeader title="Order Pipeline" subtitle="Manage 8-stage bespoke manufacturing and vault certificate issuance" />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Order list */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${ADMIN_BORDER}` }}>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: ADMIN_STONE }}>
              {orders.length} Orders
            </span>
          </div>
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelectedOrder(o.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: selectedOrder === o.id ? 'rgba(197,168,128,0.1)' : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${ADMIN_BORDER}`,
                borderLeft: selectedOrder === o.id ? `2px solid ${ADMIN_CHAMPAGNE}` : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#F3F1EC', marginBottom: 4 }}>{o.orderNumber}</div>
              <StagePill stage={o.currentStage} />
              <div style={{ fontSize: '0.6rem', color: ADMIN_STONE, marginTop: 4 }}>${o.totalUSD.toLocaleString()}</div>
            </button>
          ))}
        </div>

        {/* Order detail */}
        {order ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#F3F1EC', marginBottom: 4 }}>{order.orderNumber}</div>
                  <div style={{ fontSize: '0.65rem', color: ADMIN_STONE }}>
                    Placed {new Date(order.placedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} · ${order.totalUSD.toLocaleString()} USD
                  </div>
                </div>
                <StagePill stage={order.currentStage} large />
              </div>
            </div>

            {/* Razorpay Payment & Order State Machine */}
            <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <SectionTitle icon={<CreditCard size={14} />}>Razorpay Payment &amp; Order State</SectionTitle>
                {actionStatus && (
                  <span style={{ fontSize: '0.65rem', color: ADMIN_CHAMPAGNE, fontFamily: 'var(--font-mono)' }}>
                    {actionStatus}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ backgroundColor: ADMIN_PANEL, padding: 12, border: `1px solid ${ADMIN_BORDER}` }}>
                  <span style={{ fontSize: '0.55rem', color: ADMIN_STONE, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Order Status</span>
                  <div style={{ fontSize: '0.85rem', color: order.orderStatus === 'CANCELLED' ? ADMIN_DANGER : ADMIN_CHAMPAGNE, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    {order.orderStatus || 'PLACED'}
                  </div>
                </div>

                <div style={{ backgroundColor: ADMIN_PANEL, padding: 12, border: `1px solid ${ADMIN_BORDER}` }}>
                  <span style={{ fontSize: '0.55rem', color: ADMIN_STONE, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Payment Status</span>
                  <div style={{ fontSize: '0.85rem', color: order.paymentStatus === 'CAPTURED' ? ADMIN_SUCCESS : order.paymentStatus === 'REFUNDED' ? '#C5A880' : ADMIN_DANGER, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    {order.paymentStatus || 'CAPTURED'}
                  </div>
                </div>

                <div style={{ backgroundColor: ADMIN_PANEL, padding: 12, border: `1px solid ${ADMIN_BORDER}` }}>
                  <span style={{ fontSize: '0.55rem', color: ADMIN_STONE, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Razorpay Order ID</span>
                  <div style={{ fontSize: '0.7rem', color: '#F3F1EC', marginTop: 4, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                    {order.razorpayOrderId || 'rzp_ord_synced'}
                  </div>
                </div>

                <div style={{ backgroundColor: ADMIN_PANEL, padding: 12, border: `1px solid ${ADMIN_BORDER}` }}>
                  <span style={{ fontSize: '0.55rem', color: ADMIN_STONE, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Payment / Refund Ref</span>
                  <div style={{ fontSize: '0.7rem', color: '#F3F1EC', marginTop: 4, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                    {order.razorpayPaymentId || order.refundId || 'pay_authorized'}
                  </div>
                </div>
              </div>

              {order.cancellationReason && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(232,106,106,0.1)', border: '1px solid rgba(232,106,106,0.3)', marginBottom: 16, fontSize: '0.65rem', color: ADMIN_DANGER }}>
                  Cancellation Reason: {order.cancellationReason}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {order.paymentStatus !== 'REFUNDED' && (
                  <button
                    onClick={handleRefund}
                    style={{
                      ...btnSecondaryStyle,
                      padding: '8px 14px',
                      fontSize: '0.65rem',
                      borderColor: '#C5A880',
                      color: '#C5A880',
                    }}
                  >
                    Issue Refund via Razorpay
                  </button>
                )}

                {order.orderStatus !== 'CANCELLED' && (
                  <button
                    onClick={handleCancel}
                    style={{
                      ...btnSecondaryStyle,
                      padding: '8px 14px',
                      fontSize: '0.65rem',
                      borderColor: ADMIN_DANGER,
                      color: ADMIN_DANGER,
                    }}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Stage progress */}
            <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
              <SectionTitle icon={<Truck size={14} />}>Stage Progress</SectionTitle>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {STAGE_ORDER.map((stage) => {
                  const stageRec = order.stages.find((s) => s.stage === stage);
                  const isCompleted = stageRec && !stageRec.isPending && !stageRec.isActive;
                  const isActive = stageRec?.isActive;
                  return (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: `1px solid ${ADMIN_BORDER}` }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, backgroundColor: isCompleted ? ADMIN_SUCCESS : isActive ? ADMIN_CHAMPAGNE : ADMIN_STONE }} />
                      <div style={{ flex: 1, fontSize: '0.68rem', color: isActive ? '#F3F1EC' : isCompleted ? '#F3F1EC' : ADMIN_STONE }}>
                        {STAGE_LABELS[stage].label}
                      </div>
                      <button
                        onClick={() => adminAdvanceOrderStage(order.id, stage)}
                        style={{
                          ...btnSecondaryStyle,
                          padding: '4px 10px',
                          fontSize: '0.55rem',
                          backgroundColor: order.currentStage === stage ? 'rgba(197,168,128,0.15)' : 'transparent',
                          color: order.currentStage === stage ? ADMIN_CHAMPAGNE : ADMIN_STONE,
                          borderColor: order.currentStage === stage ? ADMIN_CHAMPAGNE : ADMIN_BORDER,
                        }}
                      >
                        {order.currentStage === stage ? 'Current' : 'Set Stage'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CAD Render attachment (Stage 2) */}
            <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
              <SectionTitle icon={<ImageIcon size={14} />}>3D CAD Render (Stage 2 · Customer Approval)</SectionTitle>
              {order.cadRenderUrl && (
                <div style={{ margin: '12px 0', padding: '8px 12px', backgroundColor: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}`, fontSize: '0.65rem', color: ADMIN_CHAMPAGNE, wordBreak: 'break-all' }}>
                  Current: {order.cadRenderUrl}
                  {order.cadRenderApproved && <span style={{ marginLeft: 8, color: ADMIN_SUCCESS }}> ✓ Customer Approved</span>}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <FormField label="3D CAD Render Image URL">
                  <input style={inputStyle} value={cadUrl} onChange={(e) => setCadUrl(e.target.value)} placeholder="https://renders.heirest.com/..." />
                </FormField>
                <FormField label="Jeweller's Note (shown to customer)">
                  <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={jewellersNote} onChange={(e) => setJewellersNote(e.target.value)} placeholder="Stone is perfectly centred, orientation is East-West per your request..." />
                </FormField>
                <button style={btnPrimaryStyle} onClick={handleAttachCad} disabled={!cadUrl}>
                  <ImageIcon size={13} /> Attach CAD & Notify Customer
                </button>
              </div>
            </div>

            {/* Vault Certificate Issuance */}
            <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
              <SectionTitle icon={<Award size={14} />}>Digital Vault Certificate</SectionTitle>
              <p style={{ fontSize: '0.65rem', color: ADMIN_STONE, marginTop: 8, marginBottom: 16, lineHeight: 1.6 }}>
                Issues an IGI-graded Digital Vault Certificate to the customer's My Vault upon manufacturing completion. Includes stone grading specs, insurance valuation, and Heirest authentication number.
              </p>
              {certIssued.has(order.id) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: ADMIN_SUCCESS, fontSize: '0.72rem' }}>
                  <CheckCircle size={16} /> Certificate issued & added to Customer Vault
                </div>
              ) : (
                <button
                  style={{ ...btnPrimaryStyle, backgroundColor: order.currentStage === 'dispatched' ? ADMIN_CHAMPAGNE : ADMIN_STONE }}
                  onClick={handleIssueCert}
                >
                  <Award size={13} /> Issue Digital Vault Certificate
                </button>
              )}
              {order.currentStage !== 'dispatched' && !certIssued.has(order.id) && (
                <p style={{ fontSize: '0.6rem', color: ADMIN_STONE, marginTop: 8 }}>
                  ⚠ Recommended only when order reaches Stage 8 (Dispatched)
                </p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, color: ADMIN_STONE, fontSize: '0.72rem' }}>
            Select an order to manage
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Module 5: Storefront CMS Manager
// ─────────────────────────────────────────────────────────────
function StorefrontCmsManager() {
  const { cmsSettings, adminUpdateCmsSettings, communityDesigns, adminApproveCommunityDesign, adminFeatureCommunityDesign, adminRemoveCommunityDesign } = useJewelryStore();
  const [draft, setDraft] = useState({ ...cmsSettings });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    adminUpdateCmsSettings(draft);
    await adminApi.updateCmsSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <PageHeader title="Storefront CMS" subtitle="Control the homepage, announcement bar, and community carousel in real-time">
        <button style={btnPrimaryStyle} onClick={handleSave}>
          {saved ? <><CheckCircle size={13} /> Saved!</> : <><Save size={13} /> Save CMS Settings</>}
        </button>
      </PageHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Announcement Bar */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
          <SectionTitle icon={<Settings size={14} />}>Top Announcement Bar</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draft.announcementBarVisible}
                onChange={(e) => setDraft((d) => ({ ...d, announcementBarVisible: e.target.checked }))}
                style={{ accentColor: ADMIN_CHAMPAGNE, width: 14, height: 14 }}
              />
              <span style={{ fontSize: '0.72rem', color: '#F3F1EC' }}>Bar Visible</span>
            </label>
            <FormField label="Announcement Text">
              <input
                style={inputStyle}
                value={draft.announcementBarText}
                onChange={(e) => setDraft((d) => ({ ...d, announcementBarText: e.target.value }))}
                placeholder="SHOP THE SIZING KIT | ONLY $19 + FREE SHIPPING"
              />
            </FormField>
            <FormField label="Sizing Kit Price ($)">
              <input
                type="number"
                style={{ ...inputStyle, width: 120 }}
                value={draft.sizingKitPrice}
                onChange={(e) => setDraft((d) => ({ ...d, sizingKitPrice: Number(e.target.value) }))}
              />
            </FormField>
            {/* Live preview */}
            <div style={{ backgroundColor: '#141413', border: `1px solid ${ADMIN_BORDER}`, padding: '8px 16px', textAlign: 'center', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F3F1EC', fontFamily: 'var(--font-mono)' }}>
              Preview: {draft.announcementBarText}
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
          <SectionTitle icon={<Eye size={14} />}>Homepage Hero Banner</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <FormField label="Hero Headline (use \\n for line breaks)">
              <input
                style={inputStyle}
                value={draft.heroHeadline}
                onChange={(e) => setDraft((d) => ({ ...d, heroHeadline: e.target.value }))}
                placeholder="Author Your\nHeirloom."
              />
            </FormField>
            <FormField label="Hero Subheadline">
              <textarea
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
                value={draft.heroSubheadline}
                onChange={(e) => setDraft((d) => ({ ...d, heroSubheadline: e.target.value }))}
                placeholder="Bespoke fine jewellery, configured by you..."
              />
            </FormField>
            <FormField label="Hero Image / Video URL">
              <input
                style={inputStyle}
                value={draft.heroMediaUrl}
                onChange={(e) => setDraft((d) => ({ ...d, heroMediaUrl: e.target.value }))}
                placeholder="https://cdn.heirest.com/hero-2026.mp4"
              />
            </FormField>
            {/* Preview */}
            <div style={{ backgroundColor: '#0D0C0B', border: `1px solid ${ADMIN_BORDER}`, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: '#F3F1EC', fontWeight: 300, lineHeight: 1.1, whiteSpace: 'pre-line' }}>
                {draft.heroHeadline || 'Author Your\nHeirloom.'}
              </div>
              <div style={{ fontSize: '0.78rem', color: ADMIN_STONE, maxWidth: 400, lineHeight: 1.6 }}>
                {draft.heroSubheadline}
              </div>
            </div>
          </div>
        </div>

        {/* Community Designs Curation */}
        <div style={{ backgroundColor: ADMIN_SURFACE, border: `1px solid ${ADMIN_BORDER}`, borderRadius: 2, padding: 24 }}>
          <SectionTitle icon={<Users size={14} />}>Community Design Curation — "Authored By You"</SectionTitle>
          <p style={{ fontSize: '0.65rem', color: ADMIN_STONE, marginTop: 8, marginBottom: 20, lineHeight: 1.6 }}>
            Approve, feature, or remove user-configured designs from the Homepage carousel.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {communityDesigns.map((design) => (
              <div
                key={design.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 16px',
                  backgroundColor: ADMIN_PANEL,
                  border: `1px solid ${ADMIN_BORDER}`,
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: design.accentColor,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Gem size={14} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: '#F3F1EC', marginBottom: 2 }}>{design.authorHandle}</div>
                  <div style={{ fontSize: '0.58rem', color: ADMIN_STONE, fontFamily: 'var(--font-mono)' }}>{design.sku}</div>
                  <div style={{ fontSize: '0.6rem', color: ADMIN_STONE, marginTop: 2 }}>{design.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(design as any).featured && <span style={{ fontSize: '0.55rem', padding: '2px 6px', border: `1px solid ${ADMIN_CHAMPAGNE}`, color: ADMIN_CHAMPAGNE, borderRadius: 2 }}>FEATURED</span>}
                  {(design as any).approved && <span style={{ fontSize: '0.55rem', padding: '2px 6px', border: `1px solid ${ADMIN_SUCCESS}`, color: ADMIN_SUCCESS, borderRadius: 2 }}>APPROVED</span>}
                  <ActionIconBtn icon={<CheckCircle size={12} />} title="Approve" onClick={() => adminApproveCommunityDesign(design.id)} />
                  <ActionIconBtn icon={<Star size={12} />} title="Feature" onClick={() => adminFeatureCommunityDesign(design.id)} />
                  <ActionIconBtn icon={<Trash2 size={12} />} title="Remove" onClick={() => adminRemoveCommunityDesign(design.id)} danger />
                </div>
                <div style={{ fontSize: '0.62rem', color: ADMIN_STONE }}>{design.likes.toLocaleString()} ♥</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, borderBottom: `1px solid ${ADMIN_BORDER}`, paddingBottom: 20 }}>
      <div>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ADMIN_STONE, marginBottom: 4 }}>Admin Console</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: '#F3F1EC', fontWeight: 300, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: '0.68rem', color: ADMIN_STONE, marginTop: 4 }}>{subtitle}</p>
      </div>
      {children && <div style={{ display: 'flex', gap: 10 }}>{children}</div>}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ color: ADMIN_CHAMPAGNE }}>{icon}</span>
      <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: ADMIN_STONE }}>{children}</span>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: ADMIN_CHAMPAGNE, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${ADMIN_BORDER}` }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function CheckboxGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: string[];
  onToggle: (v: T) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 10px', border: `1px solid ${selected.includes(opt.value) ? ADMIN_CHAMPAGNE : ADMIN_BORDER}`, backgroundColor: selected.includes(opt.value) ? 'rgba(197,168,128,0.12)' : 'transparent', borderRadius: 2 }}>
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
              style={{ accentColor: ADMIN_CHAMPAGNE }}
            />
            <span style={{ fontSize: '0.62rem', color: selected.includes(opt.value) ? ADMIN_CHAMPAGNE : ADMIN_STONE }}>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ActionIconBtn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none',
        border: `1px solid ${danger ? 'rgba(204,34,68,0.3)' : ADMIN_BORDER}`,
        color: danger ? ADMIN_DANGER : ADMIN_STONE,
        padding: '4px 6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        borderRadius: 2,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = danger ? ADMIN_DANGER : ADMIN_CHAMPAGNE;
        e.currentTarget.style.color = danger ? ADMIN_DANGER : ADMIN_CHAMPAGNE;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = danger ? 'rgba(204,34,68,0.3)' : ADMIN_BORDER;
        e.currentTarget.style.color = danger ? ADMIN_DANGER : ADMIN_STONE;
      }}
    >
      {icon}
    </button>
  );
}

function StagePill({ stage, large }: { stage: OrderStage; large?: boolean }) {
  const stageColors: Partial<Record<OrderStage, string>> = {
    specs_locked: '#6AC8E8',
    cad_approval: '#E8B86A',
    metal_casting: '#C5A880',
    stone_selection: '#8AC88A',
    master_setting: '#C5A880',
    hand_polishing: '#C5A880',
    quality_control: '#8AC88A',
    dispatched: ADMIN_SUCCESS,
  };
  const color = stageColors[stage] ?? ADMIN_STONE;
  return (
    <span style={{
      fontSize: large ? '0.6rem' : '0.55rem',
      padding: large ? '4px 10px' : '2px 6px',
      border: `1px solid ${color}40`,
      color,
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      display: 'inline-block',
      marginTop: 2,
      borderRadius: 2,
    }}>
      {stage.replace(/_/g, ' ')}
    </span>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,12,11,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
