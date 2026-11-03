import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearAndReset = () => {
    try {
      localStorage.removeItem('dasig_token');
      localStorage.removeItem('dasig_user');
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020817',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#0b1329',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px',
            }}>
              ⚠️
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 10px', color: '#ffffff' }}>
              Something Unexpected Happened
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.6 }}>
              The portal encountered an unexpected display issue. Your saved data is safe. You can reload the page or return to the main dashboard.
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.opacity = '0.9')}
                onMouseOut={(e) => (e.target.style.opacity = '1')}
              >
                ↻ Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Go to Homepage
              </button>

              <button
                onClick={this.handleClearAndReset}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Reset Session
              </button>
            </div>

            {this.state.error && (
              <details style={{ textAlign: 'left', marginTop: '16px' }}>
                <summary style={{
                  fontSize: '12px',
                  color: '#64748b',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}>
                  Technical Error Details
                </summary>
                <pre style={{
                  marginTop: '10px',
                  padding: '12px',
                  backgroundColor: '#020617',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f87171',
                  overflowX: 'auto',
                  border: '1px solid #1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
