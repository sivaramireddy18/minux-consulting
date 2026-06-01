import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';

interface RegisterFormProps {
  onToggleForm: () => void;
}

export const RegisterForm = ({ onToggleForm }: RegisterFormProps) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password requirements state tracking
  const [requirements, setRequirements] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const [strengthScore, setStrengthScore] = useState(0);

  // 1. Audit Password requirements in real-time
  useEffect(() => {
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    setRequirements(checks);

    // Calculate strength index (0 to 5)
    const score = Object.values(checks).filter(Boolean).length;
    setStrengthScore(score);
  }, [password]);

  // Determine strength label styling
  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'Empty', color: 'text-gray-500', bar: 'bg-white/10' };
    if (strengthScore <= 2) return { label: 'Weak (Vulnerable)', color: 'text-red-400', bar: 'bg-red-500' };
    if (strengthScore <= 4) return { label: 'Medium (Average)', color: 'text-yellow-400', bar: 'bg-yellow-500' };
    return { label: 'Strong (Secure)', color: 'text-green-400', bar: 'bg-green-500' };
  };

  const strength = getStrengthLabel();

  // -------------------------------------------------------------
  // Registration Submit Handler
  // -------------------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block if password requirements are not fully satisfied
    const allValid = Object.values(requirements).every(Boolean);
    if (!allValid) {
      setErrorMsg('Please ensure your password satisfies all security requirements.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await register(email, name, password);
      setSuccessMsg('Registration successful! Please inspect your email to complete verification.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error || 
        'Registration failed. Please check your network and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300">
      <form onSubmit={handleRegisterSubmit} className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">Join our enterprise security portal today</p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs font-medium text-green-400">
            {successMsg}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="reg-name" className="text-xs font-semibold text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-indigo-500 focus:bg-white/10"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="reg-email" className="text-xs font-semibold text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-indigo-500 focus:bg-white/10"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="reg-password" className="text-xs font-semibold text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-indigo-500 focus:bg-white/10"
            />
          </div>

          {/* 3. Real-Time Dynamic Strength Indicators */}
          {password.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Password Strength:</span>
                <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
              </div>
              
              {/* Glowing Dynamic Strength Meter Bar */}
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full ${strength.bar} transition-all duration-300`}
                  style={{ width: `${(strengthScore / 5) * 100}%` }}
                />
              </div>

              {/* Requirement Checklist */}
              <div className="grid grid-cols-2 gap-2 pt-1.5 text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${requirements.length ? 'bg-green-400' : 'bg-red-400/50'}`} />
                  <span>8+ Characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${requirements.upper ? 'bg-green-400' : 'bg-red-400/50'}`} />
                  <span>Uppercase Letter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${requirements.lower ? 'bg-green-400' : 'bg-red-400/50'}`} />
                  <span>Lowercase Letter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${requirements.number ? 'bg-green-400' : 'bg-red-400/50'}`} />
                  <span>One Number</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${requirements.special ? 'bg-green-400' : 'bg-red-400/50'}`} />
                  <span>One Special Character (@$!%*?&)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 outline-none transition duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:opacity-50"
        >
          {loading ? 'Registering Account Profile...' : 'Sign Up &rarr;'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleForm}
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
};
