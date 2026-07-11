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

export default function DevoteeDetail({ profileId, onClose }) {
  const token = localStorage.getItem('bace_token');
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    if (newStatus === 'Paid') {
      const fee = paymentSummary?.monthlyFee || '';
      const input = prompt(`Enter paid amount for this month (₹):`, fee);
      if (input === null) return;
      amount = parseFloat(input) || null;
    }
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileId}/payments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ year, month, status: newStatus, amount })
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
    fetchProfile();
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
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">

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
              <Field label="Previous Religion" value={p.previousReligion} />
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
              <Field label="Spouse Name" value={family.spouseName} />
              <Field label="Number of Children" value={family.numberOfChildren} />
              <Field label="Emergency Contact" value={family.emergencyContact} />
              <Field label="Emergency Name" value={family.emergencyContactName} />
              <Field label="Emergency Relation" value={family.emergencyRelation} />
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
                      b.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      b.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

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
              const years = [currentYear, currentYear - 1];

              return years.map(year => (
                <div key={year} className="mb-4 last:mb-0">
                  <h5 className="font-bold text-xs text-slate-600 dark:text-slate-300 mb-2">{year}</h5>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {months.map((monthName, idx) => {
                      const monthNum = idx + 1;
                      const payment = payments.find(p => p.year === year && p.month === monthNum);
                      const isPaid = payment?.status === 'Paid';
                      const isFuture = year === currentYear && monthNum > new Date().getMonth() + 1;
                      const fee = paymentSummary?.monthlyFee || 0;
                      const paidAmt = payment?.amount || 0;
                      const remaining = isPaid ? 0 : fee - paidAmt;

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
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
            <p className="text-[10px] text-slate-400 mt-2">Click a month to toggle between Paid / Unpaid.</p>
          </SectionCard>

          {/* Membership Info */}
          <SectionCard title="Membership Information" icon={Award}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Member ID" value={p.memberId} />
              <Field label="Member Type" value={p.memberType} />
              <Field label="Member Status" value={p.memberStatus} />
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
