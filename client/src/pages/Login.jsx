import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-on-surface bg-[#F9F7F3] relative overflow-hidden">
      {/* Visual Background Element */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[60%] bg-surface-container opacity-30 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -left-[5%] w-[30%] h-[50%] bg-secondary-container opacity-20 rounded-full blur-[100px]"></div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center px-margin-page py-12 z-10">
        {/* Brand Identity Container */}
        <div className="mb-12 text-center">
          <h1 className="font-headline-md text-headline-md text-primary mb-2 tracking-tight">VendorBridge</h1>
          <div className="w-12 h-[1px] bg-[#C6A664] mx-auto opacity-60"></div>
        </div>

        {/* Authentication Card */}
        <section className="w-full max-w-[480px] bg-white rounded-[20px] p-card-padding border border-[#E5E1D8] shadow-[0px_4px_20px_rgba(28,28,28,0.04)] transition-all duration-300 hover:shadow-[0px_8px_30px_rgba(28,28,28,0.08)]">
          <header className="mb-8">
            <h2 className="font-headline-md text-headline-md text-[#1C1C1C] mb-2">Welcome Back</h2>
            <p className="font-body-main text-body-main text-on-surface-variant">Access your enterprise procurement portal.</p>
          </header>

          {error && <div className="mb-6 p-3 bg-error-container text-error rounded text-sm font-semibold">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Business Email */}
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="email">Business Email</label>
              <input 
                className="w-full h-12 px-4 bg-white border border-[#E5E1D8] rounded-[6px] font-data-tabular text-data-tabular text-[#1C1C1C] transition-all placeholder:text-outline-variant focus:outline-none focus:border-[#C6A664] focus:ring-2 focus:ring-[#C6A664]/20" 
                id="email" 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com" 
                required 
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
              <div className="relative">
                <input 
                  className="w-full h-12 px-4 bg-white border border-[#E5E1D8] rounded-[6px] font-data-tabular text-data-tabular text-[#1C1C1C] transition-all focus:outline-none focus:border-[#C6A664] focus:ring-2 focus:ring-[#C6A664]/20" 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* CTA */}
            <button 
              className="w-full h-14 bg-[#C6A664] hover:bg-[#B39458] text-[#1C1C1C] font-title-sm text-title-sm rounded-[6px] transition-all transform active:scale-[0.98]" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Secure Sign In'}
            </button>
          </form>

          {/* Bottom Support */}
          <div className="mt-8 pt-6 border-t border-[#F9F7F3] text-center">
            <p className="font-body-main text-[14px] text-on-surface-variant">
              Don't have an account? <Link to="/register" className="text-[#1C1C1C] font-semibold hover:text-[#C6A664] transition-colors">Register Here</Link>
            </p>
          </div>
        </section>

        {/* Trust Indicators */}
        <footer className="mt-16 w-full max-w-[800px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <div className="flex flex-col items-center text-center space-y-3 opacity-70 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[#C6A664] text-[32px]">verified_user</span>
              <span className="font-label-caps text-label-caps text-[#1C1C1C] uppercase tracking-[0.1em]">Enterprise Grade Security</span>
              <p className="text-[12px] font-body-main text-on-surface-variant leading-relaxed">AES-256 encryption and multi-layered hardware security modules.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 opacity-70 hover:opacity-100 transition-opacity border-y md:border-y-0 md:border-x border-[#E5E1D8] py-8 md:py-0 md:px-8">
              <span className="material-symbols-outlined text-[#C6A664] text-[32px]">description</span>
              <span className="font-label-caps text-label-caps text-[#1C1C1C] uppercase tracking-[0.1em]">Audit Logging Enabled</span>
              <p className="text-[12px] font-body-main text-on-surface-variant leading-relaxed">Comprehensive immutable audit trails for all procurement activities.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 opacity-70 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[#C6A664] text-[32px]">shield_person</span>
              <span className="font-label-caps text-label-caps text-[#1C1C1C] uppercase tracking-[0.1em]">Procurement Data Protection</span>
              <p className="text-[12px] font-body-main text-on-surface-variant leading-relaxed">GDPR and SOC2 Type II compliant data handling protocols.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Login;
