import { useRef, useEffect } from 'react';

export default function OTPInput({ length = 6, value, onChange, hasError }) {
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = (value || '').split('');
    arr[i] = digit;
    onChange(arr.join('').slice(0, length));
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (value?.[i]) {
        const arr = value.split('');
        arr[i] = '';
        onChange(arr.join(''));
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        const arr = value.split('');
        arr[i - 1] = '';
        onChange(arr.join(''));
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    const focus = Math.min(pasted.length, length - 1);
    refs.current[focus]?.focus();
  };

  return (
    <div className="otp-container">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`otp-input${value?.[i] ? ' filled' : ''}${hasError ? ' error' : ''}`}
          value={value?.[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  );
}
