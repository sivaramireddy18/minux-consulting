import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LoginForm } from './components/LoginForm.js';
import { RegisterForm } from './components/RegisterForm.js';
import { api } from './services/api.js';

const DashboardContent = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // -------------------------------------------------------------
  // Test Security API Calls
  // -------------------------------------------------------------
  const testUserProfileRoute = async () => {
    setTestError(null);
    setProfileData(null);
    setTestLoading(true);
    try {
      const res = await api.get('/user/profile');
      setProfileData(res.data);
    } catch (err: any) {
      setTestError(err.response?.data?.error || 'Failed to query profile route.');
    } finally {
      setTestLoading(false);
    }
  };

  const testAdminDashboardRoute = async () => {
    setTestError(null);
    setAdminData(null);
    setTestLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setAdminData(res.data);
    } catch (err: any) {
      // Intentionally throws 403 Forbidden for role USER
      setTestError(
        `Error ${err.response?.status} (${err.response?.statusText}): ` +
        (err.response?.data?.error || 'Role context lacks Admin permissions.')
      );
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl space-y-8">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Active Workspace Portal</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Hello, {user?.name}!</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
            Role: {user?.role}
          </span>
          <button
            onClick={logout}
            className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 hover:border-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Grid: Profile specs & test actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Session Profile metadata */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Cryptographical Session Specs</h2>
          <div className="rounded-xl bg-white/5 border border-white/5 p-5 space-y-3 font-mono text-xs text-gray-300">
            <div>
              <span className="text-gray-500">USER_ID:</span> {user?.id}
            </div>
            <div>
              <span className="text-gray-500">EMAIL:</span> {user?.email}
            </div>
            <div>
              <span className="text-gray-500">ROLE_CONTEXT:</span> {user?.role}
            </div>
            <div>
              <span className="text-gray-500">CSRF_SAFETY:</span> Cookies secured under SameSite=Strict / HttpOnly
            </div>
          </div>
        </div>

        {/* Right Column: RBAC Middleware Gates Tester */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Middleware & RBAC Access Gates</h2>
          <p className="text-xs text-gray-400">Test resource endpoints matching the role guards configured in backend routers.</p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testUserProfileRoute}
              disabled={testLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              Test Standard Profile Route (requireAuth)
            </button>
            
            <button
              onClick={testAdminDashboardRoute}
              disabled={testLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50"
            >
              Test Admin Control Route (requireRoles(['ADMIN']))
            </button>
          </div>

          {/* Dynamic Feedbacks */}
          <div className="space-y-3 pt-2">
            {testLoading && (
              <div className="text-xs text-gray-400 animate-pulse">Requesting API server gate...</div>
            )}

            {testError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-mono text-red-400">
                ⚠️ [Gate Failure Response]: {testError}
              </div>
            )}

            {profileData && (
              <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-3 text-xs font-mono text-indigo-300">
                ✅ [Profile Data Response]:
                <pre className="mt-1.5 whitespace-pre-wrap">{JSON.stringify(profileData, null, 2)}</pre>
              </div>
            )}

            {adminData && (
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3 text-xs font-mono text-emerald-300">
                🚀 [Admin Control Response]:
                <pre className="mt-1.5 whitespace-pre-wrap">{JSON.stringify(adminData, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthGateway = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a051b] text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading Cryptographic Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a051b] bg-radial-gradient text-white flex items-center justify-center p-6">
      {user ? (
        <DashboardContent />
      ) : (
        <div className="w-full flex flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              SECURE LOGISTICS
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Enterprise Credential Control Hub</p>
          </div>
          {isLogin ? (
            <LoginForm onToggleForm={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleForm={() => setIsLogin(true)} />
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGateway />
    </AuthProvider>
  );
}
