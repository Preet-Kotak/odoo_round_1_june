import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const C = { ivory: '#F9F7F3', charcoal: '#1C1C1C', gold: '#C6A664', border: '#E5E1D8', muted: '#858484' };
const Input = 'w-full border border-[#E5E1D8] rounded-lg px-3.5 py-2.5 text-[13px] text-[#1C1C1C] placeholder:text-[#858484]/70 focus:outline-none focus:border-[#C6A664] focus:ring-1 focus:ring-[#C6A664]/30 transition-all bg-white';
const Label = ({ c }) => <p className="text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: C.muted }}>{c}</p>;

const EMPTY_VENDOR = { companyName: '', category: 'Manufacturing', contactPerson: '', email: '', phone: '', gstNumber: '', paymentTerms: 'Net30', status: 'active', address: { city: '', state: '', country: 'India' } };

const CAT_COLOR = { IT: ['#DBEAFE','#1d4ed8'], Manufacturing: ['#DCFCE7','#166534'], Services: ['#FEF3C7','#92400E'], Logistics: ['#F3E8FF','#7e22ce'], Other: ['#F1F5F9','#475569'] };

function VendorModal({ vendor, onClose, onSaved }) {
  const [form, setForm] = useState(vendor || EMPTY_VENDOR);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [createPortal, setCreatePortal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const isEdit = !!vendor?._id;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setAddr = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  const submit = async () => {
    setErr('');
    if (!form.companyName || !form.email || !form.phone || !form.gstNumber || !form.contactPerson) {
      setErr('Company name, contact person, email, phone and GST are required.');
      return;
    }

    // Validate portal access fields if enabled (only for new vendors)
    if (!isEdit && createPortal) {
      if (!password || !confirmPassword) {
        setErr('Password and confirm password are required for portal access.');
        return;
      }
      if (password.length < 8) {
        setErr('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErr('Passwords do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      let linkedUserId = null;

      // Create user account first if portal access is enabled (only for new vendors)
      if (!isEdit && createPortal) {
        try {
          const userRes = await api.post('/auth/signup', {
            name: form.contactPerson,
            email: form.email,
            password: password,
            role: 'vendor',
            company: form.companyName,
            phone: form.phone,
          });
          linkedUserId = userRes.data?.user?._id;
        } catch (userErr) {
          // Handle user creation errors specifically
          const userErrMsg = userErr.response?.data?.message || 'Failed to create user account';
          setErr(`Portal Access Error: ${userErrMsg}`);
          setSaving(false);
          return;
        }
      }

      // Create or update vendor
      const vendorData = { ...form };
      if (linkedUserId) {
        vendorData.linkedUserId = linkedUserId;
      }

      if (isEdit) {
        await api.put(`/vendors/${vendor._id}`, vendorData);
      } else {
        await api.post('/vendors', vendorData);
      }
      
      onSaved();
      onClose();
    } catch (e) { 
      setErr(e.response?.data?.message || 'Failed to save vendor.'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl"
           style={{ background: '#fff', boxShadow: '0 24px 60px rgba(28,28,28,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>Vendor Record</p>
            <h2 className="text-[20px] font-normal mt-0.5" style={{ fontFamily: "'DM Serif Display',serif" }}>
              {isEdit ? 'Edit Vendor' : 'Onboard Vendor'}
            </h2>
          </div>
          <button onClick={onClose} className="hover:opacity-60 transition-opacity"><span className="material-symbols-outlined text-[22px]" style={{ color: C.muted }}>close</span></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {err && <div className="text-[13px] bg-red-50 border border-red-200 rounded-lg px-4 py-3" style={{ color: '#D94F3D' }}>{err}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label c="Company Name *" /><input value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Acme Pvt. Ltd." className={Input} /></div>
            <div><Label c="Contact Person *" /><input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Full name" className={Input} /></div>
            <div><Label c="Category" />
              <select value={form.category} onChange={e => set('category', e.target.value)} className={Input}>
                {['IT','Manufacturing','Services','Logistics','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><Label c="Email *" /><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="vendor@company.com" className={Input} /></div>
            <div><Label c="Phone *" /><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91-9876543210" className={Input} /></div>
            <div><Label c="GST Number *" /><input value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} placeholder="22AAAAA0000A1Z5" className={Input} /></div>
            <div><Label c="Payment Terms" />
              <select value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} className={Input}>
                {['Net15','Net30','Net60'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><Label c="City" /><input value={form.address?.city || ''} onChange={e => setAddr('city', e.target.value)} placeholder="Mumbai" className={Input} /></div>
            <div><Label c="State" /><input value={form.address?.state || ''} onChange={e => setAddr('state', e.target.value)} placeholder="Maharashtra" className={Input} /></div>
          </div>

          {/* Portal Access Section - Only show for new vendors */}
          {!isEdit && (
            <>
              <div style={{ borderTop: `1px solid ${C.border}`, margin: '20px 0' }} />
              
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#FEF9F0', border: '1px solid #F0E5CC' }}>
                <div>
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: C.charcoal }}>Create Portal Access</p>
                  <p className="text-[11px]" style={{ color: C.muted }}>Allow this vendor to log in and submit quotations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={createPortal} onChange={e => setCreatePortal(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 rounded-full peer transition-colors peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" 
                       style={{ background: createPortal ? C.gold : '#D1D5DB' }} />
                </label>
              </div>

              {createPortal && (
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl" style={{ background: '#FAFAF8', border: `1px solid ${C.border}` }}>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[16px]" style={{ color: C.gold }}>lock</span>
                      <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Login Credentials</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label c="Email (Username)" />
                    <input type="email" value={form.email} disabled className={Input + ' bg-gray-50'} />
                    <p className="text-[10px] mt-1" style={{ color: C.muted }}>Email will be used as username</p>
                  </div>
                  <div>
                    <Label c="Password *" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className={Input} />
                  </div>
                  <div>
                    <Label c="Confirm Password *" />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={Input} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 rounded-b-2xl" style={{ borderTop: `1px solid ${C.border}`, background: C.ivory }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors hover:bg-white" style={{ borderColor: C.border, color: C.muted }}>Cancel</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-50 transition-opacity" style={{ background: C.gold, color: C.charcoal }}>
            {saving ? 'Saving…' : isEdit ? 'Update Vendor' : 'Onboard Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorManagement() {
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [catF,    setCatF]      = useState('');
  const [statusF, setStatusF]   = useState('');
  const [modal,   setModal]     = useState(null); // null | {} (new) | vendor obj (edit)
  const [page,    setPage]      = useState(1);
  const [total,   setTotal]     = useState(0);
  const LIMIT = 10;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: LIMIT });
      if (search)  p.set('search', search);
      if (catF)    p.set('category', catF);
      if (statusF) p.set('status', statusF);
      const res = await api.get(`/vendors?${p}`);
      setVendors(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch { setVendors([]); }
    finally { setLoading(false); }
  }, [page, search, catF, statusF]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, catF, statusF]);

  const handleStatusToggle = async (v) => {
    try {
      const newStatus = v.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/vendors/${v._id}/status`, { status: newStatus });
      fetch();
    } catch (e) { console.error(e); }
  };

  const [grantAccessModal, setGrantAccessModal] = useState(null);

  const GrantAccessModal = ({ vendor, onClose, onSaved }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const submit = async () => {
      setErr('');
      if (!password || !confirmPassword) {
        setErr('Both password fields are required.');
        return;
      }
      if (password.length < 8) {
        setErr('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErr('Passwords do not match.');
        return;
      }

      setSaving(true);
      try {
        // Create user account
        const userRes = await api.post('/auth/signup', {
          name: vendor.contactPerson,
          email: vendor.email,
          password: password,
          role: 'vendor',
          company: vendor.companyName,
          phone: vendor.phone,
        });
        const linkedUserId = userRes.data?.user?._id;

        // Update vendor with linkedUserId
        await api.put(`/vendors/${vendor._id}`, { ...vendor, linkedUserId });
        
        onSaved();
        onClose();
      } catch (e) {
        setErr(e.response?.data?.message || 'Failed to grant portal access.');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl" style={{ background: '#fff', boxShadow: '0 24px 60px rgba(28,28,28,0.18)' }}>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>Portal Access</p>
              <h2 className="text-[20px] font-normal mt-0.5" style={{ fontFamily: "'DM Serif Display',serif" }}>Grant Login Access</h2>
            </div>
            <button onClick={onClose} className="hover:opacity-60 transition-opacity">
              <span className="material-symbols-outlined text-[22px]" style={{ color: C.muted }}>close</span>
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {err && <div className="text-[13px] bg-red-50 border border-red-200 rounded-lg px-4 py-3" style={{ color: '#D94F3D' }}>{err}</div>}
            
            <div className="p-4 rounded-xl" style={{ background: '#FEF9F0', border: '1px solid #F0E5CC' }}>
              <p className="text-[13px] font-semibold" style={{ color: C.charcoal }}>{vendor.companyName}</p>
              <p className="text-[11px] mt-1" style={{ color: C.muted }}>Contact: {vendor.contactPerson} ({vendor.email})</p>
            </div>

            <div>
              <Label c="Email (Username)" />
              <input type="email" value={vendor.email} disabled className={Input + ' bg-gray-50'} />
              <p className="text-[10px] mt-1" style={{ color: C.muted }}>Email will be used as username</p>
            </div>
            
            <div>
              <Label c="Password *" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className={Input} />
            </div>
            
            <div>
              <Label c="Confirm Password *" />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={Input} />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 rounded-b-2xl" style={{ borderTop: `1px solid ${C.border}`, background: C.ivory }}>
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors hover:bg-white" style={{ borderColor: C.border, color: C.muted }}>Cancel</button>
            <button onClick={submit} disabled={saving} className="px-5 py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-50 transition-opacity" style={{ background: C.gold, color: C.charcoal }}>
              {saving ? 'Granting…' : 'Grant Access'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const statCount = (s) => vendors.filter(v => v.status === s).length;

  return (
    <div className="max-w-[1200px] mx-auto">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: C.muted }}>Procurement › Vendor Registry</p>

      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-normal" style={{ fontFamily: "'DM Serif Display',serif", fontStyle: 'italic' }}>Vendor Management</h1>
          <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>Register vendors, track categories, manage GST and contract details.</p>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-2 px-4 py-[9px] rounded-lg text-[13px] font-bold hover:opacity-90"
                style={{ background: C.gold, color: C.charcoal }}>
          <span className="material-symbols-outlined text-[15px]">add_business</span>
          Onboard Vendor
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{ label: 'Total', value: total, color: C.charcoal, bg: '#fff' },
          { label: 'Active', value: vendors.filter(v=>v.status==='active').length, color: '#166534', bg: '#DCFCE7' },
          { label: 'Inactive', value: vendors.filter(v=>v.status==='inactive').length, color: '#92400E', bg: '#FEF3C7' },
          { label: 'Pending', value: vendors.filter(v=>v.status==='pending').length, color: '#1d4ed8', bg: '#DBEAFE' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-3 flex items-center justify-between"
               style={{ background: s.bg, border: `1px solid ${C.border}` }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-[22px] font-bold" style={{ color: s.color, fontFamily: "'IBM Plex Sans',sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none" style={{ color: C.muted }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…"
                 className="w-full pl-9 pr-4 py-[7px] rounded-xl bg-white border text-[13px] focus:outline-none focus:border-[#C6A664] transition-all"
                 style={{ borderColor: C.border }} />
        </div>
        {[
          { label: 'All Categories', value: catF, set: setCatF, opts: ['IT','Manufacturing','Services','Logistics','Other'] },
          { label: 'All Statuses',   value: statusF, set: setStatusF, opts: ['active','inactive','pending'] },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)}
                  className="px-3 py-[7px] text-[12px] font-semibold rounded-xl border focus:outline-none focus:border-[#C6A664] cursor-pointer bg-white"
                  style={{ borderColor: C.border, color: C.charcoal }}>
            <option value="">{f.label}</option>
            {f.opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: `1px solid ${C.border}` }}>
                {['Vendor ID','Company Name','Category','Contact','Portal Access','Status','Actions'].map((h,i) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: C.muted, textAlign: i===6?'right':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [1,2,3,4,5].map(i => (
                <tr key={i} style={{ borderBottom: '1px solid #F0EDE8' }}>
                  {[1,2,3,4,5,6,7].map(j => <td key={j} className="px-5 py-4"><div className="h-4 rounded animate-pulse" style={{ background: '#F0EDE8', width: '70%' }} /></td>)}
                </tr>
              ))}
              {!loading && vendors.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color: '#C4C7C7' }}>storefront</span>
                  <p className="text-[13px] font-medium" style={{ color: C.muted }}>No vendors found</p>
                  <button onClick={() => setModal({})} className="mt-2 text-[13px] font-semibold hover:underline" style={{ color: '#745b20' }}>Onboard your first vendor →</button>
                </td></tr>
              )}
              {!loading && vendors.map(v => {
                const [catBg, catFg] = CAT_COLOR[v.category] || ['#F1F5F9','#475569'];
                const statusColor = v.status === 'active' ? ['#DCFCE7','#166534'] : v.status === 'inactive' ? ['#F1F5F9','#6b7280'] : ['#FEF3C7','#92400E'];
                const hasPortalAccess = !!v.linkedUserId;
                
                return (
                  <tr key={v._id} style={{ borderBottom: '1px solid #F0EDE8' }}
                      onMouseEnter={e => e.currentTarget.style.background='#FDFCFA'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td className="px-5 py-4 text-[12px] font-semibold" style={{ color: C.muted, fontFamily: "'IBM Plex Sans',sans-serif" }}>{v.vendorId}</td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-semibold" style={{ color: C.charcoal }}>{v.companyName}</p>
                      <p className="text-[11px]" style={{ color: C.muted }}>{v.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold uppercase rounded px-2 py-0.5" style={{ background: catBg, color: catFg }}>{v.category}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[12px] font-medium" style={{ color: C.charcoal }}>{v.contactPerson}</p>
                      <p className="text-[11px]" style={{ color: C.muted }}>{v.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      {hasPortalAccess ? (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]" style={{ color: '#166534' }}>check_circle</span>
                          <span className="text-[11px] font-semibold" style={{ color: '#166534' }}>Enabled</span>
                        </div>
                      ) : (
                        <button onClick={() => setGrantAccessModal(v)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#FEF9F0] transition-colors group">
                          <span className="material-symbols-outlined text-[14px]" style={{ color: C.muted }}>lock</span>
                          <span className="text-[11px] font-semibold group-hover:underline" style={{ color: C.muted }}>Grant Access</span>
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background: statusColor[0], color: statusColor[1] }}>{v.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(v)} title="Edit" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#EEECE8] transition-colors">
                          <span className="material-symbols-outlined text-[15px]" style={{ color: C.muted }}>edit</span>
                        </button>
                        <button onClick={() => handleStatusToggle(v)} title={v.status === 'active' ? 'Deactivate' : 'Activate'}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#EEECE8] transition-colors">
                          <span className="material-symbols-outlined text-[15px]" style={{ color: v.status === 'active' ? '#D94F3D' : '#166534' }}>
                            {v.status === 'active' ? 'block' : 'check_circle'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > LIMIT && (
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[12px]" style={{ color: C.muted }}>
              Showing <strong style={{ color: C.charcoal }}>{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)}</strong> of <strong style={{ color: C.charcoal }}>{total}</strong> vendors
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EEECE8] disabled:opacity-30 transition-colors border" style={{ borderColor: C.border }}>
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
              </button>
              {Array.from({length: Math.min(totalPages,5)},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all"
                        style={{ background: page===n?C.charcoal:'#fff', color: page===n?'#fff':C.charcoal, border: page===n?'none':`1px solid ${C.border}` }}>{n}</button>
              ))}
              <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EEECE8] disabled:opacity-30 transition-colors border" style={{ borderColor: C.border }}>
                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {modal !== null && <VendorModal vendor={modal?._id ? modal : null} onClose={() => setModal(null)} onSaved={fetch} />}
      {grantAccessModal && <GrantAccessModal vendor={grantAccessModal} onClose={() => setGrantAccessModal(null)} onSaved={fetch} />}
    </div>
  );
}
