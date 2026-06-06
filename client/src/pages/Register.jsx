import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'vendor', company: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/signup', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
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
        <section className="w-full max-w-[600px] bg-white rounded-[20px] p-card-padding border border-[#E5E1D8] shadow-[0px_4px_20px_rgba(28,28,28,0.04)] transition-all duration-300">
          <header className="mb-8">
            <h2 className="font-headline-md text-headline-md text-[#1C1C1C] mb-2">Create Account</h2>
            <p className="font-body-main text-body-main text-on-surface-variant">Register for enterprise access.</p>
          </header>

          {error && <div className="mb-6 p-3 bg-error-container text-error rounded text-sm font-semibold">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Full Name</label>
                <input 
                  className="w-full h-12 px-4 bg-white border border-[#E5E1D8] rounded-[6px] font-data-tabular focus:outline-none focus:border-[#C6A664] focus:ring-2 focus:ring-[#C6A664]/20" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required 
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Business Email</label>
                <input 
                  type="email"
                  className="w-full h-12 px-4 bg-white border border-[#E5E1D8] rounded-[6px] font-data-tabular focus:outline-none focus:border-[#C6A664] focus:ring-2 focus:ring-[#C6A664]/20" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Password</label>
              <input 
                type="password"
                className="w-full h-12 px-4 bg-white border border-[#E5E1D8] rounded-[6px] font-data-tabular focus:outline-none focus:border-[#C6A664] focus:ring-2 focus:ring-[#C6A664]/20" 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Role</label>
                <select 
                  className="w-full h-12 px-4 bg-surface-container-low border border-[#E5E1D8] rounded-[6px] font-data-tabular focus:outline-none focus:border-[#C6A664] focus:ring-2 focus:ring-[#C6A664]/20" 
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="vendor">Vendor</option>
                  <option value="procurement_officer">Procurement Officer</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Company</label>
                <input 
                  className="w-full h-12 px-4 bg-white border border-[#E5E1D8] rounded-[6px] font-data-tabular focus:outline-none focus:border-[#C6A664] focus:ring-2 focus:ring-[#C6A664]/20" 
                  value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} 
                />
              </div>
            </div>
            
            <button 
              className="w-full h-14 bg-[#C6A664] hover:bg-[#B39458] text-[#1C1C1C] font-title-sm text-title-sm rounded-[6px] transition-all transform active:scale-[0.98]" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#F9F7F3] text-center">
            <p className="font-body-main text-[14px] text-on-surface-variant">
              Already have an account? <Link to="/login" className="text-[#1C1C1C] font-semibold hover:text-[#C6A664] transition-colors">Sign In</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Register;
