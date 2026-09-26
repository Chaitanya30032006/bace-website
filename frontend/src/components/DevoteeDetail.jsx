import React from 'react';
const { useState, useEffect } = React;
import {
  X, User, Briefcase, MapPin, Users, GraduationCap,
  Heart, Award, BookOpen, ClipboardList, Activity, IndianRupee
} from 'lucide-react';
import { API_BASE, apiUrl } from '../config/api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60';

const getPhotoUrl = (url) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http')) return url;
  const token = localStorage.getItem('bace_token');
  return `${API_BASE}${url}${token ? `?token=${token}` : ''}`;
};

const formatDate = (val) => {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">{value || '—'}</span>
  </div>
);

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="p-5 rounded-2xl border border-orange-100/30 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
    <div className="flex items-center gap-2 mb-4 border-b border-orange-100/20 dark:border-slate-800 pb-2">
      {Icon && <Icon className="h-4 w-4 text-saffron-600" />}
      <h4 className="font-bold text-sm text-slate-800 dark:text-white">{title}</h4>
    </div>
    {children}
  </div>
);

function BookTestMarksSection({ profileId, token, isAdmin }) {
  const [scores, setScores] = useState([]);
  const [bookTests, setBookTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  const [error, setError] = useState('');
  const [addForm, setAddForm] = useState({ bookTestId: '', marksObtained: '' });
  const [adding, setAdding] = useState(false);

  const fetchData = async () => {
    try {
      const [scoresRes, bookTestsRes] = await Promise.all([
        fetch(apiUrl(`/api/devotees/${profileId}/book-test-scores`), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/admin/book-tests'), { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const scoresJson = await scoresRes.json();
      if (scoresJson.data) setScores(scoresJson.data);
      const bookTestsJson = await bookTestsRes.json();
      if (bookTestsJson.status === 'success') setBookTests(bookTestsJson.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [profileId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!addForm.bookTestId || addForm.marksObtained === '') return;
    setAdding(true);
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileId}/book-test-scores`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookTestId: addForm.bookTestId, marksObtained: parseInt(addForm.marksObtained) })
      });
      const json = await res.json();
      if (!res.ok) { setError(json.message || 'Failed to add score'); return; }
      setAddForm({ bookTestId: '', marksObtained: '' });
      fetchData();
    } catch (err) { setError(err.message); } finally { setAdding(false); }
  };

  const handleEdit = async (scoreId) => {
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileId}/book-test-scores/${scoreId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ marksObtained: parseInt(editMarks) })
      });
      const json = await res.json();
      if (!res.ok) { setError(json.message || 'Failed to update score'); return; }
      setEditingId(null);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (scoreId) => {
    if (!confirm('Delete this book test score?')) return;
    try {
      await fetch(apiUrl(`/api/devotees/${profileId}/book-test-scores/${scoreId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch { /* ignore */ }
  };

  if (!isAdmin) return null;
  if (loading) return <SectionCard title="Book Test Marks" icon={BookOpen}><p className="text-xs text-slate-400">Loading...</p></SectionCard>;

  const scoredBookTestIds = scores.map(s => s.bookTestId);
  const availableBookTests = bookTests.filter(bt => !scoredBookTestIds.includes(bt.id));
  const selectedBookTest = bookTests.find(bt => bt.id === addForm.bookTestId);

  return (
    <SectionCard title="Book Test Marks" icon={BookOpen}>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {/* Add score form */}
      {bookTests.length === 0 ? (
        <p className="text-xs text-slate-400 italic mb-3">No book tests have been defined yet. Create one from Admin Panel → Book Tests.</p>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2 mb-3">
          <select
            value={addForm.bookTestId}
            onChange={e => setAddForm(f => ({ ...f, bookTestId: e.target.value }))}
            className="flex-1 min-w-[200px] p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white"
            required
          >
            <option value="">Select book test...</option>
            {availableBookTests.map(bt => (
              <option key={bt.id} value={bt.id}>{bt.bookName} (out of {bt.totalMarks})</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            max={selectedBookTest?.totalMarks}
            value={addForm.marksObtained}
            onChange={e => setAddForm(f => ({ ...f, marksObtained: e.target.value }))}
            placeholder="Marks obtained"
            className="w-32 p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white"
            required
          />
          <button type="submit" disabled={adding || availableBookTests.length === 0} className="px-3 py-2 rounded-lg bg-saffron-600 text-white font-bold text-xs hover:bg-saffron-700 transition-colors disabled:opacity-50">
            Add Score
          </button>
        </form>
      )}

      {/* Scores Table */}
      {scores.length === 0 ? (
        <p className="text-xs text-slate-400 italic mb-3">No book test scores recorded.</p>
      ) : (
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-orange-100/20 dark:border-slate-800 text-slate-400 font-bold uppercase">
                <th className="pb-2 text-left">Book Name</th>
                <th className="pb-2 text-left">Total / Pass</th>
                <th className="pb-2 text-left">Marks Obtained</th>
                <th className="pb-2 text-left">Percentage</th>
                <th className="pb-2 text-left">Result</th>
                {isAdmin && <th className="pb-2 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/40">
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.bookTest?.bookName || '—'}</td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {s.bookTest?.totalMarks || '—'}
                    {s.bookTest?.passingMarks != null && (
                      <span className="ml-1 text-[9px] text-slate-400">(pass: {s.bookTest.passingMarks})</span>
                    )}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        value={editMarks}
                        onChange={(e) => setEditMarks(e.target.value)}
                        className="w-16 p-1 border rounded text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        min="0"
                        max={s.bookTest?.totalMarks}
                      />
                    ) : (
                      s.marksObtained
                    )}
                  </td>
                  <td className="py-2 text-slate-500">
                    {s.bookTest?.totalMarks ? `${Math.round((s.marksObtained / s.bookTest.totalMarks) * 100)}%` : '—'}
                  </td>
                  <td className="py-2">
                    {s.bookTest?.totalMarks ? (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        s.marksObtained >= (s.bookTest.passingMarks ?? Math.ceil(s.bookTest.totalMarks * 0.5))
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'
                      }`}>
                        {s.marksObtained >= (s.bookTest.passingMarks ?? Math.ceil(s.bookTest.totalMarks * 0.5)) ? 'Pass' : 'Fail'}
                      </span>
                    ) : '—'}
                  </td>
                  {isAdmin && (
                  <td className="py-2">
                    {editingId === s.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(s.id)} className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingId(s.id); setEditMarks(String(s.marksObtained)); }} className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-[10px] font-bold">Delete</button>
                      </div>
                    )}
                  </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// Compact dropdown multi-select row component
function MultiSelectRow({ label, options, selected, onUpdate, color = 'blue' }) {
  const [open, setOpen] = useState(false);
  const selectedLabels = options.filter(o => selected.includes(o.key)).map(o => o.label);

  const colorMap = {
    blue: { tag: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', check: 'text-blue-600' },
    violet: { tag: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300', check: 'text-violet-600' }
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="flex items-start gap-2 relative">
      <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0 mt-1">{label}:</span>
      <div className="flex-1 min-w-0">
        {/* Selected tags + trigger button */}
        <div className="flex flex-wrap items-center gap-1">
          {selectedLabels.map(l => (
            <span key={l} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${colors.tag}`}>{l}</span>
          ))}
          <button
            onClick={() => setOpen(!open)}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {open ? '✕ Close' : `+ Edit`}
          </button>
        </div>
        {/* Dropdown checklist */}
        {open && (
          <div className="mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-48 overflow-y-auto z-10 relative">
            {options.map(({ key, label: optLabel }) => {
              const isChecked = selected.includes(key);
              return (
                <label key={key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const newSelected = isChecked ? selected.filter(s => s !== key) : [...selected, key];
                      onUpdate(newSelected);
                    }}
                    className="rounded border-slate-300 dark:border-slate-600 text-saffron-600 focus:ring-saffron-500"
                  />
                  <span className={`font-medium ${isChecked ? colors.check : 'text-slate-600 dark:text-slate-300'}`}>{optLabel}</span>
                </label>
              );
            })}
            {options.length === 0 && <span className="text-[10px] text-slate-400 italic px-2">No options available</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DevoteeDetail({ profileId, onClose }) {
  const token = localStorage.getItem('bace_token');
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayYear, setSelectedPayYear] = useState(new Date().getFullYear());
  const [serviceRoles, setServiceRoles] = useState([]);
  const [memberGroupOptions, setMemberGroupOptions] = useState([]);
  const [subMemberGroupOptions, setSubMemberGroupOptions] = useState([]);

  const fetchPayments = async (id) => {
    try {
      const res = await fetch(apiUrl(`/api/devotees/${id}/payments`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success') {
        setPayments(json.data.payments || []);
        setPaymentSummary(json.data.summary || null);
      }
    } catch { setPayments([]); setPaymentSummary(null); }
  };

  const togglePayment = async (year, month, currentStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    let amount = null;
    let remarks = null;
    if (newStatus === 'Paid') {
      const fee = paymentSummary?.monthlyFee || '';
      const input = prompt(`Enter paid amount for this month (₹):`, fee);
      if (input === null) return;
      amount = parseFloat(input) || null;
    }
    remarks = prompt('Remark (optional):', '') || null;
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileId}/payments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ year, month, status: newStatus, amount, remarks })
      });
      if (res.ok) fetchPayments(profileId);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(apiUrl(`/api/devotees/${profileId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setProfile(json.data);
        fetchPayments(profileId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    const fetchServiceRoles = async () => {
      try {
        const res = await fetch(apiUrl('/api/admin/service-roles'), { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.data) setServiceRoles(json.data);
      } catch {}
    };
    const fetchMemberGroups = async () => {
      try {
        const res = await fetch(apiUrl('/api/admin/member-groups'), { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.data) setMemberGroupOptions(json.data);
      } catch {}
    };
    const fetchSubMemberGroups = async () => {
      try {
        const res = await fetch(apiUrl('/api/admin/sub-member-groups'), { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.data) setSubMemberGroupOptions(json.data);
      } catch {}
    };
    fetchProfile();
    fetchServiceRoles();
    fetchMemberGroups();
    fetchSubMemberGroups();
  }, [profileId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 animate-spin text-saffron-600" />
          <span className="text-sm font-semibold text-slate-500">Loading devotee profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 flex flex-col items-center gap-4 max-w-md">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-saffron-600 text-white font-bold text-xs">Close</button>
        </div>
      </div>
    );
  }

  const p = profile;
  const u = p?.user || {};
  const addresses = p?.addresses || [];
  const family = p?.family || {};
  const skills = p?.skills || {};
  const devotional = p?.devotionalInfo || {};
  const educationRecords = p?.educationRecords || [];
  const chantingTimeline = p?.chantingTimeline || [];
  const devotionalCourses = p?.devotionalCourses || [];
  const bookProgress = p?.bookProgress || [];

  const currentAddr = addresses.find(a => a.type === 'Current') || {};
  const nativeAddr = addresses.find(a => a.type === 'Native') || {};

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-orange-50/95 dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 relative">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-t-3xl border-b border-orange-100/30 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
          <img
            src={getPhotoUrl(p.photographUrl)}
            alt={u.name}
            className="h-14 w-14 rounded-2xl object-cover border-2 border-saffron-200 dark:border-slate-700"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">{u.name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="font-bold text-saffron-700 dark:text-saffron-400">{p.devoteeId}</span>
              <span>•</span>
              <span>{u.email}</span>
              <span>•</span>
              <span>{u.mobile}</span>
              {(p.serviceRoles || []).length > 0 && (
                <>
                  <span>•</span>
                  <span className="font-bold text-violet-600 dark:text-violet-400">{p.serviceRoles.join(', ')}</span>
                </>
              )}
            </div>
          </div>
          {p.devoteeId !== 'BACE-ADMIN-108' && JSON.parse(localStorage.getItem('bace_user') || '{}')?.devoteeId === 'BACE-ADMIN-108' && (
          <button
            onClick={async () => {
              const isAdmin = u.role?.name === 'Admin' || u.role === 'Admin';
              const action = isAdmin ? 'remove-admin' : 'make-admin';
              const confirmMsg = isAdmin
                ? `Remove admin access from ${u.name}?`
                : `Give admin access to ${u.name}?`;
              if (!confirm(confirmMsg)) return;
              try {
                const res = await fetch(apiUrl(`/api/admin/users/${u.id}/${action}`), {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                alert(json.message);
                if (res.ok) onClose();
              } catch (err) { alert('Failed: ' + err.message); }
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              (u.role?.name === 'Admin' || u.role === 'Admin')
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200'
            }`}
          >
            {(u.role?.name === 'Admin' || u.role === 'Admin') ? 'Remove Admin' : 'Make Admin'}
          </button>
          )}
          <button
            onClick={() => { window.open(`/dashboard?editProfile=${profileId}`, '_blank'); }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300 hover:bg-saffron-200 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">

          {/* Admin Controls: Roles, Groups, Status */}
          {p.devoteeId !== 'BACE-ADMIN-108' && (
            <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
              <div className="grid grid-cols-1 gap-3">

                {/* Row 1: Status + Permissions */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                    <select
                      value={p.memberStatus || 'Active'}
                      onChange={async (e) => {
                        const memberStatus = e.target.value;
                        try {
                          await fetch(apiUrl(`/api/admin/users/${u.id}/member-status`), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ memberStatus })
                          });
                          setProfile(prev => ({ ...prev, memberStatus }));
                        } catch (err) { console.error(err); }
                      }}
                      className={`p-1 px-2 border rounded-md text-[11px] font-bold ${p.memberStatus === 'Active' ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'border-red-300 text-red-700 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Duration:</span>
                    <select
                      value={p.durationType || 'Permanent'}
                      onChange={async (e) => {
                        const durationType = e.target.value;
                        try {
                          await fetch(apiUrl(`/api/admin/users/${u.id}/duration-type`), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ durationType })
                          });
                          setProfile(prev => ({ ...prev, durationType }));
                        } catch (err) { console.error(err); }
                      }}
                      className={`p-1 px-2 border rounded-md text-[11px] font-bold ${p.durationType === 'Temporary' ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' : 'border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300'}`}
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>

                  {JSON.parse(localStorage.getItem('bace_user') || '{}')?.devoteeId === 'BACE-ADMIN-108' && (() => {
                    const hasAccountant = (u.additionalRoles || []).includes('Accountant');
                    return hasAccountant ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">✓ Accountant</span>
                        <button
                          onClick={async () => {
                            if (!confirm('Remove Accountant permission from this user? They will lose access to edit payment records.')) return;
                            try {
                              await fetch(apiUrl(`/api/admin/users/${u.id}/additional-roles`), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ roles: [] })
                              });
                              setProfile(prev => ({ ...prev, user: { ...prev.user, additionalRoles: [] } }));
                            } catch (err) { console.error(err); }
                          }}
                          className="text-[9px] text-red-400 hover:text-red-600 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!confirm('Grant Accountant permission to this user? They will be able to edit payment history of all members.')) return;
                          try {
                            const res = await fetch(apiUrl(`/api/admin/users/${u.id}/additional-roles`), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ roles: ['Accountant'] })
                            });
                            const json = await res.json();
                            if (!res.ok) { alert(json.message || 'Failed'); return; }
                            setProfile(prev => ({ ...prev, user: { ...prev.user, additionalRoles: ['Accountant'] } }));
                          } catch (err) { console.error(err); }
                        }}
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        Grant Accountant
                      </button>
                    );
                  })()}
                </div>

                {/* Row 2: Member Groups — dropdown checklist */}
                <MultiSelectRow
                  label="Groups"
                  options={memberGroupOptions.map(g => ({ key: g.name, label: g.name }))}
                  selected={p.memberGroups || []}
                  onUpdate={async (newGroups) => {
                    try {
                      const res = await fetch(apiUrl(`/api/admin/users/${u.id}/member-group`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ memberGroups: newGroups })
                      });
                      if (res.ok) {
                        setProfile(prev => ({ ...prev, memberGroups: newGroups }));
                      }
                    } catch (err) { console.error(err); }
                  }}
                  color="blue"
                />

                {/* Row 2b: Sub Member Groups — dropdown checklist */}
                <MultiSelectRow
                  label="Sub Groups"
                  options={subMemberGroupOptions.map(g => ({ key: g.name, label: g.name }))}
                  selected={p.subMemberGroups || []}
                  onUpdate={async (newSubGroups) => {
                    try {
                      const res = await fetch(apiUrl(`/api/admin/users/${u.id}/sub-member-group`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ subMemberGroups: newSubGroups })
                      });
                      if (res.ok) {
                        setProfile(prev => ({ ...prev, subMemberGroups: newSubGroups }));
                      }
                    } catch (err) { console.error(err); }
                  }}
                  color="violet"
                />

                {/* Row 3: Service Roles — dropdown checklist */}
                <MultiSelectRow
                  label="Service"
                  options={serviceRoles.map(r => ({ key: r.name, label: r.name }))}
                  selected={p.serviceRoles || []}
                  onUpdate={async (newRoles) => {
                    try {
                      const res = await fetch(apiUrl('/api/admin/service-roles/assign'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ profileId, roleNames: newRoles })
                      });
                      if (res.ok) setProfile(prev => ({ ...prev, serviceRoles: newRoles }));
                    } catch (err) { console.error(err); }
                  }}
                  color="violet"
                />

              </div>
            </div>
          )}

          {/* Basic Info */}
          <SectionCard title="Basic Information" icon={User}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Spiritual Name" value={p.spiritualName} />
              <Field label="Gender" value={p.gender} />
              <Field label="Date of Birth" value={formatDate(p.dob)} />
              <Field label="Blood Group" value={p.bloodGroup} />
              <Field label="Marital Status" value={p.maritalStatus} />
              <Field label="Center" value={p.center} />
              <Field label="Account Status" value={u.status} />
              <Field label="Registered On" value={formatDate(u.createdAt)} />
            </div>
          </SectionCard>

          {/* Initiation Details */}
          <SectionCard title="Initiation Details" icon={Heart}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Harinam Initiated" value={p.harinamInitiated ? 'Yes' : 'No'} />
              <Field label="Initiated Name" value={p.initiatedName} />
              <Field label="Spiritual Master" value={p.spiritualMaster} />
              <Field label="Initiated Date & Place" value={p.initiatedDatePlace} />
              <Field label="Initiation Ceremony" value={p.initiationCeremony} />
              <Field label="Brahmin Initiated" value={p.brahminInitiated ? 'Yes' : 'No'} />
            </div>
          </SectionCard>

          {/* Personal & Background */}
          <SectionCard title="Personal & Background" icon={Briefcase}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="First Language" value={p.firstLanguage} />
              <Field label="Languages Known" value={p.languagesKnown} />
              <Field label="Citizen Of" value={p.citizenOf} />
              <Field label="Native Country" value={p.nativeCountry} />
              <Field label="Native State" value={p.nativeState} />
              <Field label="Native City" value={p.nativeCity} />
              <Field label="Caste" value={p.caste} />
              <Field label="PAN Number" value={p.panNumber} />
              <Field label="Aadhaar Number" value={p.aadharNumber} />
            </div>
          </SectionCard>

          {/* Skills & Occupation */}
          <SectionCard title="Skills & Occupation" icon={Briefcase}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Occupation" value={skills.occupation} />
              <Field label="Company / Organization" value={skills.companyOrg} />
              <Field label="Skills" value={skills.skills} />
              <Field label="Interests" value={skills.interests} />
              <Field label="Hobbies" value={skills.hobbies} />
            </div>
          </SectionCard>

          {/* Communication */}
          <SectionCard title="Communication" icon={ClipboardList}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Email" value={u.email} />
              <Field label="Mobile" value={u.mobile} />
              <Field label="WhatsApp" value={p.whatsappNumber} />
            </div>
          </SectionCard>

          {/* Addresses */}
          <SectionCard title="Addresses" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-xs font-bold text-saffron-600 mb-2">Current Address</h5>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="House / Street / PO" value={currentAddr.houseStreetPO} />
                  <Field label="City / District" value={currentAddr.cityDistrict} />
                  <Field label="State / Province" value={currentAddr.stateProvince} />
                  <Field label="Country" value={currentAddr.country} />
                  <Field label="PIN / ZIP" value={currentAddr.pinZip} />
                </div>
              </div>
              <div>
                <h5 className="text-xs font-bold text-saffron-600 mb-2">Native Address</h5>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="House / Street / PO" value={nativeAddr.houseStreetPO} />
                  <Field label="City / District" value={nativeAddr.cityDistrict} />
                  <Field label="State / Province" value={nativeAddr.stateProvince} />
                  <Field label="Country" value={nativeAddr.country} />
                  <Field label="PIN / ZIP" value={nativeAddr.pinZip} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Family */}
          <SectionCard title="Family Information" icon={Users}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Father's Name" value={family.fatherName} />
              <Field label="Mother's Name" value={family.motherName} />
              <Field label="Father's Contact" value={family.fatherContact} />
              <Field label="Mother's Contact" value={family.motherContact} />
              <Field label="Emergency Contact" value={family.emergencyContact} />
            </div>
          </SectionCard>

          {/* Education */}
          <SectionCard title="Education Records" icon={GraduationCap}>
            {educationRecords.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No education records.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-orange-100/20 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-2 text-left">Qualification</th>
                      <th className="pb-2 text-left">School</th>
                      <th className="pb-2 text-left">College</th>
                      <th className="pb-2 text-left">Degree</th>
                      <th className="pb-2 text-left">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {educationRecords.map((e, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/40">
                        <td className="py-2 text-slate-700 dark:text-slate-300">{e.qualification || '—'}</td>
                        <td className="py-2 text-slate-600 dark:text-slate-400">{e.school || '—'}</td>
                        <td className="py-2 text-slate-600 dark:text-slate-400">{e.college || '—'}</td>
                        <td className="py-2 text-slate-600 dark:text-slate-400">{e.degree || '—'}</td>
                        <td className="py-2 text-slate-500">{e.passingYear || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Devotional Information */}
          <SectionCard title="Devotional Information" icon={Heart}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Date of Joining" value={formatDate(devotional.dateJoined)} />
              <Field label="Spiritual Guide" value={devotional.spiritualGuide} />
              <Field label="First Connected Center" value={devotional.firstConnectedCenter} />
              <Field label="Introduced By" value={devotional.introducedBy} />
              <Field label="Program Details" value={devotional.programDetails} />
            </div>
          </SectionCard>

          {/* Chanting Timeline */}
          <SectionCard title="Chanting Timeline" icon={Activity}>
            {chantingTimeline.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No chanting records.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-orange-100/20 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-2 text-left">Rounds</th>
                      <th className="pb-2 text-left">Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chantingTimeline.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/40">
                        <td className="py-2 text-slate-700 dark:text-slate-300 font-semibold">{c.rounds}</td>
                        <td className="py-2 text-slate-500">{formatDate(c.startDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Devotional Courses */}
          <SectionCard title="Devotional Courses" icon={BookOpen}>
            {devotionalCourses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No course records.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-orange-100/20 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-2 text-left">Course Name</th>
                      <th className="pb-2 text-left">Year</th>
                      <th className="pb-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devotionalCourses.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/40">
                        <td className="py-2 text-slate-700 dark:text-slate-300">{c.courseName}</td>
                        <td className="py-2 text-slate-500">{c.completionYear || '—'}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Book Reading Progress */}
          <SectionCard title="Book Reading Progress" icon={BookOpen}>
            {bookProgress.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No book progress records.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {bookProgress.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{b.bookName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{b.completedChapters}/{b.totalChapters} chapters</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-saffron-500 rounded-full transition-all"
                          style={{ width: `${b.readingPercentage || 0}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      b.status === 'Read' ? 'bg-emerald-50 text-emerald-600' :
                      b.status === 'Reading' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Book Test Marks */}
          <BookTestMarksSection profileId={profileId} token={token} isAdmin={JSON.parse(localStorage.getItem('bace_user') || '{}')?.role === 'Admin'} />

          {/* Payments */}
          <SectionCard title="Monthly Payments" icon={IndianRupee}>
            {/* Monthly Fee & Deposit */}
            {paymentSummary && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 text-center">
                  <span className="text-[9px] font-bold uppercase text-slate-500">Monthly Fee</span>
                  <p className="text-sm font-extrabold text-blue-600">₹{paymentSummary.monthlyFee || 0}</p>
                </div>
                <div className={`p-3 rounded-xl border text-center ${
                  paymentSummary.depositPaid
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20'
                }`}>
                  <span className="text-[9px] font-bold uppercase text-slate-500">Deposit</span>
                  <p className={`text-sm font-extrabold ${paymentSummary.depositPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {paymentSummary.depositPaid ? `✓ ₹${paymentSummary.depositAmount || 0}` : 'Not Paid'}
                  </p>
                </div>
              </div>
            )}

            {/* Admin Controls: Set Fee & Deposit */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={async () => {
                  const fee = prompt('Enter monthly fee amount (₹):', paymentSummary?.monthlyFee || '');
                  if (fee === null) return;
                  await fetch(apiUrl(`/api/devotees/${profileId}/monthly-fee`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ monthlyFee: fee })
                  });
                  fetchPayments(profileId);
                }}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-200 transition-colors"
              >
                Set Monthly Fee
              </button>
              <button
                onClick={async () => {
                  const amt = prompt('Enter deposit amount (₹):', paymentSummary?.depositAmount || '');
                  if (amt === null) return;
                  const remarks = prompt('Deposit remarks (optional):', paymentSummary?.depositRemarks || '');
                  await fetch(apiUrl(`/api/devotees/${profileId}/deposit`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ depositPaid: true, depositAmount: amt, remarks })
                  });
                  fetchPayments(profileId);
                }}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-200 transition-colors"
              >
                {paymentSummary?.depositPaid ? 'Update Deposit' : 'Mark Deposit Paid'}
              </button>
              {paymentSummary?.depositPaid && (
                <button
                  onClick={async () => {
                    if (!confirm('Remove deposit paid status?')) return;
                    await fetch(apiUrl(`/api/devotees/${profileId}/deposit`), {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ depositPaid: false })
                    });
                    fetchPayments(profileId);
                  }}
                  className="text-[10px] px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-200 transition-colors"
                >
                  Remove Deposit
                </button>
              )}
            </div>

            {(() => {
              const currentYear = new Date().getFullYear();
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const yearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);
              const year = selectedPayYear;

              return (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                    <select
                      value={selectedPayYear}
                      onChange={e => setSelectedPayYear(parseInt(e.target.value))}
                      className="p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs font-bold dark:text-white"
                    >
                      {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="mb-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {months.map((monthName, idx) => {
                        const monthNum = idx + 1;
                        const payment = payments.find(p => p.year === year && p.month === monthNum);
                        const isPaid = payment?.status === 'Paid';
                        const isFuture = year === currentYear && monthNum > new Date().getMonth() + 1;
                        const fee = paymentSummary?.monthlyFee || 0;
                        const paidAmt = payment?.amount || 0;

                        return (
                          <button
                            key={monthNum}
                            disabled={isFuture}
                            onClick={() => togglePayment(year, monthNum, isPaid ? 'Paid' : 'Unpaid')}
                            className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                              isFuture
                                ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-40 cursor-not-allowed'
                                : isPaid
                                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 cursor-pointer'
                                  : 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 cursor-pointer'
                            }`}
                            title={isFuture ? 'Future month' : `Click to mark as ${isPaid ? 'Unpaid' : 'Paid'}`}
                          >
                            <span className="text-[9px] font-bold text-slate-500">{monthName}</span>
                            <span className={`text-[10px] font-extrabold ${
                              isFuture ? 'text-slate-400' : isPaid ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {isFuture ? '—' : isPaid ? '✓ Paid' : '✗ Due'}
                            </span>
                            {!isFuture && (
                              <>
                                <span className="text-[8px] text-emerald-500">₹{paidAmt}</span>
                                <span className="text-[8px] text-rose-500">Rem: ₹{fee - paidAmt > 0 ? fee - paidAmt : 0}</span>
                                {payment?.remarks && <span className="text-[7px] text-slate-400 italic truncate w-full">{payment.remarks}</span>}
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
            <p className="text-[10px] text-slate-400 mt-2">Click a month to toggle between Paid / Unpaid.</p>
          </SectionCard>

          {/* Membership Info */}
          <SectionCard title="Membership Information" icon={Award}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Member ID" value={p.memberId} />
              <Field label="Member Type" value={p.memberType} />
              <Field label="Member Groups" value={(p.memberGroups || []).join(', ') || '—'} />
              <Field label="Sub Member Groups" value={(p.subMemberGroups || []).join(', ') || '—'} />
              <Field label="Member Status" value={p.memberStatus} />
              <Field label="Duration Type" value={p.durationType || 'Permanent'} />
              <Field label="Start Date" value={formatDate(p.memberStartDate)} />
              <Field label="Expiry Date" value={formatDate(p.memberExpiryDate)} />
              <Field label="Anniversary Info" value={p.anniversaryInfo} />
              <Field label="Approved By" value={p.approvedByName} />
              <Field label="Approved On" value={formatDate(p.membershipApprovedAt)} />
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
