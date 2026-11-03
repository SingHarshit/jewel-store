import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShieldCheck,
  Truck,
  Lock,
  Check,
  AlertCircle,
  Copy,
  Sparkles,
  CreditCard,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJewelryStore } from '../../store/useJewelryStore';
import { ordersApi } from '../../services/api';
import { formatPrice, formatBNPL } from '../../utils/pricingEngine';
import { openRazorpayCheckout } from '../../utils/razorpay';
import type { ShippingAddress, PaymentMethod } from '../../types/jewelry';

export default function CheckoutModal() {
  const navigate = useNavigate();
  const {
    isCheckoutOpen,
    checkoutClose,
    cart,
    currency,
    user,
    authUser,
    onPaymentSuccess,
    appliedVoucherCode,
    setAppliedVoucherCode,
    setActiveAccountTab,
  } = useJewelryStore();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(
    authUser ? `${authUser.firstName} ${authUser.lastName}` : user.name || 'India Moxley'
  );
  const [email, setEmail] = useState(authUser?.email || user.email || 'india@heirest.co');
  const [phone, setPhone] = useState('+61 400 123 456');
  const [street, setStreet] = useState('42 Balmoral Avenue');
  const [city, setCity] = useState('Sydney');
  const [state, setState] = useState('NSW');
  const [postalCode, setPostalCode] = useState('2041');
  const [country, setCountry] = useState('Australia');
  const [orderNotes, setOrderNotes] = useState('');
  const [voucherInput, setVoucherInput] = useState(appliedVoucherCode || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY');

  // Pre-fill available voucher if user has one
  useEffect(() => {
    const availableVoucher = authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode;
    const isRedeemed = authUser?.sizingKitRedeemed || user.sizingKitRedeemed;
    if (availableVoucher && !isRedeemed && !appliedVoucherCode) {
      setVoucherInput(availableVoucher);
    }
  }, [authUser, user, appliedVoucherCode]);

  const subtotalUSD = cart.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);
  const isVoucherApplied = Boolean(appliedVoucherCode);
  const voucherDiscount = isVoucherApplied ? 19 : 0;
  const finalTotalUSD = Math.max(0, subtotalUSD - voucherDiscount);

  const applyVoucher = (codeToApply?: string) => {
    const code = (codeToApply || voucherInput).trim();
    if (!code) return;
    setAppliedVoucherCode(code);
    setErrorMessage(null);
  };

  const removeVoucher = () => {
    setAppliedVoucherCode(null);
    setVoucherInput('');
  };

  const handlePay = async () => {
    if (!fullName || !street || !city || !postalCode) {
      setErrorMessage('Please complete all required shipping address fields.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const shippingAddress: ShippingAddress = {
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      name: fullName,
      line1: street,
      postcode: postalCode,
    };

    try {
      // 1. Create order and initiate Razorpay checkout on backend
      const checkoutRes = await ordersApi.checkout({
        items: cart,
        shippingAddress,
        currency,
        sizingKitVoucherCode: appliedVoucherCode || undefined,
        orderNotes: orderNotes || undefined,
        paymentMethod,
      });

      const razorpayOrderId = checkoutRes.razorpayOrderId;
      const razorpayKeyId = checkoutRes.razorpayKeyId || 'rzp_test_HeirestDemoKey2026';
      const orderId = checkoutRes.id;
      const amountInCents = checkoutRes.amountInCents || Math.round(finalTotalUSD * 100);

      // 2. Open Razorpay Gateway
      await openRazorpayCheckout(
        {
          key: razorpayKeyId,
          amount: amountInCents,
          currency: currency === 'AUD' ? 'AUD' : 'USD',
          name: 'HEIREST ATELIER',
          description: `Order ${checkoutRes.orderNumber} - Bespoke Commission`,
          order_id: razorpayOrderId,
          prefill: {
            name: fullName,
            email,
            contact: phone,
          },
          notes: {
            orderId,
            orderNumber: checkoutRes.orderNumber,
          },
          handler: async (response) => {
            try {
              // 3. Verify Payment Signature on Backend
              const verificationRes = await ordersApi.verifyPayment({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                method: paymentMethod,
              });

              const capturedOrder = verificationRes.order || checkoutRes;
              const generatedVoucher = verificationRes.sizingKitVoucherGenerated;

              onPaymentSuccess(capturedOrder, generatedVoucher);
              setSuccessOrder({
                ...capturedOrder,
                sizingKitVoucherGenerated: generatedVoucher,
              });
            } catch (err: any) {
              setErrorMessage(err?.response?.data?.error?.message || 'Payment signature verification failed.');
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        },
        async (error) => {
          // Record payment failure on backend
          await ordersApi.reportPaymentFailure({
            orderId,
            razorpayOrderId,
            errorCode: error?.code,
            errorDescription: error?.description || 'Payment cancelled or declined by issuing bank',
            metadata: error,
          });
          setErrorMessage(error?.description || 'Payment was declined or cancelled. Please select another card or retry.');
          setLoading(false);
        }
      );
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error?.message || err?.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  const copyVoucherToClipboard = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedVoucher(true);
    setTimeout(() => setCopiedVoucher(false), 2000);
  };

  if (!isCheckoutOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!loading && !successOrder) checkoutClose();
          }}
          className="fixed inset-0 bg-[#141413]/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative w-full max-w-4xl bg-[#FAF9F5] border border-[#E5E1D8] shadow-2xl z-10 my-auto max-h-[92vh] flex flex-col"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8] bg-[#141413] text-[#F3F1EC]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6rem] tracking-[0.2em] font-mono text-[#C5A880] uppercase">
                  HEIREST ATELIER &bull; SECURE CHECKOUT
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-light font-serif mt-0.5 text-[#F3F1EC]">
                {successOrder ? 'Commission Confirmed' : 'Payment & Courier Dispatch'}
              </h2>
            </div>
            {!loading && (
              <button
                onClick={checkoutClose}
                className="p-2 opacity-60 hover:opacity-100 transition-opacity text-[#F3F1EC]"
                aria-label="Close checkout"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
            {successOrder ? (
              // ── ORDER SUCCESS SCREEN ──
              <div className="text-center py-6 sm:py-10 max-w-lg mx-auto space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[#C5A880]/15 border border-[#C5A880] flex items-center justify-center mx-auto text-[#C5A880]">
                  <Sparkles size={28} />
                </div>

                <div>
                  <span className="text-[0.65rem] font-mono tracking-[0.2em] text-[#C5A880] uppercase">
                    COMMISSION ACQUIRED &bull; PAYMENT CAPTURED
                  </span>
                  <h3 className="text-3xl font-serif font-light text-[#141413] mt-1">
                    Your Heirloom Awaits.
                  </h3>
                  <p className="text-xs font-mono text-stone-500 mt-2">
                    ORDER REFERENCE: <strong className="text-[#141413]">{successOrder.orderNumber}</strong>
                  </p>
                </div>

                {/* 8-Stage Pipeline Notification */}
                <div className="bg-white border border-[#E5E1D8] p-5 text-left space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Check size={16} />
                    <span className="text-xs font-mono tracking-widest uppercase font-medium">
                      8-Stage Manufacturing Pipeline Unlocked
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    Stage 01 <strong>(Specs Locked)</strong> has been initiated. Our master craftsmen will review your parametric gemstone settings and formulate the lost-wax casting tree.
                  </p>
                </div>

                {/* Automatic $19 Sizing Kit Voucher Banner if Generated */}
                {successOrder.sizingKitVoucherGenerated && (
                  <div className="bg-[#141413] text-[#F3F1EC] p-5 text-left border border-[#C5A880]/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A880]/10 rounded-full blur-xl pointer-events-none" />
                    <p className="text-[0.62rem] tracking-[0.2em] font-mono text-[#C5A880] uppercase mb-1">
                      COMPLIMENTARY RING SIZING KIT PROMO
                    </p>
                    <p className="text-base font-serif text-[#FAF9F5] font-light">
                      $19 Sizing Kit Credit Voucher Unlocked
                    </p>
                    <p className="text-xs text-stone-300 mt-1">
                      As promised, your $19 sizing kit fee is fully redeemable on your next bespoke ring order.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-black/40 border border-[#C5A880]/50 px-3 py-2 font-mono text-sm tracking-widest text-[#C5A880]">
                        {successOrder.sizingKitVoucherGenerated}
                      </div>
                      <button
                        onClick={() => copyVoucherToClipboard(successOrder.sizingKitVoucherGenerated)}
                        className="px-4 py-2 bg-[#C5A880] text-[#141413] text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-1.5"
                      >
                        {copiedVoucher ? <Check size={12} /> : <Copy size={12} />}
                        {copiedVoucher ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => {
                      checkoutClose();
                      setActiveAccountTab('orders');
                      navigate('/account?tab=orders');
                    }}
                    className="flex-1 py-3.5 bg-[#141413] text-[#F3F1EC] text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    View in QC &amp; Stage Tracker
                  </button>
                  <button
                    onClick={() => {
                      checkoutClose();
                      navigate('/collections/all');
                    }}
                    className="flex-1 py-3.5 border border-[#141413] text-[#141413] text-xs font-mono uppercase tracking-widest hover:bg-[#141413] hover:text-[#F3F1EC] transition-all"
                  >
                    Continue Exploring
                  </button>
                </div>
              </div>
            ) : (
              // ── CHECKOUT FORM ──
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Shipping & Payment Details */}
                <div className="lg:col-span-7 space-y-6">
                  {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 font-sans">
                      <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">{errorMessage}</div>
                    </div>
                  )}

                  {/* Section: Shipping Address */}
                  <div>
                    <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-stone-500 mb-4 pb-1 border-b border-[#E5E1D8]">
                      01 &bull; Insured Delivery Address
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="section-label block mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="input-underline"
                          placeholder="Lord / Lady / Name"
                        />
                      </div>
                      <div>
                        <label className="section-label block mb-1">Email (Digital Certificate) *</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-underline"
                          placeholder="client@heirest.co"
                        />
                      </div>
                      <div>
                        <label className="section-label block mb-1">Contact Phone (Courier) *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="input-underline"
                          placeholder="+61 400 000 000"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="section-label block mb-1">Street Address *</label>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="input-underline"
                          placeholder="Residence, Suite, Apartment"
                        />
                      </div>
                      <div>
                        <label className="section-label block mb-1">City / Suburb *</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="input-underline"
                        />
                      </div>
                      <div>
                        <label className="section-label block mb-1">State / Province</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="input-underline"
                        />
                      </div>
                      <div>
                        <label className="section-label block mb-1">Postal Code *</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="input-underline"
                        />
                      </div>
                      <div>
                        <label className="section-label block mb-1">Country</label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="input-underline"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Order Notes & Engravings */}
                  <div>
                    <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-stone-500 mb-2 pb-1 border-b border-[#E5E1D8]">
                      02 &bull; Atelier Inscriptions &amp; Requests
                    </h3>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Special delivery instructions, gift message, or custom loupe inspection notes..."
                      className="input-underline resize-none"
                    />
                  </div>

                  {/* Section: Payment Method */}
                  <div>
                    <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-stone-500 mb-3 pb-1 border-b border-[#E5E1D8]">
                      03 &bull; Payment Selection
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('RAZORPAY')}
                        className={`p-3.5 border text-left flex flex-col justify-between transition-all ${
                          paymentMethod === 'RAZORPAY'
                            ? 'border-[#141413] bg-white shadow-sm'
                            : 'border-[#E5E1D8] bg-[#FAF9F5] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <CreditCard size={18} className="text-[#C5A880]" />
                          {paymentMethod === 'RAZORPAY' && <Check size={14} className="text-[#141413]" />}
                        </div>
                        <div>
                          <p className="text-xs font-mono uppercase tracking-widest text-[#141413]">
                            Razorpay Gateway
                          </p>
                          <p className="text-[0.65rem] text-stone-500 mt-0.5">
                            Credit/Debit, NetBanking, UPI
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('BNPL_INSTALLMENTS')}
                        className={`p-3.5 border text-left flex flex-col justify-between transition-all ${
                          paymentMethod === 'BNPL_INSTALLMENTS'
                            ? 'border-[#141413] bg-white shadow-sm'
                            : 'border-[#E5E1D8] bg-[#FAF9F5] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <Layers size={18} className="text-[#C5A880]" />
                          {paymentMethod === 'BNPL_INSTALLMENTS' && <Check size={14} className="text-[#141413]" />}
                        </div>
                        <div>
                          <p className="text-xs font-mono uppercase tracking-widest text-[#141413]">
                            4x BNPL Payments
                          </p>
                          <p className="text-[0.65rem] text-stone-500 mt-0.5">
                            4&times; {formatBNPL(finalTotalUSD, currency)} interest-free
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Order Summary & Voucher Box */}
                <div className="lg:col-span-5 bg-white border border-[#E5E1D8] p-6 flex flex-col justify-between">
                  <div className="space-y-5">
                    <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-stone-500 pb-2 border-b border-[#E5E1D8]">
                      Commission Summary ({cart.length} {cart.length === 1 ? 'piece' : 'pieces'})
                    </h3>

                    {/* Cart Items List */}
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs pb-2 border-b border-[#F0ECE1]">
                          <div className="min-w-0 pr-2">
                            <p className="font-serif font-light text-sm text-[#141413] truncate">
                              {item.sku}
                            </p>
                            <p className="text-[0.7rem] text-stone-500 font-mono">
                              Qty: {item.quantity} &bull; {item.config.caratWeight ? `${item.config.caratWeight}ct` : 'Piece'}
                            </p>
                          </div>
                          <span className="font-mono text-stone-800 flex-shrink-0">
                            {formatPrice(item.priceUSD * item.quantity, currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Sizing Kit Voucher Field */}
                    <div className="pt-2">
                      <label className="section-label block mb-1">Redeem Sizing Kit Credit</label>
                      {isVoucherApplied ? (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200">
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-700" />
                            <div>
                              <p className="text-xs font-mono text-emerald-800 font-medium">
                                {appliedVoucherCode}
                              </p>
                              <p className="text-[0.65rem] text-emerald-600">
                                $19.00 credit applied to commission
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeVoucher}
                            className="text-[0.65rem] font-mono uppercase tracking-wider text-stone-500 hover:text-red-700 underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={voucherInput}
                            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                            placeholder="e.g. HEIREST-KIT-19"
                            className="input-underline text-xs uppercase font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => applyVoucher()}
                            className="px-3 py-2 text-[0.65rem] font-mono tracking-widest uppercase border border-[#141413] hover:bg-[#141413] hover:text-[#FAF9F5] transition-all"
                          >
                            Apply
                          </button>
                        </div>
                      )}

                      {/* Quick 1-click apply banner if user has unredeemed sizing kit */}
                      {!isVoucherApplied && (authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode) && !(authUser?.sizingKitRedeemed || user.sizingKitRedeemed) && (
                        <div className="mt-2 p-2 bg-[#C5A880]/10 border border-[#C5A880]/30 text-xs flex items-center justify-between">
                          <span className="text-[0.7rem] text-[#141413]">
                            Available $19 Credit: <strong>{authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => applyVoucher(authUser?.sizingKitVoucherCode || user.sizingKitVoucherCode)}
                            className="text-[0.65rem] font-mono uppercase text-[#C5A880] hover:underline font-bold"
                          >
                            Apply $19
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="pt-3 border-t border-[#E5E1D8] space-y-1.5 text-xs font-sans">
                      <div className="flex justify-between text-stone-600">
                        <span>Craftsmanship Subtotal</span>
                        <span className="font-mono">{formatPrice(subtotalUSD, currency)}</span>
                      </div>
                      {isVoucherApplied && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Sizing Kit Credit Applied</span>
                          <span className="font-mono">-$19.00</span>
                        </div>
                      )}
                      <div className="flex justify-between text-stone-600">
                        <span>DHL Express Insured Courier</span>
                        <span className="text-[0.65rem] font-mono text-[#C5A880] tracking-wider uppercase font-medium">
                          COMPLIMENTARY
                        </span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Gemological Inspection &amp; QC</span>
                        <span className="text-[0.65rem] font-mono text-[#C5A880] tracking-wider uppercase font-medium">
                          INCLUDED
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-serif font-light text-[#141413] pt-3 border-t border-[#E5E1D8]">
                        <span>Total Due</span>
                        <span className="text-xl font-light">
                          {formatPrice(finalTotalUSD, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <div className="pt-6 space-y-3">
                    <button
                      type="button"
                      disabled={loading || cart.length === 0}
                      onClick={handlePay}
                      className="w-full py-4 bg-[#141413] hover:bg-[#2A2A28] disabled:opacity-50 text-[#F3F1EC] text-xs font-mono tracking-[0.18em] uppercase transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.99]"
                    >
                      <Lock size={14} className="text-[#C5A880]" />
                      <span>
                        {loading ? 'Initiating Gateway...' : `Authorize & Pay ${formatPrice(finalTotalUSD, currency)}`}
                      </span>
                    </button>

                    <div className="flex items-center justify-center gap-4 text-[0.62rem] text-stone-500 font-mono">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={12} className="text-[#C5A880]" />
                        256-BIT SSL
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Truck size={12} className="text-[#C5A880]" />
                        FULLY INSURED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
