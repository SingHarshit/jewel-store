import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, ArrowRight, RotateCcw, Sparkles, Mail, Shield } from 'lucide-react';
import { useJewelryStore } from '../../store/useJewelryStore';
import { authApi } from '../../services/api';
import type { AuthModalView } from '../../store/useJewelryStore';

// ── Password strength ──────────────────────────────────────────
function passwordStrength(pw: string): { level: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: '', color: 'transparent' },
    { label: 'Weak', color: '#CC2244' },
    { label: 'Fair', color: '#C5A880' },
    { label: 'Good', color: '#6AC8E8' },
    { label: 'Strong', color: '#2D8A5A' },
  ];
  return { level: score, ...map[score] };
}

// ── OTP Input ─────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/, '').slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="flex gap-3 justify-center my-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-14 text-center text-xl border focus:outline-none transition-colors"
          style={{
            fontFamily: 'var(--font-mono)',
            borderColor: value[i] ? 'var(--color-espresso)' : 'var(--color-hairline)',
            backgroundColor: 'var(--color-ivory)',
            color: 'var(--color-espresso)',
            letterSpacing: '0.05em',
          }}
        />
      ))}
    </div>
  );
}

// ── Social Button (used within view sub-components) ──────────
function SocialBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 flex-1 py-2.5 border text-[0.62rem] tracking-widest uppercase font-mono transition-all hover:border-[var(--color-espresso)] hover:bg-[var(--color-ivory)]"
      style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-espresso)' }}
    >
      {icon} {label}
    </button>
  );
}

// ── Main AuthDrawer ────────────────────────────────────────────
export default function AuthDrawer() {
  const {
    authModalOpen,
    authModalView,
    closeAuthModal,
    setAuthModalView,
    onAuthSuccess,
    postAuthRedirect,
  } = useJewelryStore();

  // ── Login state ──────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);

  // ── Register state ───────────────────────────────────────────
  const [regFirst, setRegFirst] = useState('');
  const [regLast, setRegLast] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNewsletter, setRegNewsletter] = useState(true);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const strength = passwordStrength(regPassword);

  // ── OTP state ────────────────────────────────────────────────
  const [otpDigits, setOtpDigits] = useState<string[]>([]);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ── Resend countdown ─────────────────────────────────────────
  useEffect(() => {
    if (!resendTimer) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Redirect after auth ───────────────────────────────────────
  const handleSuccess = (user: Parameters<typeof onAuthSuccess>[0], token: string) => {
    onAuthSuccess(user, token);
    if (postAuthRedirect) window.location.href = postAuthRedirect;
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await authApi.login({ email: loginEmail, password: loginPassword });
      handleSuccess(res.user, res.token);
    } catch (err: any) {
      setLoginError(err?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMagicRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await authApi.requestMagicLink(loginEmail);
      setOtpEmail(loginEmail);
      setResendTimer(30);
      setAuthModalView('magic-otp');
    } catch {
      setLoginError('Could not send passcode. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);
    const code = otpDigits.join('');
    if (code.length !== 6) { setOtpError('Please enter all 6 digits.'); setOtpLoading(false); return; }
    try {
      const res = await authApi.verifyOtp(otpEmail, code);
      handleSuccess(res.user, res.token);
    } catch (err: any) {
      setOtpError(err?.message ?? 'Invalid code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regFirst || !regLast || !regEmail || !regPassword) {
      setRegError('All required fields must be filled.'); return;
    }
    setRegLoading(true);
    try {
      const res = await authApi.register({
        firstName: regFirst,
        lastName: regLast,
        email: regEmail,
        password: regPassword,
        authorHandle: regHandle || undefined,
        newsletterOptIn: regNewsletter,
      });
      handleSuccess(res.user, res.token);
    } catch (err: any) {
      setRegError(err?.message ?? 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const res = await authApi.loginWithGoogle();
      handleSuccess(res.user, res.token);
    } catch { /* silent */ }
  };
  const handleApple = async () => {
    try {
      const res = await authApi.loginWithApple();
      handleSuccess(res.user, res.token);
    } catch { /* silent */ }
  };
  const handleDemo = () => {
    const res = authApi.loginAsDemo();
    handleSuccess(res.user, res.token);
  };
  const handleAdminDemo = () => {
    const res = authApi.loginAsAdmin();
    handleSuccess(res.user, res.token);
  };

  const switchView = (v: AuthModalView) => {
    setLoginError(''); setRegError(''); setOtpError('');
    setAuthModalView(v);
  };

  const drawerContent = {
    login: <LoginView
      email={loginEmail} setEmail={setLoginEmail}
      password={loginPassword} setPassword={setLoginPassword}
      showPassword={showPassword} setShowPassword={setShowPassword}
      error={loginError} loading={loginLoading}
      useMagicLink={useMagicLink} setUseMagicLink={setUseMagicLink}
      onSubmit={useMagicLink ? handleMagicRequest : handleLogin}
      onGoogle={handleGoogle} onApple={handleApple} onDemo={handleDemo} onAdminDemo={handleAdminDemo}
      switchToRegister={() => switchView('register')}
      switchToForgot={() => switchView('forgot-password')}
    />,
    register: <RegisterView
      first={regFirst} setFirst={setRegFirst}
      last={regLast} setLast={setRegLast}
      email={regEmail} setEmail={setRegEmail}
      handle={regHandle} setHandle={setRegHandle}
      password={regPassword} setPassword={setRegPassword}
      newsletter={regNewsletter} setNewsletter={setRegNewsletter}
      strength={strength}
      showPassword={showPassword} setShowPassword={setShowPassword}
      error={regError} loading={regLoading}
      onSubmit={handleRegister}
      onGoogle={handleGoogle} onApple={handleApple}
      switchToLogin={() => switchView('login')}
    />,
    'forgot-password': <ForgotView
      email={loginEmail} setEmail={setLoginEmail}
      error={loginError} loading={loginLoading}
      onSubmit={handleMagicRequest}
      switchToLogin={() => switchView('login')}
    />,
    'magic-otp': <OtpView
      email={otpEmail}
      digits={otpDigits} setDigits={setOtpDigits}
      error={otpError} loading={otpLoading}
      resendTimer={resendTimer}
      onSubmit={handleOtpVerify}
      onResend={async () => {
        setResendTimer(30);
        await authApi.requestMagicLink(otpEmail);
      }}
      switchToLogin={() => switchView('login')}
    />,
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(20,20,19,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={closeAuthModal}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
            className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: 'var(--color-alabaster)',
              borderLeft: '1px solid var(--color-hairline)',
              boxShadow: '-24px 0 80px rgba(20,20,19,0.15)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-8 py-5 border-b flex-shrink-0"
              style={{ borderColor: 'var(--color-hairline)' }}
            >
              <div
                className="text-[0.6rem] tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-stone)' }}
              >
                Heirest Atelier
              </div>
              <button
                onClick={closeAuthModal}
                className="p-1 opacity-40 hover:opacity-100 transition-opacity"
                aria-label="Close"
              >
                <X size={18} style={{ color: 'var(--color-espresso)' }} />
              </button>
            </div>

            {/* View tabs */}
            <div
              className="flex border-b flex-shrink-0"
              style={{ borderColor: 'var(--color-hairline)' }}
            >
              {(['login', 'register'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  className="flex-1 py-3 text-[0.62rem] tracking-[0.15em] uppercase font-mono transition-colors"
                  style={{
                    color: authModalView === v ? 'var(--color-espresso)' : 'var(--color-stone)',
                    borderBottom: authModalView === v ? '1.5px solid var(--color-espresso)' : '1.5px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  {v === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 px-8 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={authModalView}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {drawerContent[authModalView]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div
              className="px-8 py-4 border-t text-center flex-shrink-0"
              style={{ borderColor: 'var(--color-hairline)' }}
            >
              <p className="text-[0.6rem] tracking-wide" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
                By continuing you agree to Heirest's{' '}
                <span className="underline cursor-pointer opacity-80">Terms</span> and{' '}
                <span className="underline cursor-pointer opacity-80">Privacy Policy</span>.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-views
// ═══════════════════════════════════════════════════════════════

// ── Login View ────────────────────────────────────────────────
function LoginView({
  email, setEmail, password, setPassword,
  showPassword, setShowPassword,
  error, loading, useMagicLink, setUseMagicLink,
  onSubmit, onGoogle, onApple, onDemo, onAdminDemo,
  switchToRegister, switchToForgot,
}: any) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
        Welcome Back to<br />Your Atelier
      </h2>
      <p className="mt-2 mb-5 text-sm" style={{ color: 'var(--color-stone)' }}>
        Sign in to access your Vault, Designs & live orders.
      </p>

      {/* Demo buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={onDemo}
          className="flex items-center justify-center gap-2 py-2.5 text-[0.6rem] tracking-widest uppercase font-mono border transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-champagne)', borderColor: 'var(--color-espresso)' }}
        >
          <Sparkles size={11} />
          Customer Demo
        </button>
        <button
          onClick={onAdminDemo}
          className="flex items-center justify-center gap-2 py-2.5 text-[0.6rem] tracking-widest uppercase font-mono border transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-champagne)', color: 'var(--color-espresso)', borderColor: 'var(--color-champagne)' }}
        >
          <Shield size={11} />
          Admin Demo
        </button>
      </div>
      <p className="text-center text-[0.58rem] font-mono mb-5" style={{ color: 'var(--color-stone)' }}>
        @indiemoxley · Customer &nbsp;|&nbsp; admin@heirest.com · Admin
      </p>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
        <span className="text-[0.6rem] tracking-widest uppercase font-mono" style={{ color: 'var(--color-stone)' }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="section-label block mb-1.5">Email Address</label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-underline" placeholder="your@email.com"
            autoComplete="email"
          />
        </div>

        {!useMagicLink && (
          <div>
            <label className="section-label block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-underline pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              type="button"
              onClick={switchToForgot}
              className="mt-1.5 text-[0.6rem] tracking-wider font-mono opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-stone)' }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <p className="text-[0.68rem] font-mono" style={{ color: '#CC2244' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-[0.68rem] tracking-widest uppercase font-mono flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          {loading ? 'Signing In…' : (useMagicLink ? <><Mail size={12} /> Send 6-Digit Passcode</> : <><ArrowRight size={12} /> Sign In</>)}
        </button>
      </form>

      <button
        onClick={() => setUseMagicLink(!useMagicLink)}
        className="mt-3 w-full text-[0.62rem] tracking-widest uppercase font-mono py-2 border transition-all hover:border-[var(--color-espresso)]"
        style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-stone)' }}
      >
        {useMagicLink ? 'Use Password Instead' : 'Sign in with 6-Digit Passcode'}
      </button>

      <div className="flex gap-3 mt-4">
        <SocialBtn icon={<GoogleIcon />} label="Google" onClick={onGoogle} />
        <SocialBtn icon={<AppleIcon />} label="Apple" onClick={onApple} />
      </div>

      <p className="mt-7 text-center text-[0.65rem] font-mono" style={{ color: 'var(--color-stone)' }}>
        New to Heirest?{' '}
        <button onClick={switchToRegister} className="underline hover:opacity-70" style={{ color: 'var(--color-espresso)' }}>
          Create your archive
        </button>
      </p>
    </div>
  );
}

// ── Register View ─────────────────────────────────────────────
function RegisterView({
  first, setFirst, last, setLast, email, setEmail,
  handle, setHandle, password, setPassword,
  newsletter, setNewsletter, strength,
  showPassword, setShowPassword,
  error, loading, onSubmit, onGoogle, onApple, switchToLogin,
}: any) {
  const previewHandle = handle ? `@${handle.replace(/^@/, '')}` : first ? `@${first.toLowerCase()}` : '@yourhandle';
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
        Author Your Archive
      </h2>

      {/* Benefits bar */}
      <div className="mt-3 mb-6 p-3 space-y-1.5" style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}>
        {[
          'Save unlimited 3D configurations',
          'Access your Digital Vault & IGI Certificates',
          'Track 8-stage bespoke crafting',
          'Claim your @author handle',
        ].map((b) => (
          <p key={b} className="text-[0.65rem] font-mono flex items-start gap-2" style={{ color: 'var(--color-stone)' }}>
            <span style={{ color: 'var(--color-champagne)' }}>✦</span>{b}
          </p>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <SocialBtn icon={<GoogleIcon />} label="Google" onClick={onGoogle} />
        <SocialBtn icon={<AppleIcon />} label="Apple" onClick={onApple} />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
        <span className="text-[0.6rem] tracking-widest uppercase font-mono" style={{ color: 'var(--color-stone)' }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="section-label block mb-1.5">First Name *</label>
            <input className="input-underline" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="India" required />
          </div>
          <div>
            <label className="section-label block mb-1.5">Last Name *</label>
            <input className="input-underline" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Moxley" required />
          </div>
        </div>

        <div>
          <label className="section-label block mb-1.5">Email Address *</label>
          <input type="email" className="input-underline" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email" />
        </div>

        <div>
          <label className="section-label block mb-1.5">@Author Handle</label>
          <input
            className="input-underline"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/[^a-z0-9_]/gi, ''))}
            placeholder="indiemoxley"
          />
          <p className="mt-1 text-[0.6rem] font-mono" style={{ color: 'var(--color-champagne)' }}>
            author {previewHandle}
          </p>
        </div>

        <div>
          <label className="section-label block mb-1.5">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-underline pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {password && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: 'var(--color-hairline)' }}>
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${(strength.level / 4) * 100}%`, backgroundColor: strength.color }}
                />
              </div>
              <span className="text-[0.58rem] font-mono" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            className="mt-0.5 accent-[var(--color-champagne)]"
          />
          <span className="text-[0.65rem] font-mono leading-relaxed" style={{ color: 'var(--color-stone)' }}>
            Receive editorial drops, new collection launches & private sale invitations
          </span>
        </label>

        {error && (
          <p className="text-[0.68rem] font-mono" style={{ color: '#CC2244' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-[0.68rem] tracking-widest uppercase font-mono flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          {loading ? 'Creating Archive…' : <><ArrowRight size={12} /> Create Account</>}
        </button>
      </form>

      <p className="mt-5 text-center text-[0.65rem] font-mono" style={{ color: 'var(--color-stone)' }}>
        Already have an account?{' '}
        <button onClick={switchToLogin} className="underline hover:opacity-70" style={{ color: 'var(--color-espresso)' }}>
          Sign in
        </button>
      </p>
    </div>
  );
}

// ── Forgot Password View ──────────────────────────────────────
function ForgotView({ email, setEmail, error, loading, onSubmit, switchToLogin }: any) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
        Reset Your Access
      </h2>
      <p className="mt-2 mb-7 text-sm" style={{ color: 'var(--color-stone)' }}>
        Enter your email and we'll send a 6-digit secure passcode.
      </p>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="section-label block mb-1.5">Email Address</label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-underline" placeholder="your@email.com"
          />
        </div>
        {error && <p className="text-[0.68rem] font-mono" style={{ color: '#CC2244' }}>{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 text-[0.68rem] tracking-widest uppercase font-mono flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          {loading ? 'Sending…' : <><Mail size={12} /> Send Passcode</>}
        </button>
      </form>
      <button onClick={switchToLogin} className="mt-4 w-full text-center text-[0.62rem] font-mono opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-stone)' }}>
        ← Back to Sign In
      </button>
    </div>
  );
}

// ── OTP Verify View ───────────────────────────────────────────
function OtpView({ email, digits, setDigits, error, loading, resendTimer, onSubmit, onResend, switchToLogin }: any) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
        Enter Your Passcode
      </h2>
      <p className="mt-2 mb-2 text-sm" style={{ color: 'var(--color-stone)' }}>
        A 6-digit code was sent to
      </p>
      <p className="text-sm font-mono mb-1" style={{ color: 'var(--color-espresso)' }}>{email}</p>
      <p className="mb-2 text-[0.6rem] font-mono" style={{ color: 'var(--color-stone)' }}>(In demo mode, any 6 digits will work)</p>

      <form onSubmit={onSubmit}>
        <OtpInput value={digits} onChange={setDigits} />
        {error && <p className="text-[0.68rem] font-mono mb-3 text-center" style={{ color: '#CC2244' }}>{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 text-[0.68rem] tracking-widest uppercase font-mono flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}
        >
          {loading ? 'Verifying…' : <><ArrowRight size={12} /> Verify & Sign In</>}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          onClick={onResend}
          disabled={resendTimer > 0}
          className="flex items-center gap-1.5 text-[0.62rem] font-mono transition-opacity disabled:opacity-40"
          style={{ color: 'var(--color-stone)' }}
        >
          <RotateCcw size={10} />
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
        </button>
        <span style={{ color: 'var(--color-hairline)' }}>|</span>
        <button onClick={switchToLogin} className="text-[0.62rem] font-mono opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-stone)' }}>
          Change email
        </button>
      </div>
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

