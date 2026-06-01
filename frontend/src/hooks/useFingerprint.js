import { useState, useEffect } from 'react';

// Fast SHA-256 hash using native Web Crypto API
const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        const components = [
          navigator.userAgent,
          navigator.language,
          new Date().getTimezoneOffset(),
          screen.width,
          screen.height,
          screen.colorDepth,
          navigator.hardwareConcurrency || 'unknown',
          navigator.deviceMemory || 'unknown',
          navigator.platform || 'unknown'
        ];

        const rawString = components.join('|');
        const hash = await sha256(rawString);
        setFingerprint(hash);
      } catch (err) {
        console.error('Failed to generate device fingerprint:', err);
        // Fallback to random identifier cached in localStorage if crypto fails
        let fallback = localStorage.getItem('device_fallback_id');
        if (!fallback) {
          fallback = 'fallback_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem('device_fallback_id', fallback);
        }
        setFingerprint(fallback);
      }
    };

    generateFingerprint();
  }, []);

  return fingerprint;
};
