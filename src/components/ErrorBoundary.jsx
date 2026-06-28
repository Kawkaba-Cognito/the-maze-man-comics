import React from 'react';
import { isChunkLoadError, selfHealChunkReload } from '../lib/lazyWithRetry';

/**
 * App-wide error boundary. If any screen/game throws during render, we show a
 * recoverable fallback instead of a blank white page, and offer a reload.
 *
 * A chunk-load error (a code-split bundle that 404s after a new deploy) is
 * special-cased: instead of showing the error screen we drop the stale caches
 * and reload once, so a deploy self-heals even if the failure escapes the lazy
 * wrapper. The guard flag in selfHealChunkReload prevents any reload loop.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, healing: false, isChunk: false };
  }

  static getDerivedStateFromError(error) {
    const isChunk = isChunkLoadError(error);
    // Only enter the "healing" (auto-reload) state when online — offline a missing
    // chunk just isn't downloaded yet, so reloading can't help.
    const online = typeof navigator === 'undefined' || navigator.onLine !== false;
    return { hasError: true, isChunk, healing: isChunk && online };
  }

  componentDidCatch(error, info) {
    if (isChunkLoadError(error)) {
      void selfHealChunkReload('boundary').then((reloaded) => {
        // If a reload was already spent on this scope, fall back to the error UI.
        if (!reloaded) this.setState({ healing: false });
      });
    }
    // Surface in dev; in production this keeps the app from white-screening.
    if (import.meta.env.DEV) console.error('[Maze Man] Uncaught UI error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    try { window.location.reload(); } catch { /* ignore */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.state.healing) {
      // A new build is being pulled in — selfHealChunkReload is reloading us.
      return (
        <div
          role="status"
          style={{
            position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
            textAlign: 'center', background: '#12090a', color: '#f0e2c0',
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 40 }} aria-hidden="true">🔄</div>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.95rem' }}>
            Updating to the latest version…
            <br />
            <span dir="rtl">جارٍ التحديث إلى أحدث إصدار…</span>
          </p>
        </div>
      );
    }
    // A chunk error while offline means this game hasn't been downloaded yet.
    const offlineChunk =
      this.state.isChunk && typeof navigator !== 'undefined' && navigator.onLine === false;
    return (
      <div
        role="alert"
        style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
          textAlign: 'center', background: '#12090a', color: '#f0e2c0',
          fontFamily: "'Outfit', system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 44 }} aria-hidden="true">{offlineChunk ? '📶' : '🧩'}</div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
          {offlineChunk ? "You're offline" : 'Something went wrong'}
        </h1>
        <p style={{ margin: 0, maxWidth: 320, opacity: 0.85, lineHeight: 1.5, fontSize: '0.95rem' }}>
          {offlineChunk ? (
            <>
              This game isn’t downloaded yet. Connect to the internet once to download it, then it
              works offline.
              <br />
              <span dir="rtl">هذه اللعبة غير محمّلة بعد. اتصل بالإنترنت مرة لتنزيلها، ثم تعمل دون اتصال.</span>
            </>
          ) : (
            <>
              The app hit an unexpected error. Reloading usually fixes it — your progress is saved.
              <br />
              <span dir="rtl">حدث خطأ غير متوقع. أعد التحميل — تقدّمك محفوظ.</span>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: '12px 28px', borderRadius: 12, border: '1px solid rgba(232,172,78,0.5)',
            background: 'linear-gradient(180deg,#e8ac4e,#c9923a)', color: '#12090a',
            fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
          }}
        >
          {offlineChunk ? 'Go back · رجوع' : 'Reload · إعادة التحميل'}
        </button>
      </div>
    );
  }
}
