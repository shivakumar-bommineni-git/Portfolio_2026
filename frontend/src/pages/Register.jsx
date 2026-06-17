import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';

const IconUser = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const IconEye = ({ open }) => open ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const passwordStrength = (pwd) => {
  if (!pwd) return null;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[@$!%*?&]/.test(pwd)) s++;
  if (s <= 2) return { label: 'Weak', color: '#ef4444', width: '30%' };
  if (s === 3) return { label: 'Fair', color: '#f59e0b', width: '55%' };
  if (s === 4) return { label: 'Good', color: '#10b981', width: '78%' };
  return { label: 'Strong', color: '#10b981', width: '100%' };
};

const StepBar = ({ step }) => {
  const steps = ['Phone', 'Verify', 'Details'];
  return (
    <div className="steps">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step-item${active ? ' active' : ''}${done ? ' done' : ''}`}>
              <div className="step-number">{done ? '✓' : n}</div>
              <span className="step-label">{label}</span>
            </div>
            {i < 2 && <div className={`step-connector${done ? ' done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
};

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const setField = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setError(''); };

  const sendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      await authAPI.sendOTP(`+91${digits}`);
      setInfo('OTP sent! Check your backend console.');
      setCountdown(60);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyStep = () => {
    if (otp.replace(/\D/g, '').length !== 6) { setOtpErr(true); setError('Enter the complete 6-digit OTP'); return; }
    setOtpErr(false); setError(''); setInfo('');
    setStep(3);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    const s = passwordStrength(form.password);
    if (!s || s.label === 'Weak') { setError('Please use a stronger password'); return; }

    setLoading(true);
    try {
      const res = await authAPI.register({
        phone: `+91${phone.replace(/\D/g, '')}`,
        otp, password: form.password,
        fullName: form.fullName,
        email: form.email || undefined,
      });
      login(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      if (msg.toLowerCase().includes('otp')) setStep(2);
    } finally { setLoading(false); }
  };

  const strength = passwordStrength(form.password);

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <div className="logo-text">Secure<span>Pay</span></div>
        </div>

        <StepBar step={step} />

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        {info && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {info}
          </div>
        )}

        {/* STEP 1 — Phone */}
        {step === 1 && (
          <>
            <h1 className="page-title">Create account</h1>
            <p className="page-subtitle">Enter your mobile number to get started</p>
            <div className="form">
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div className="phone-group">
                  <div className="country-code">🇮🇳 +91</div>
                  <input
                    type="tel" className="form-input"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                    maxLength={10} inputMode="numeric" autoFocus
                  />
                </div>
              </div>
              <button className="btn btn-primary" onClick={sendOTP} disabled={loading} style={{ marginTop: '.25rem' }}>
                {loading ? <><div className="spinner" /> Sending OTP…</> : 'Send OTP →'}
              </button>
            </div>
            <div className="auth-footer">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </>
        )}

        {/* STEP 2 — OTP */}
        {step === 2 && (
          <>
            <button className="back-link" onClick={() => { setStep(1); setOtp(''); setError(''); setInfo(''); }}>
              ← Back
            </button>
            <h1 className="page-title">Verify your phone</h1>
            <p className="page-subtitle">
              Enter the 6-digit OTP sent to <strong>+91 {phone}</strong>
            </p>
            <div className="form">
              <div className="form-group" style={{ alignItems: 'center', gap: '.875rem' }}>
                <OTPInput length={6} value={otp} onChange={(v) => { setOtp(v); setOtpErr(false); setError(''); }} hasError={otpErr} />
              </div>
              <div className="otp-resend">
                {countdown > 0
                  ? <>Resend OTP in <span className="otp-timer">{countdown}s</span></>
                  : <button className="btn-ghost" onClick={sendOTP} disabled={loading}>Resend OTP</button>
                }
              </div>
              <button
                className="btn btn-primary"
                onClick={verifyStep}
                disabled={otp.length !== 6 || loading}
                style={{ marginTop: '.25rem' }}
              >
                Verify & Continue →
              </button>
            </div>
          </>
        )}

        {/* STEP 3 — Details */}
        {step === 3 && (
          <>
            <button className="back-link" onClick={() => { setStep(2); setError(''); }}>
              ← Back
            </button>
            <h1 className="page-title">Your details</h1>
            <p className="page-subtitle">Complete your profile to finish registration</p>
            <form className="form" onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconUser /></span>
                  <input type="text" className="form-input" placeholder="Enter your full name" value={form.fullName} onChange={setField('fullName')} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconMail /></span>
                  <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={setField('email')} autoComplete="email" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconLock /></span>
                  <input type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Min 8 chars + uppercase + number + @$!%*?&" value={form.password} onChange={setField('password')} required />
                  <button type="button" className="input-action" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}><IconEye open={showPwd} /></button>
                </div>
                {form.password && strength && (
                  <>
                    <div className="strength-bar">
                      <div className="strength-fill" style={{ width: strength.width, background: strength.color }} />
                    </div>
                    <span className="strength-text" style={{ color: strength.color }}>{strength.label}</span>
                  </>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconLock /></span>
                  <input
                    type={showCon ? 'text' : 'password'}
                    className={`form-input${form.confirm && form.confirm !== form.password ? ' error' : ''}`}
                    placeholder="Repeat your password"
                    value={form.confirm} onChange={setField('confirm')} required
                  />
                  <button type="button" className="input-action" onClick={() => setShowCon(!showCon)} tabIndex={-1}><IconEye open={showCon} /></button>
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <div className="field-error">Passwords do not match</div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '.25rem' }}>
                {loading ? <><div className="spinner" /> Creating account…</> : 'Create Account →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
