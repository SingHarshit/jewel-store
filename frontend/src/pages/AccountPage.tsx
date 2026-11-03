import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Download,
  Shield,
  RefreshCw,
  ChevronRight,
  Copy,
  ExternalLink,
  AlertCircle,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJewelryStore } from '../store/useJewelryStore';
import { formatPrice } from '../utils/pricingEngine';
import {
  STONE_LABELS, METAL_COLOR_LABELS, METAL_PURITY_LABELS,
  CUT_LABELS, generateShareUrl,
} from '../utils/skuEngine';
import type { VaultItem, Order, AccountTab, FingerSizeEntry } from '../types/jewelry';

// ─── Tab definitions ─────────────────────────────────────────
const TABS: { id: AccountTab; label: string }[] = [
  { id: 'designs', label: 'My Designs' },
  { id: 'vault',   label: 'My Vault' },
  { id: 'orders',  label: 'Orders & QC Tracker' },
  { id: 'profile', label: 'Size & Style Profile' },
];

const ORDER_STAGE_ICONS: Record<string, React.ReactNode> = {
  specs_locked:    <Check size={12} />,
  cad_approval:    <AlertCircle size={12} />,
  metal_casting:   <RefreshCw size={12} />,
  stone_selection: <Shield size={12} />,
  master_setting:  <Check size={12} />,
  hand_polishing:  <Check size={12} />,
  quality_control: <Shield size={12} />,
  dispatched:      <ExternalLink size={12} />,
};

// ─── Certificate Modal ────────────────────────────────────────
function CertificateModal({ item, onClose }: { item: VaultItem; onClose: () => void }) {
  const r = item.stoneGradingReport;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(20,20,19,0.7)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto relative"
        style={{ backgroundColor: 'var(--color-alabaster)', border: '1px solid var(--color-hairline)' }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-espresso)' }}>
          <button onClick={onClose} className="absolute top-4 right-4 opacity-50 hover:opacity-100" style={{ color: 'white' }}>
            <X size={18} />
          </button>
          <p className="section-label mb-1" style={{ color: 'var(--color-champagne)' }}>Digital Certificate of Authenticity</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--color-alabaster)' }}>
            {item.productName}
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {item.certificateNumber}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* SKU */}
          <div>
            <p className="section-label mb-2">Authored SKU</p>
            <div className="sku-badge">{item.sku}</div>
          </div>

          {/* IGI Grading Report */}
          <div>
            <p className="section-label mb-3">{r.lab} Diamond Grading Report</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-stone)' }} className="mb-3">
              Report No. {r.reportNumber}
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ['Shape', CUT_LABELS[r.shape]],
                ['Carat Weight', `${r.caratWeight} ct`],
                ['Colour', r.color],
                ['Clarity', r.clarity],
                ['Cut', r.cut],
                ['Polish', r.polish],
                ['Symmetry', r.symmetry],
                ['Fluorescence', r.fluorescence],
                ['Measurements', r.measurements],
              ].map(([label, value]) => (
                <div key={label} className="border-b pb-2" style={{ borderColor: 'var(--color-hairline)' }}>
                  <p className="section-label mb-0.5">{label}</p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--color-espresso)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Insurance */}
          <div
            className="p-4"
            style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}
          >
            <p className="section-label mb-2">Insurance Valuation</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
              ${item.insuranceValuation.toLocaleString()} USD
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-stone)' }}>
              Retail replacement valuation as of {new Date(item.purchasedAt).getFullYear()}
            </p>
          </div>

          {/* Download button */}
          <button
            className="w-full py-3 flex items-center justify-center gap-2 text-[0.7rem] tracking-widest uppercase font-mono border transition-all hover:bg-[var(--color-espresso)] hover:text-[var(--color-ivory)]"
            style={{ borderColor: 'var(--color-espresso)', color: 'var(--color-espresso)' }}
          >
            <Download size={14} />
            Download PDF Certificate
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Resizing Modal ───────────────────────────────────────────
function ResizingModal({ item, onClose }: { item: VaultItem; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [newSize, setNewSize] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(20,20,19,0.7)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 relative"
        style={{ backgroundColor: 'var(--color-alabaster)', border: '1px solid var(--color-hairline)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-40 hover:opacity-100"><X size={18} /></button>
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--color-champagne)' }}>
              <Check size={24} color="white" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 300 }}>Resizing Requested</h3>
            <p className="text-sm mt-2" style={{ color: 'var(--color-stone)' }}>
              We'll email you a prepaid return label within 24 hours. Resizing takes 5–7 business days.
            </p>
          </div>
        ) : (
          <>
            <p className="section-label mb-2" style={{ color: 'var(--color-champagne)' }}>60-Day Complimentary Resizing</p>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
              {item.productName}
            </h3>
            <p className="text-sm mt-2 mb-6" style={{ color: 'var(--color-stone)' }}>
              Your ring qualifies for one complimentary resizing. Select your new size and we'll send a prepaid return label.
            </p>
            <label className="section-label block mb-2">New Ring Size (UK)</label>
            <select
              className="input-underline mb-6"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
            >
              <option value="">Select size...</option>
              {['D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => setSubmitted(true)}
              disabled={!newSize}
              className="w-full py-3 text-[0.7rem] tracking-widest uppercase font-mono transition-all disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
            >
              Request Resizing
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── CAD Approval Banner ──────────────────────────────────────
function CADApprovalBanner({ order }: { order: Order }) {
  const { approveCadRender } = useJewelryStore();
  const [approved, setApproved] = useState(order.cadRenderApproved ?? false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    approveCadRender(order.id);
    setApproved(true);
    setLoading(false);
  };

  if (approved) return null;

  return (
    <div
      className="p-5 mb-6 border-l-4"
      style={{ backgroundColor: '#FFF9F0', borderLeftColor: 'var(--color-champagne)', border: '1px solid #E8D8B0' }}
    >
      <p className="section-label mb-2" style={{ color: 'var(--color-champagne)' }}>Action Required — Stage 2</p>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
        Your 3D CAD Render is ready for approval
      </h3>
      <p className="text-sm mt-2 mb-4" style={{ color: 'var(--color-stone)' }}>
        Our master jeweller has created a precision 3D CAD render of <strong>{order.items[0]?.sku}</strong>.
        Please review and approve before casting begins.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-[0.65rem] tracking-widest uppercase font-mono transition-all disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          {loading ? <><RefreshCw size={12} className="animate-spin" /> Approving...</> : <><Check size={12} /> Approve & Begin Casting</>}
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2.5 text-[0.65rem] tracking-widest uppercase font-mono border transition-all"
          style={{ borderColor: 'var(--color-espresso)', color: 'var(--color-espresso)' }}
        >
          <ExternalLink size={12} /> View Full Render
        </button>
      </div>
    </div>
  );
}

// ─── Guest Banner ─────────────────────────────────────────────
function AccountGuestBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mb-6 p-4 border flex items-center justify-between" style={{ borderColor: 'var(--color-champagne)', backgroundColor: 'rgba(197,168,128,0.06)' }}>
      <div>
        <p className="text-sm font-mono" style={{ color: 'var(--color-espresso)' }}>Browsing as Guest</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-stone)' }}>Sign in to access your Vault, live orders, and IGI certificates.</p>
      </div>
      <button onClick={onOpen} className="px-4 py-2 text-[0.62rem] tracking-widest uppercase font-mono" style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}>
        Sign In
      </button>
    </div>
  );
}

// ─── Cancel Order Modal ───────────────────────────────────────
function CancelOrderModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('Changed ring style preference before metal casting');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md p-6 bg-[#FAF9F5] border border-[#E5E1D8] shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-50 hover:opacity-100">
          <X size={18} />
        </button>
        <p className="section-label mb-1 text-red-700">Commission Cancellation</p>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 300 }}>
          Cancel Order {order.orderNumber}
        </h3>
        <p className="text-xs text-stone-600 mt-2 mb-4">
          Cancellations can be processed before lost-wax gold casting begins.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="section-label block mb-1">Reason for Cancellation</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-underline text-xs resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-stone-300 text-stone-700 text-xs font-mono uppercase tracking-widest hover:bg-stone-100"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-red-700 text-white text-xs font-mono uppercase tracking-widest hover:bg-red-800 disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Account Page ────────────────────────────────────────
export default function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = (searchParams.get('tab') as AccountTab) ?? 'designs';
  const {
    savedDesigns, vaultItems, orders, removeDesign, addToCart, currency,
    user, updateFingerSize,
    authUser, isAuthenticated, openAuthModal, signOut,
    cancelOrder, fetchOrders, checkoutOpen, setAppliedVoucherCode,
  } = useJewelryStore();

  const [certItem, setCertItem] = useState<VaultItem | null>(null);
  const [resizeItem, setResizeItem] = useState<VaultItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState<Order | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const setTab = (tab: AccountTab) => setSearchParams({ tab });

  // Derive display values: prefer real auth user, fall back to legacy profile
  const displayName = authUser
    ? `${authUser.firstName} ${authUser.lastName}`
    : user.name;
  const displayHandle = authUser ? authUser.authorHandle : user.authorHandle;
  const displayInitials = authUser
    ? `${authUser.firstName[0]}${authUser.lastName[0]}`
    : user.avatarInitials;
  const displayTier    = authUser?.membershipTier;
  const memberSince    = authUser
    ? new Date(authUser.createdAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    : new Date(user.memberSince).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

  const copyShareUrl = (design: typeof savedDesigns[0]) => {
    const url = generateShareUrl(design.sku, design.productId);
    navigator.clipboard?.writeText(url);
    setCopiedId(design.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fingers: FingerSizeEntry['finger'][] = ['pinky', 'ring', 'middle', 'index', 'thumb'];

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-10 animate-fade-up">
      {!isAuthenticated && <AccountGuestBanner onOpen={() => openAuthModal('login')} />}

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-base font-mono"
            style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
          >
            {displayInitials}
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
            {displayName}
          </h1>
          <p className="section-label mt-1" style={{ color: 'var(--color-champagne)' }}>{displayHandle}</p>
          {displayTier && (
            <span className="inline-block mt-1 text-[0.58rem] tracking-widest uppercase font-mono px-2 py-0.5" style={{ backgroundColor: 'rgba(197,168,128,0.15)', color: 'var(--color-champagne)' }}>
              {displayTier}
            </span>
          )}
          <p className="section-label mt-1" style={{ color: 'var(--color-stone)' }}>
            Member since {memberSince}
          </p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => { signOut(); navigate('/'); }}
            className="flex items-center gap-2 px-4 py-2 border text-[0.62rem] tracking-widest uppercase font-mono transition-all hover:border-[var(--color-espresso)]"
            style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-stone)' }}
          >
            <LogOut size={12} />Sign Out
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-8 overflow-x-auto" style={{ borderColor: 'var(--color-hairline)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className="flex-shrink-0 pb-3 px-1 mr-8 text-[0.7rem] tracking-widest uppercase font-mono transition-all"
            style={{
              borderBottom: `2px solid ${tabParam === tab.id ? 'var(--color-espresso)' : 'transparent'}`,
              marginBottom: '-1px',
              color: tabParam === tab.id ? 'var(--color-espresso)' : 'var(--color-stone)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: MY DESIGNS ─────────────────────────────────── */}
      {tabParam === 'designs' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
              Saved Designs
            </h2>
            <Link to="/collections/all" className="section-label hover:opacity-60 transition-opacity flex items-center gap-1" style={{ color: 'var(--color-stone)' }}>
              Start New <ChevronRight size={12} />
            </Link>
          </div>

          {savedDesigns.length === 0 ? (
            <div className="py-16 text-center border" style={{ borderColor: 'var(--color-hairline)' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                No saved designs yet
              </p>
              <Link to="/collections/all" className="mt-4 inline-block section-label underline" style={{ color: 'var(--color-stone)' }}>
                Begin configuring
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedDesigns.map((design) => (
                <div
                  key={design.id}
                  className="p-5 border flex flex-col sm:flex-row sm:items-center gap-4"
                  style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
                >
                  {/* Visual */}
                  <div
                    className="w-16 h-16 flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-hairline)' }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="section-label mb-1" style={{ color: 'var(--color-champagne)' }}>{design.authorHandle}</p>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                      {design.productName}
                    </p>
                    <div className="sku-badge mt-1">{design.sku}</div>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-stone)' }}>
                      {METAL_PURITY_LABELS[design.config.metalPurity]} {METAL_COLOR_LABELS[design.config.metalColor]} ·{' '}
                      {design.config.caratWeight.toFixed(2)}ct {STONE_LABELS[design.config.stone]} ·{' '}
                      {CUT_LABELS[design.config.cut]}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
                      Saved {new Date(design.savedAt).toLocaleDateString('en-AU')}
                    </p>
                  </div>

                  {/* Price + actions */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                      {formatPrice(design.priceUSD, currency)}
                    </p>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Link
                        to={`/configure/${design.productId}?sku=${design.sku}`}
                        className="px-3 py-1.5 text-[0.6rem] tracking-widest uppercase font-mono border transition-all hover:bg-[var(--color-espresso)] hover:text-[var(--color-ivory)]"
                        style={{ borderColor: 'var(--color-espresso)', color: 'var(--color-espresso)' }}
                      >
                        Resume Editing
                      </Link>
                      <button
                        onClick={() => copyShareUrl(design)}
                        className="px-3 py-1.5 text-[0.6rem] tracking-widest uppercase font-mono border transition-all flex items-center gap-1"
                        style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-stone)' }}
                      >
                        <Copy size={10} />
                        {copiedId === design.id ? 'Copied!' : 'Share Link'}
                      </button>
                      <button
                        onClick={() => addToCart(design.productId, design.config)}
                        className="px-3 py-1.5 text-[0.6rem] tracking-widest uppercase font-mono transition-all"
                        style={{ backgroundColor: 'var(--color-champagne)', color: 'var(--color-espresso)' }}
                      >
                        Move to Bag
                      </button>
                      <button
                        onClick={() => removeDesign(design.id)}
                        className="opacity-30 hover:opacity-100 transition-opacity"
                        aria-label="Remove design"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MY VAULT ───────────────────────────────────── */}
      {tabParam === 'vault' && (
        <div>
          <div className="mb-6">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
              My Vault — Digital Safe
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-stone)' }}>
              Your purchased pieces with digital certificates, grading reports, and warranty status.
            </p>
          </div>

          <div className="space-y-6">
            {vaultItems.map((item) => (
              <div
                key={item.id}
                className="border p-6"
                style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Visual */}
                  <div
                    className="w-24 h-24 flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-hairline)' }}
                  />

                  {/* Info */}
                  <div className="flex-1">
                    <p className="section-label mb-1">Order {item.orderId}</p>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                      {item.productName}
                    </p>
                    <div className="sku-badge mt-1 mb-3">{item.sku}</div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      {[
                        ['Purchased', new Date(item.purchasedAt).toLocaleDateString('en-AU')],
                        ['Paid', `$${item.priceUSD.toLocaleString()} USD`],
                        ['Insurance Valuation', `$${item.insuranceValuation.toLocaleString()} USD`],
                        ['Certificate', item.certificateNumber],
                        ['IGI Report', item.stoneGradingReport.reportNumber],
                        ['Next Inspection', new Date(item.inspectionDue).toLocaleDateString('en-AU')],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="section-label mb-0.5">{label}</p>
                          <p className="text-sm" style={{ color: 'var(--color-espresso)', fontFamily: 'var(--font-sans)' }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setCertItem(item)}
                        className="flex items-center gap-2 px-4 py-2 text-[0.65rem] tracking-widest uppercase font-mono border transition-all hover:bg-[var(--color-espresso)] hover:text-[var(--color-ivory)]"
                        style={{ borderColor: 'var(--color-espresso)', color: 'var(--color-espresso)' }}
                      >
                        <Shield size={12} />
                        View Certificate
                      </button>
                      {!item.resizingUsed && item.config.category === 'RG' && (
                        <button
                          onClick={() => setResizeItem(item)}
                          className="flex items-center gap-2 px-4 py-2 text-[0.65rem] tracking-widest uppercase font-mono border transition-all hover:border-[var(--color-champagne)]"
                          style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-stone)' }}
                        >
                          <RefreshCw size={12} />
                          60-Day Resize
                        </button>
                      )}
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-[0.65rem] tracking-widest uppercase font-mono border transition-all hover:border-[var(--color-champagne)]"
                        style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-stone)' }}
                      >
                        Annual Inspection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ORDERS ─────────────────────────────────────── */}
      {tabParam === 'orders' && (
        <div>
          <h2 className="mb-6" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
            Orders & 8-Stage QC Tracker
          </h2>

          <div className="space-y-8">
            {orders.map((order) => {
              const isCancelled = order.orderStatus === 'CANCELLED';
              const isRefunded = order.paymentStatus === 'REFUNDED';
              const isFailed = order.paymentStatus === 'FAILED';

              return (
                <div key={order.id} className="border" style={{ borderColor: 'var(--color-hairline)' }}>
                  {/* Order header */}
                  <div
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b"
                    style={{ borderColor: 'var(--color-hairline)', backgroundColor: 'var(--color-ivory)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="section-label mb-0">Order {order.orderNumber}</p>

                        {/* Order status badge */}
                        <span
                          className={`text-[0.6rem] font-mono tracking-widest uppercase px-2 py-0.5 border ${
                            isCancelled
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : order.orderStatus === 'COMPLETED'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : order.orderStatus === 'IN_PRODUCTION'
                              ? 'border-[#C5A880] bg-[#C5A880]/15 text-[#141413]'
                              : 'border-stone-300 bg-stone-100 text-stone-700'
                          }`}
                        >
                          {order.orderStatus || 'PLACED'}
                        </span>

                        {/* Payment status badge */}
                        <span
                          className={`text-[0.6rem] font-mono tracking-widest uppercase px-2 py-0.5 border flex items-center gap-1 ${
                            order.paymentStatus === 'CAPTURED'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : isFailed
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : isRefunded
                              ? 'border-purple-300 bg-purple-50 text-purple-700'
                              : 'border-amber-300 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.paymentStatus === 'CAPTURED' && <Shield size={10} />}
                          {isFailed && <AlertCircle size={10} />}
                          {isRefunded && <RotateCcw size={10} />}
                          {order.paymentStatus === 'CAPTURED' ? 'PAID & SECURED' : order.paymentStatus || 'PENDING'}
                        </span>
                      </div>

                      <p className="text-sm" style={{ color: 'var(--color-stone)' }}>
                        Placed {new Date(order.placedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {order.trackingNumber && ` · DHL: ${order.trackingNumber}`}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
                        {formatPrice(order.totalUSD, currency)}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="sku-badge">{order.items[0]?.sku}</div>
                        {!isCancelled && order.currentStage === 'specs_locked' && (
                          <button
                            onClick={() => setCancelOrderTarget(order)}
                            className="text-[0.62rem] font-mono uppercase tracking-wider text-stone-400 hover:text-red-700 transition-colors underline ml-2"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Failure Warning Banner */}
                  {isFailed && (
                    <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                        <span>Payment authorization was declined or cancelled. Retrying payment will activate the 8-stage manufacturing atelier.</span>
                      </div>
                      <button
                        onClick={() => checkoutOpen()}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-mono text-[0.65rem] tracking-widest uppercase transition-all flex-shrink-0"
                      >
                        Retry with Razorpay
                      </button>
                    </div>
                  )}

                  {/* Cancellation Reason Banner */}
                  {isCancelled && (
                    <div className="mx-6 my-4 p-4 bg-stone-100 border border-stone-200 text-xs text-stone-700">
                      <p className="font-mono uppercase tracking-wider text-[0.65rem] text-red-700 mb-0.5 font-medium">
                        Commission Cancelled
                      </p>
                      <p>Reason: {order.cancellationReason || 'Customer requested cancellation prior to casting'}</p>
                      {order.cancelledAt && (
                        <p className="text-[0.68rem] text-stone-500 font-mono mt-1">
                          Processed: {new Date(order.cancelledAt).toLocaleDateString('en-AU')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Refund Processed Banner */}
                  {isRefunded && (
                    <div className="mx-6 my-4 p-4 bg-purple-50 border border-purple-200 text-xs text-purple-900">
                      <div className="flex items-center gap-1.5 font-mono uppercase text-[0.65rem] text-purple-700 mb-0.5 font-medium">
                        <RotateCcw size={12} />
                        <span>Refund Dispatched via Razorpay</span>
                      </div>
                      <p className="font-mono text-xs text-purple-800">Refund Reference ID: {order.refundId || 'rfnd_processed'}</p>
                    </div>
                  )}

                  {/* CAD approval banner */}
                  {!isCancelled && order.currentStage === 'cad_approval' && !order.cadRenderApproved && (
                    <div className="px-6 pt-4">
                      <CADApprovalBanner order={order} />
                    </div>
                  )}

                  {/* Stage timeline */}
                  <div className="px-6 py-6">
                    <div className="relative">
                      {/* Connector line */}
                      <div
                        className="absolute left-4 top-5 bottom-5 w-px"
                        style={{ backgroundColor: 'var(--color-hairline)' }}
                      />

                      <div className="space-y-5">
                        {order.stages.map((stage, idx) => (
                          <div key={stage.stage} className="relative flex items-start gap-5">
                            {/* Stage dot */}
                            <div
                              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: isCancelled
                                  ? 'var(--color-ivory)'
                                  : !stage.isPending && !stage.isActive
                                  ? 'var(--color-espresso)'
                                  : stage.isActive
                                  ? 'var(--color-champagne)'
                                  : 'var(--color-ivory)',
                                border: `2px solid ${
                                  isCancelled
                                    ? 'var(--color-hairline)'
                                    : stage.isActive
                                    ? 'var(--color-champagne)'
                                    : stage.isPending
                                    ? 'var(--color-hairline)'
                                    : 'var(--color-espresso)'
                                }`,
                                ...(stage.isActive && !isCancelled ? { animation: 'pulse-ring 2s ease-out infinite' } : {}),
                              }}
                            >
                              <span style={{ color: stage.isPending || isCancelled ? 'var(--color-stone)' : 'var(--color-ivory)', fontSize: '0.65rem' }}>
                                {!stage.isPending && !isCancelled ? (
                                  stage.isActive ? ORDER_STAGE_ICONS[stage.stage] : <Check size={12} />
                                ) : (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>{idx + 1}</span>
                                )}
                              </span>
                            </div>

                            {/* Stage info */}
                            <div className="flex-1 pt-1">
                              <p
                                className="text-sm font-mono tracking-wide"
                                style={{
                                  color: isCancelled ? 'var(--color-stone)' : stage.isActive ? 'var(--color-espresso)' : stage.isPending ? 'var(--color-stone)' : 'var(--color-espresso)',
                                  fontWeight: stage.isActive && !isCancelled ? 500 : 400,
                                }}
                              >
                                {stage.label} {isCancelled && <span className="text-xs text-red-600 font-normal">(Halted)</span>}
                              </p>
                              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-stone)' }}>
                                {stage.description}
                              </p>
                              {stage.completedAt && !isCancelled && (
                                <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-champagne)' }}>
                                  Completed {new Date(stage.completedAt).toLocaleDateString('en-AU')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: PROFILE ────────────────────────────────────── */}
      {tabParam === 'profile' && (
        <div className="grid md:grid-cols-2 gap-10">
          {/* Finger Size Matrix */}
          <div>
            <h2 className="mb-2" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
              Finger Size Matrix
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-stone)' }}>
              UK ring sizing. Update any time — your sizes are saved for future orders.
            </p>

            {['left', 'right'].map((hand) => (
              <div key={hand} className="mb-6">
                <p className="section-label mb-3">{hand.charAt(0).toUpperCase() + hand.slice(1)} Hand</p>
                <div className="space-y-2">
                  {fingers.map((finger) => {
                    const entry = user.fingerSizes.find(f => f.hand === hand && f.finger === finger);
                    return (
                      <div
                        key={finger}
                        className="flex items-center justify-between py-2 border-b"
                        style={{ borderColor: 'var(--color-hairline)' }}
                      >
                        <span className="text-sm capitalize" style={{ color: 'var(--color-espresso)', fontFamily: 'var(--font-sans)' }}>
                          {finger}
                        </span>
                        <select
                          className="text-xs font-mono bg-transparent border-none outline-none cursor-pointer"
                          style={{ color: 'var(--color-espresso)' }}
                          value={entry?.size ?? ''}
                          onChange={(e) => updateFingerSize(hand as 'left' | 'right', finger, e.target.value)}
                        >
                          <option value="">Not set</option>
                          {['D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Chain lengths + Sizing Kit */}
          <div>
            <h2 className="mb-2" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-espresso)', fontWeight: 300 }}>
              Preferred Chain Lengths
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-stone)' }}>
              Saved for pendant and necklace orders.
            </p>
            <div className="flex gap-2 flex-wrap mb-8">
              {[16, 18, 20, 22, 24].map((len) => (
                <div
                  key={len}
                  className="px-4 py-2 border font-mono text-sm"
                  style={{
                    borderColor: user.preferredChainLengths.includes(len) ? 'var(--color-espresso)' : 'var(--color-hairline)',
                    backgroundColor: user.preferredChainLengths.includes(len) ? 'var(--color-espresso)' : 'transparent',
                    color: user.preferredChainLengths.includes(len) ? 'var(--color-ivory)' : 'var(--color-stone)',
                  }}
                >
                  {len}"
                </div>
              ))}
            </div>

            {/* Sizing Kit Status */}
            <div
              className="p-5"
              style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="section-label mb-0" style={{ color: 'var(--color-champagne)' }}>
                  Sizing Kit Voucher Credit
                </p>
                {(authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode) && (
                  <span
                    className={`text-[0.6rem] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                      (authUser?.sizingKitRedeemed ?? user.sizingKitRedeemed)
                        ? 'border-stone-300 text-stone-500 bg-stone-50'
                        : 'border-emerald-300 text-emerald-800 bg-emerald-50'
                    }`}
                  >
                    {(authUser?.sizingKitRedeemed ?? user.sizingKitRedeemed) ? 'Redeemed' : 'Active $19 Credit'}
                  </span>
                )}
              </div>

              {(authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode) ? (
                <>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="p-2.5 bg-white border border-[#E5E1D8] font-mono text-sm tracking-widest text-[#141413] flex-1">
                      {authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const code = authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode;
                        if (code) {
                          navigator.clipboard?.writeText(code);
                          setCopiedVoucher(true);
                          setTimeout(() => setCopiedVoucher(false), 2000);
                        }
                      }}
                      className="px-3 py-2.5 border border-[#141413] text-[0.65rem] font-mono tracking-widest uppercase hover:bg-[#141413] hover:text-[#FAF9F5] transition-all flex items-center gap-1"
                    >
                      {copiedVoucher ? <Check size={12} /> : <Copy size={12} />}
                      {copiedVoucher ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <p className="text-xs mt-2" style={{ color: 'var(--color-stone)' }}>
                    {(authUser?.sizingKitRedeemed ?? user.sizingKitRedeemed)
                      ? '✓ This voucher has been credited toward your bespoke commission.'
                      : '$19 credit — automatically deductible upon checkout for any bespoke ring.'}
                  </p>

                  {!(authUser?.sizingKitRedeemed ?? user.sizingKitRedeemed) && (
                    <button
                      type="button"
                      onClick={() => {
                        const code = authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode;
                        if (code) setAppliedVoucherCode(code);
                        checkoutOpen();
                      }}
                      className="mt-3 px-4 py-2 bg-[#141413] text-[#FAF9F5] text-[0.65rem] font-mono tracking-widest uppercase hover:opacity-90 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles size={12} className="text-[#C5A880]" />
                      Apply $19 to Bag
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm mb-3" style={{ color: 'var(--color-stone)' }}>
                    Order a Heirest Ring Sizing Kit to receive an automatic redeemable $19 credit voucher.
                  </p>
                  <Link
                    to="/sizing-kit"
                    className="inline-block px-4 py-2 text-[0.65rem] tracking-widest uppercase font-mono border transition-all hover:bg-[var(--color-espresso)] hover:text-[var(--color-ivory)]"
                    style={{ borderColor: 'var(--color-espresso)', color: 'var(--color-espresso)' }}
                  >
                    Order Sizing Kit — $19
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {certItem && <CertificateModal item={certItem} onClose={() => setCertItem(null)} />}
        {resizeItem && <ResizingModal item={resizeItem} onClose={() => setResizeItem(null)} />}
        {cancelOrderTarget && (
          <CancelOrderModal
            order={cancelOrderTarget}
            onClose={() => setCancelOrderTarget(null)}
            onConfirm={async (reason) => {
              await cancelOrder(cancelOrderTarget.id, reason);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
