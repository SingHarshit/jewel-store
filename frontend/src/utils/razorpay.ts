declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in smallest currency unit (cents / paise)
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

let scriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads Razorpay checkout.js script
 */
export function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Failed to load official Razorpay SDK script. Sandbox test mode will be used.');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Initiates Razorpay Checkout modal or sandbox simulator
 */
export async function openRazorpayCheckout(
  options: RazorpayOptions,
  onFailure?: (error: any) => void
): Promise<void> {
  const loaded = await loadRazorpayScript();

  if (loaded && window.Razorpay) {
    try {
      const rzpInstance = new window.Razorpay({
        ...options,
        theme: {
          color: '#141413', // Heirest Espresso
          backdrop_color: 'rgba(20, 20, 19, 0.75)',
          ...options.theme,
        },
      });

      rzpInstance.on('payment.failed', function (response: any) {
        if (onFailure) {
          onFailure(response.error);
        }
      });

      rzpInstance.open();
      return;
    } catch (err) {
      console.warn('Error invoking Razorpay Checkout window, switching to luxury simulation modal:', err);
    }
  }

  // Resilient Sandbox Mode (when offline or script blocked by adblocker)
  showSandboxModal(options, onFailure);
}

/**
 * Embedded luxury sandbox payment modal fallback
 */
function showSandboxModal(
  options: RazorpayOptions,
  onFailure?: (error: any) => void
) {
  const existingModal = document.getElementById('heirest-rzp-sandbox-modal');
  if (existingModal) existingModal.remove();

  const container = document.createElement('div');
  container.id = 'heirest-rzp-sandbox-modal';
  container.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in';

  const amountDisplay = (options.amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: options.currency || 'USD',
  });

  container.innerHTML = `
    <div class="w-full max-w-md bg-[#FAF9F5] border border-[#E5E1D8] shadow-2xl p-6 sm:p-8 font-sans text-[#141413] relative animate-scale-up">
      <div class="flex items-center justify-between pb-4 border-b border-[#E5E1D8]">
        <div>
          <span class="text-[0.62rem] tracking-[0.2em] uppercase font-mono text-[#C5A880]">Heirest Secure Gateway</span>
          <h3 class="text-xl font-light font-serif mt-0.5">Razorpay Checkout</h3>
        </div>
        <span class="text-[0.6rem] font-mono px-2 py-0.5 border border-[#C5A880] text-[#C5A880] bg-[#C5A880]/10 uppercase tracking-widest">Sandbox</span>
      </div>

      <div class="py-6 space-y-4">
        <div class="bg-white p-4 border border-[#E5E1D8] flex justify-between items-center">
          <div>
            <p class="text-xs text-stone-500 font-mono">ORDER REFERENCE</p>
            <p class="text-xs font-mono text-[#141413] mt-0.5">${options.order_id}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-stone-500 font-mono">TOTAL DUE</p>
            <p class="text-lg font-serif font-light text-[#141413]">${amountDisplay}</p>
          </div>
        </div>

        <div class="space-y-2 text-xs text-stone-600 font-sans">
          <p class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Test payment mode: Choose authorization result below.
          </p>
          <p class="text-[0.7rem] text-stone-400 font-mono">Pre-filled: ${options.prefill?.name || 'Customer'} &bull; ${options.prefill?.email || ''}</p>
        </div>
      </div>

      <div class="flex flex-col gap-2.5 pt-2">
        <button id="rzp-sim-success" class="w-full py-3.5 bg-[#141413] hover:bg-[#2A2A28] text-[#F3F1EC] text-xs font-mono tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2">
          <span>Authorize &amp; Pay ${amountDisplay}</span>
        </button>

        <button id="rzp-sim-fail" class="w-full py-2.5 border border-red-300 text-red-700 hover:bg-red-50 text-[0.68rem] font-mono tracking-widest uppercase transition-all">
          Simulate Payment Failure
        </button>

        <button id="rzp-sim-cancel" class="w-full py-2 text-stone-500 hover:text-stone-800 text-[0.65rem] font-mono tracking-widest uppercase transition-all">
          Cancel &amp; Return to Bag
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const cleanup = () => {
    container.remove();
  };

  document.getElementById('rzp-sim-success')?.addEventListener('click', () => {
    cleanup();
    const mockPaymentId = `pay_rzp_${Date.now()}`;
    const mockSignature = `demo_sig_${mockPaymentId}`;
    options.handler({
      razorpay_payment_id: mockPaymentId,
      razorpay_order_id: options.order_id,
      razorpay_signature: mockSignature,
    });
  });

  document.getElementById('rzp-sim-fail')?.addEventListener('click', () => {
    cleanup();
    if (onFailure) {
      onFailure({
        code: 'BAD_REQUEST_ERROR',
        description: 'Customer test card was declined',
        source: 'bank',
        step: 'payment_authorization',
        reason: 'payment_declined',
      });
    }
  });

  document.getElementById('rzp-sim-cancel')?.addEventListener('click', () => {
    cleanup();
    if (options.modal?.ondismiss) {
      options.modal.ondismiss();
    }
  });
}
