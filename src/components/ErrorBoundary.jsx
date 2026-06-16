import React from 'react';

/**
 * App-wide error boundary. If any screen/game throws during render, we show a
 * recoverable fallback instead of a blank white page, and offer a reload.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface in dev; in production this keeps the app from white-screening.
    if (import.meta.env.DEV) console.error('[Maze Man] Uncaught UI error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    try { window.location.reload(); } catch { /* ignore */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
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
        <div style={{ fontSize: 44 }} aria-hidden="true">🧩</div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Something went wrong</h1>
        <p style={{ margin: 0, maxWidth: 320, opacity: 0.85, lineHeight: 1.5, fontSize: '0.95rem' }}>
          The app hit an unexpected error. Reloading usually fixes it — your progress is saved.
          <br />
          <span dir="rtl">حدث خطأ غير متوقع. أعد التحميل — تقدّمك محفوظ.</span>
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
          Reload · إعادة التحميل
        </button>
      </div>
    );
  }
}
