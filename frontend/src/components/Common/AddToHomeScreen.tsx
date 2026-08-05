import { useState, useEffect } from 'react';

const STORAGE_KEY = 'add-to-home-screen-dismissed';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export default function AddToHomeScreen() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isIOS() || isStandalone()) return;
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed === 'true') return;
      setShow(true);
    } catch {
      setShow(true);
    }
  }, [mounted]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (!show) return null;

  return (
    <div className="bg-primary-600 text-white px-4 py-3 flex items-start gap-3 shadow-md">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Add this app to your iPhone</p>
        <p className="text-xs text-primary-100 mt-0.5">
          Open this page in <strong>Safari</strong> (not Chrome). Tap the <strong>Share</strong> icon (box with
          arrow up) at the bottom of Safari → scroll down → tap <strong>“Add to Home Screen”</strong> →
          tap <strong>Add</strong>.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 p-1 rounded hover:bg-primary-500 text-white/90"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
