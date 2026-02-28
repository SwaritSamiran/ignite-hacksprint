'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden relative" style={{ backgroundColor: '#0f1419', color: '#f5f7fa' }}>
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md text-center space-y-12">
        {/* App Name */}
        <div className="space-y-4">
          <h1 className="text-7xl md:text-8xl font-black" style={{ backgroundImage: 'linear-gradient(to right, #10b981, #34d399, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Finguard
          </h1>
          <p className="text-lg leading-relaxed font-light" style={{ color: '#9ca3af' }}>
            AI-powered behavioral intervention for smarter spending
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-6">
          <Link
            href="/auth/signup"
            className="block w-full py-4 px-6 font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(to right, #10b981, #34d399)',
              color: '#0f1419',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
            }}
          >
            Create Account
          </Link>

          <Link
            href="/auth/login"
            className="block w-full py-4 px-6 font-bold rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: '#1a1f2e',
              borderColor: '#10b981',
              color: '#f5f7fa',
            }}
          >
            Login
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#2d3748' }}></div>
          <span className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>NEW HERE?</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#2d3748' }}></div>
        </div>

        {/* Footer text */}
        <p className="text-xs leading-relaxed max-w-sm mx-auto" style={{ color: 'rgba(156, 163, 175, 0.7)' }}>
          Meet Gemma, your AI guardian powered by Gemma 3 27B. She intervenes before every purchase, detects harmful patterns, and helps you build better financial habits.
        </p>
      </div>
    </div>
  );
}
