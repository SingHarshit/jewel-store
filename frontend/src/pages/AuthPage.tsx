import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Mail, RotateCcw, Sparkles, Shield, Truck } from 'lucide-react';
import { useJewelryStore } from '../store/useJewelryStore';
import { authApi } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────
type PageView = 'login' | 'register' | 'forgot-password' | 'magic-otp';

function passwordStrength(pw: string) {
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
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-12 h-16 text-center text-2xl border focus:outline-none transition-colors"
          style={{
            fontFamily: 'var(--font-mono)',
            borderColor: value[i] ? 'var(--color-espresso)' : 'var(--color-hairline)',
            backgroundColor: 'var(--color-ivory)',
            color: 'var(--color-espresso)',
          }}
        />
      ))}
    </div>
  );
}

function SocialBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 flex-1 py-3 border text-xs tracking-widest uppercase font-mono transition-all hover:border-[var(--color-espresso)] hover:bg-[var(--color-ivory)]"
      style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-espresso)' }}
    >
      {icon}{label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ── Left editorial panel ──────────────────────────────────────
function EditorialPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-espresso)', minHeight: '100vh' }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--color-champagne) 0, var(--color-champagne) 1px, transparent 0, transparent 50%)',
          backgroundSize: '12px 12px',
        }}
      />

      {/* Logo */}
      <Link to="/" className="relative z-10" style={{ fontFamily: 'var(--font-serif)' }}>
        <span className="text-3xl font-light tracking-[-0.04em]" style={{ color: 'var(--color-alabaster)' }}>
          Heirest
        </span>
        <span className="block text-[0.55rem] tracking-[0.2em] uppercase mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-champagne)' }}>
          Fine Jewellery
        </span>
      </Link>

      {/* Main editorial content */}
      <div className="relative z-10 space-y-10">
        {/* Pull-quote */}
        <div>
          <div className="text-5xl mb-4" style={{ color: 'var(--color-champagne)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>"</div>
          <blockquote
            style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 300, color: 'var(--color-alabaster)', lineHeight: 1.4 }}
          >
            Fine jewellery has long been shaped by convention, placing the decision in everyone's hands but yours.
          </blockquote>
          <p className="mt-4 text-[0.62rem] tracking-widest uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-champagne)' }}>
            — The Heirest Manifesto
          </p>
        </div>

        {/* Live piece preview card */}
        <div
          className="p-5 border"
          style={{ borderColor: 'rgba(197,168,128,0.3)', backgroundColor: 'rgba(197,168,128,0.06)' }}
        >
          <p className="text-[0.58rem] tracking-widest uppercase mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-champagne)' }}>
            Community Authored Piece
          </p>
          {/* Simulated SVG ring */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: '2px solid rgba(197,168,128,0.4)', backgroundColor: 'rgba(197,168,128,0.1)' }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="12" stroke="#C5A880" strokeWidth="1.5" fill="none"/>
                <circle cx="18" cy="10" r="4" fill="#E8E8F8" opacity="0.9"/>
                <circle cx="14" cy="12" r="2.5" fill="#E8E8F8" opacity="0.7"/>
                <circle cx="22" cy="12" r="2.5" fill="#E8E8F8" opacity="0.7"/>
                <circle cx="11" cy="16" r="2" fill="#E8E8F8" opacity="0.6"/>
                <circle cx="25" cy="16" r="2" fill="#E8E8F8" opacity="0.6"/>
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
                RG-5S-CLW-SIG-PE-AL09YG-WLD
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--color-alabaster)', marginTop: 3 }}>
                Signature 5-Stone · 18K Rose Gold
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--color-champagne)', marginTop: 4 }}>
                author @indiemoxley
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="space-y-3">
          {[
            { icon: <Shield size={14} />, label: 'Complimentary Lifetime Warranty' },
            { icon: <Truck size={14} />, label: 'Insured Global Delivery' },
            { icon: <Sparkles size={14} />, label: '8-Stage Artisan Crafting Process' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span style={{ color: 'var(--color-champagne)' }}>{icon}</span>
              <span className="text-[0.65rem] tracking-wider uppercase font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <p className="relative z-10 text-[0.58rem] tracking-widest uppercase font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
        © {new Date().getFullYear()} Heirest Fine Jewellery
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main AuthPage
// ═══════════════════════════════════════════════════════════════
export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { onAuthSuccess, isAuthenticated } = useJewelryStore();

  // Derive initial view from route
  const initialView: PageView =
    location.pathname === '/register'
      ? 'register'
      : location.pathname === '/forgot-password'
      ? 'forgot-password'
      : 'login';

  const [view, setView] = useState<PageView>(initialView);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/account', { replace: true });
  }, [isAuthenticated, navigate]);

  // ── Form states ───────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);

  const [regFirst, setRegFirst] = useState('');
  const [regLast, setRegLast] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNewsletter, setRegNewsletter] = useState(true);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const strength = passwordStrength(regPassword);

  const [otpDigits, setOtpDigits] = useState<string[]>([]);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!resendTimer) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSuccess = (user: Parameters<typeof onAuthSuccess>[0], token: string) => {
    onAuthSuccess(user, token);
    navigate('/account', { replace: true });
  };

  const switchView = (v: PageView) => {
    setLoginError(''); setRegError(''); setOtpError('');
    setView(v);
    if (v === 'login') navigate('/login', { replace: true });
    else if (v === 'register') navigate('/register', { replace: true });
    else if (v === 'forgot-password') navigate('/forgot-password', { replace: true });
  };

  // ── Handlers ──────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError(''); setLoginLoading(true);
    try {
      const res = await authApi.login({ email: loginEmail, password: loginPassword });
      handleSuccess(res.user, res.token);
    } catch (err: any) { setLoginError(err?.message ?? 'Login failed.'); }
    finally { setLoginLoading(false); }
  };

  const handleMagicRequest = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError(''); setLoginLoading(true);
    try {
      await authApi.requestMagicLink(loginEmail);
      setOtpEmail(loginEmail); setResendTimer(30); setView('magic-otp');
    } catch { setLoginError('Could not send passcode.'); }
    finally { setLoginLoading(false); }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setOtpError(''); setOtpLoading(true);
    const code = otpDigits.join('');
    if (code.length !== 6) { setOtpError('Enter all 6 digits.'); setOtpLoading(false); return; }
    try {
      const res = await authApi.verifyOtp(otpEmail, code);
      handleSuccess(res.user, res.token);
    } catch (err: any) { setOtpError(err?.message ?? 'Invalid code.'); }
    finally { setOtpLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setRegError(''); setRegLoading(true);
    try {
      const res = await authApi.register({
        firstName: regFirst, lastName: regLast, email: regEmail,
        password: regPassword, authorHandle: regHandle || undefined, newsletterOptIn: regNewsletter,
      });
      handleSuccess(res.user, res.token);
    } catch (err: any) { setRegError(err?.message ?? 'Registration failed.'); }
    finally { setRegLoading(false); }
  };

  const handleGoogle = async () => { try { const r = await authApi.loginWithGoogle(); handleSuccess(r.user, r.token); } catch {} };
  const handleApple  = async () => { try { const r = await authApi.loginWithApple();  handleSuccess(r.user, r.token); } catch {} };
  const handleDemo   = () => { const r = authApi.loginAsDemo(); handleSuccess(r.user, r.token); };

  const previewHandle = regHandle
    ? `@${regHandle.replace(/^@/, '')}`
    : regFirst ? `@${regFirst.toLowerCase()}` : '@yourhandle';

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ backgroundColor: 'var(--color-alabaster)' }}>
      {/* Left — editorial */}
      <EditorialPanel />

      {/* Right — form */}
      <div className="flex items-center justify-center px-6 py-16 lg:px-16 xl:px-24">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden block mb-10" style={{ fontFamily: 'var(--font-serif)' }}>
            <span className="text-2xl font-light tracking-[-0.04em]" style={{ color: 'var(--color-espresso)' }}>Heirest</span>
          </Link>

          {/* Tabs (login / register) */}
          <div className="flex border-b mb-8" style={{ borderColor: 'var(--color-hairline)' }}>
            {(['login', 'register'] as const).map((v) => (
              <button
                key={v}
                onClick={() => switchView(v)}
                className="flex-1 pb-3 text-[0.65rem] tracking-[0.15em] uppercase font-mono transition-colors"
                style={{
                  color: view === v ? 'var(--color-espresso)' : 'var(--color-stone)',
                  borderBottom: view === v ? '1.5px solid var(--color-espresso)' : '1.5px solid transparent',
                  marginBottom: -1,
                }}
              >
                {v === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── LOGIN ─────────────────────────────────────── */}
            {(view === 'login' || view === 'forgot-password') && (
              <motion.div key="login-forgot" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {view === 'login' && (
                  <>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
                      Welcome Back<br />to Your Atelier
                    </h1>
                    <p className="mt-2 mb-7 text-sm" style={{ color: 'var(--color-stone)' }}>
                      Sign in to your Heirest archive.
                    </p>

                    {/* Demo */}
                    <button
                      onClick={handleDemo}
                      id="auth-demo-btn"
                      className="w-full mb-5 flex items-center justify-center gap-2 py-3.5 text-[0.65rem] tracking-widest uppercase font-mono transition-opacity hover:opacity-90"
                      style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-champagne)' }}
                    >
                      <Sparkles size={12} />
                      Instant Demo Client — @indiemoxley
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
                      <span className="text-[0.6rem] tracking-widest uppercase font-mono" style={{ color: 'var(--color-stone)' }}>or</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
                    </div>

                    <form id="auth-login-form" onSubmit={useMagicLink ? handleMagicRequest : handleLogin} className="space-y-5">
                      <div>
                        <label className="section-label block mb-1.5">Email Address</label>
                        <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="input-underline" placeholder="your@email.com" autoComplete="email" id="login-email" />
                      </div>
                      {!useMagicLink && (
                        <div>
                          <label className="section-label block mb-1.5">Password</label>
                          <div className="relative">
                            <input
                              id="login-password"
                              type={showPassword ? 'text' : 'password'}
                              value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                              className="input-underline pr-10" placeholder="••••••••" autoComplete="current-password"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
                              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          <button type="button" onClick={() => switchView('forgot-password')} className="mt-1.5 text-[0.6rem] tracking-wider font-mono opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-stone)' }}>
                            Forgot password?
                          </button>
                        </div>
                      )}
                      {loginError && <p className="text-[0.68rem] font-mono" style={{ color: '#CC2244' }}>{loginError}</p>}
                      <button id="login-submit" type="submit" disabled={loginLoading} className="w-full py-3.5 text-[0.68rem] tracking-widest uppercase font-mono flex items-center justify-center gap-2 transition-opacity disabled:opacity-60" style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}>
                        {loginLoading ? 'Signing In…' : useMagicLink ? <><Mail size={12} /> Send 6-Digit Passcode</> : <><ArrowRight size={12} /> Sign In</>}
                      </button>
                    </form>

                    <button onClick={() => setUseMagicLink(!useMagicLink)} className="mt-3 w-full py-2.5 border text-[0.62rem] tracking-widest uppercase font-mono transition-all hover:border-[var(--color-espresso)]" style={{ borderColor: 'var(--color-hairline)', color: 'var(--color-stone)' }}>
                      {useMagicLink ? 'Use Password Instead' : 'Sign in with 6-Digit Passcode'}
                    </button>

                    <div className="flex gap-3 mt-4">
                      <SocialBtn icon={<GoogleIcon />} label="Google" onClick={handleGoogle} />
                      <SocialBtn icon={<AppleIcon />} label="Apple" onClick={handleApple} />
                    </div>
                  </>
                )}

                {view === 'forgot-password' && (
                  <>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
                      Reset Your Access
                    </h1>
                    <p className="mt-2 mb-7 text-sm" style={{ color: 'var(--color-stone)' }}>
                      We'll send a 6-digit secure passcode to your email.
                    </p>
                    <form onSubmit={handleMagicRequest} className="space-y-5">
                      <div>
                        <label className="section-label block mb-1.5">Email Address</label>
                        <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="input-underline" placeholder="your@email.com" id="forgot-email" />
                      </div>
                      {loginError && <p className="text-[0.68rem] font-mono" style={{ color: '#CC2244' }}>{loginError}</p>}
                      <button type="submit" disabled={loginLoading} className="w-full py-3.5 text-[0.68rem] tracking-widest uppercase font-mono flex items-center justify-center gap-2 transition-opacity disabled:opacity-60" style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}>
                        {loginLoading ? 'Sending…' : <><Mail size={12} /> Send Passcode</>}
                      </button>
                    </form>
                    <button onClick={() => switchView('login')} className="mt-4 w-full text-center text-[0.62rem] font-mono opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-stone)' }}>
                      ← Back to Sign In
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* ── OTP ───────────────────────────────────────── */}
            {view === 'magic-otp' && (
              <motion.div key="otp" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
                  Enter Your Passcode
                </h1>
                <p className="mt-2 mb-1 text-sm" style={{ color: 'var(--color-stone)' }}>A 6-digit code was sent to</p>
                <p className="text-sm font-mono" style={{ color: 'var(--color-espresso)' }}>{otpEmail}</p>
                <p className="mt-1 text-[0.6rem] font-mono mb-2" style={{ color: 'var(--color-stone)' }}>(Demo: any 6 digits work)</p>
                <form onSubmit={handleOtpVerify}>
                  <OtpInput value={otpDigits} onChange={setOtpDigits} />
                  {otpError && <p className="text-[0.68rem] font-mono mb-3 text-center" style={{ color: '#CC2244' }}>{otpError}</p>}
                  <button type="submit" disabled={otpLoading} id="otp-submit" className="w-full py-3.5 text-[0.68rem] tracking-widest uppercase font-mono flex items-center justify-center gap-2 transition-opacity disabled:opacity-60" style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}>
                    {otpLoading ? 'Verifying…' : <><ArrowRight size={12} /> Verify & Sign In</>}
                  </button>
                </form>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button onClick={async () => { setResendTimer(30); await authApi.requestMagicLink(otpEmail); }} disabled={resendTimer > 0} className="flex items-center gap-1.5 text-[0.62rem] font-mono transition-opacity disabled:opacity-40" style={{ color: 'var(--color-stone)' }}>
                    <RotateCcw size={10} />{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                  </button>
                  <span style={{ color: 'var(--color-hairline)' }}>|</span>
                  <button onClick={() => switchView('login')} className="text-[0.62rem] font-mono opacity-60 hover:opacity-100" style={{ color: 'var(--color-stone)' }}>Change email</button>
                </div>
              </motion.div>
            )}

            {/* ── REGISTER ──────────────────────────────────── */}
            {view === 'register' && (
              <motion.div key="register" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 300, color: 'var(--color-espresso)' }}>
                  Author Your Archive
                </h1>

                {/* Benefits */}
                <div className="mt-3 mb-6 p-4" style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-hairline)' }}>
                  {['Save unlimited 3D configurations', 'Access your Digital Vault & IGI Certificates', 'Track 8-stage bespoke crafting', 'Claim your @author handle'].map((b) => (
                    <p key={b} className="text-[0.65rem] font-mono flex items-start gap-2 mb-1" style={{ color: 'var(--color-stone)' }}>
                      <span style={{ color: 'var(--color-champagne)' }}>✦</span>{b}
                    </p>
                  ))}
                </div>

                <div className="flex gap-3 mb-5">
                  <SocialBtn icon={<GoogleIcon />} label="Google" onClick={handleGoogle} />
                  <SocialBtn icon={<AppleIcon />} label="Apple" onClick={handleApple} />
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
                  <span className="text-[0.6rem] tracking-widest uppercase font-mono" style={{ color: 'var(--color-stone)' }}>or</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-hairline)' }} />
                </div>

                <form id="auth-register-form" onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="section-label block mb-1.5">First Name *</label>
                      <input id="reg-first" className="input-underline" value={regFirst} onChange={(e) => setRegFirst(e.target.value)} placeholder="India" required />
                    </div>
                    <div>
                      <label className="section-label block mb-1.5">Last Name *</label>
                      <input id="reg-last" className="input-underline" value={regLast} onChange={(e) => setRegLast(e.target.value)} placeholder="Moxley" required />
                    </div>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Email Address *</label>
                    <input id="reg-email" type="email" className="input-underline" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email" />
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">@Author Handle</label>
                    <input id="reg-handle" className="input-underline" value={regHandle} onChange={(e) => setRegHandle(e.target.value.replace(/[^a-z0-9_]/gi, ''))} placeholder="indiemoxley" />
                    <p className="mt-1 text-[0.6rem] font-mono" style={{ color: 'var(--color-champagne)' }}>author {previewHandle}</p>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Password *</label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        className="input-underline pr-10"
                        value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 8 characters" required autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {regPassword && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: 'var(--color-hairline)' }}>
                          <div className="h-full rounded transition-all" style={{ width: `${(strength.level / 4) * 100}%`, backgroundColor: strength.color }} />
                        </div>
                        <span className="text-[0.58rem] font-mono" style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                    )}
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={regNewsletter} onChange={(e) => setRegNewsletter(e.target.checked)} className="mt-0.5 accent-[var(--color-champagne)]" />
                    <span className="text-[0.65rem] font-mono leading-relaxed" style={{ color: 'var(--color-stone)' }}>
                      Receive editorial drops, new collections & private sale invitations
                    </span>
                  </label>
                  {regError && <p className="text-[0.68rem] font-mono" style={{ color: '#CC2244' }}>{regError}</p>}
                  <button id="register-submit" type="submit" disabled={regLoading} className="w-full py-3.5 text-[0.68rem] tracking-widest uppercase font-mono flex items-center justify-center gap-2 transition-opacity disabled:opacity-60" style={{ backgroundColor: 'var(--color-espresso)', color: 'var(--color-ivory)' }}>
                    {regLoading ? 'Creating Archive…' : <><ArrowRight size={12} /> Create Account</>}
                  </button>
                </form>

                <p className="mt-5 text-center text-[0.65rem] font-mono" style={{ color: 'var(--color-stone)' }}>
                  Already have an account?{' '}
                  <button onClick={() => switchView('login')} className="underline hover:opacity-70" style={{ color: 'var(--color-espresso)' }}>Sign in</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Privacy note */}
          <p className="mt-8 text-[0.6rem] tracking-wide text-center" style={{ color: 'var(--color-stone)', fontFamily: 'var(--font-mono)' }}>
            By continuing you agree to Heirest's{' '}
            <span className="underline cursor-pointer">Terms</span> &{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
