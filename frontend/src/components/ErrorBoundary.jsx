import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleLogout = () => {
        localStorage.removeItem('auction_token');
        localStorage.removeItem('auction_user');
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
                    <div className="glass-card p-8 max-w-md text-center">
                        <div className="text-6xl mb-4">😵</div>
                        <h1 className="font-display text-2xl font-bold text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-gray-400 mb-6">
                            An unexpected error occurred. Please try again.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReload}
                                className="btn-gold w-full py-3"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleLogout}
                                className="w-full py-3 rounded-xl border border-primary-300 text-gray-400 hover:text-white hover:border-gold-400 transition-colors"
                            >
                                Logout & Retry
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-6 text-left">
                                <summary className="text-gray-500 cursor-pointer text-sm">
                                    Error Details
                                </summary>
                                <pre className="mt-2 p-3 bg-primary-100 rounded-lg text-xs text-red-400 overflow-auto">
                                    {this.state.error?.toString()}
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

export default ErrorBoundary;
