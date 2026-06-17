import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import OTPInput from '../components/OTPInput';

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
  const steps = ['Phone', 'Verify', 'Reset'];
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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
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

  const sendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      await authAPI.forgotPasswordSendOTP(`+91${digits}`);
      setInfo('If registered, an OTP has been sent. Check your backend console.');
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

  const handleReset = async (e) => {
    e.preventDefault(); setError('');
    if (newPwd !== confirmPwd) { setError('Passwords do not match'); return; }
    const s = passwordStrength(newPwd);
    if (!s || s.label === 'Weak') { setError('Please use a stronger password'); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword({ phone: `+91${phone.replace(/\D/g, '')}`, otp, newPassword: newPwd });
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed';
      setError(msg);
      if (msg.toLowerCase().includes('otp')) setStep(2);
    } finally { setLoading(false); }
  };

  const strength = passwordStrength(newPwd);

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
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            {info}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h1 className="page-title">Forgot password?</h1>
            <p className="page-subtitle">Enter your registered mobile number to receive an OTP</p>
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
              Remember your password? <Link to="/login">Sign In</Link>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <button className="back-link" onClick={() => { setStep(1); setOtp(''); setError(''); setInfo(''); }}>
              ← Back
            </button>
            <h1 className="page-title">Enter OTP</h1>
            <p className="page-subtitle">6-digit code sent to <strong>+91 {phone}</strong></p>
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
                Verify OTP →
              </button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <button className="back-link" onClick={() => { setStep(2); setError(''); }}>
              ← Back
            </button>
            <h1 className="page-title">Set new password</h1>
            <p className="page-subtitle">Create a strong new password for your account</p>
            <form className="form" onSubmit={handleReset}>
              <div className="form-group">
                <label className="form-label">New Password *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconLock /></span>
                  <input
                    type={showPwd ? 'text' : 'password'} className="form-input"
                    placeholder="Min 8 chars + uppercase + number + @$!%*?&"
                    value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setError(''); }} required
                  />
                  <button type="button" className="input-action" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}><IconEye open={showPwd} /></button>
                </div>
                {newPwd && strength && (
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
                    className={`form-input${confirmPwd && confirmPwd !== newPwd ? ' error' : ''}`}
                    placeholder="Repeat new password"
                    value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setError(''); }} required
                  />
                  <button type="button" className="input-action" onClick={() => setShowCon(!showCon)} tabIndex={-1}><IconEye open={showCon} /></button>
                </div>
                {confirmPwd && confirmPwd !== newPwd && (
                  <div className="field-error">Passwords do not match</div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '.25rem' }}>
                {loading ? <><div className="spinner" /> Resetting password…</> : 'Reset Password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
