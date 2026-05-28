import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          padding: 40, textAlign: 'center', fontFamily: 'system-ui',
          color: '#333', marginTop: 40
        }
      },
        React.createElement('h2', { style: { color: '#E74C3C' } }, 'Something went wrong'),
        React.createElement('p', { style: { color: '#7F8C8D' } },
          this.state.error?.message || 'An unexpected error occurred'
        ),
        React.createElement('button', {
          onClick: () => { this.setState({ hasError: false, error: null }); window.location.href = '/'; },
          style: {
            marginTop: 16, padding: '10px 24px', background: '#2980B9',
            color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14
          }
        }, 'Return Home')
      );
    }
    return this.props.children;
  }
}
