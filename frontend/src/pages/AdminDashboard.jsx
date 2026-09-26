import React from 'react';
const { useState, useEffect } = React;
import { 
  Users, Image, Award, Check, X, ShieldAlert, 
  Search, Trash2, Calendar, Eye, Download, FileText, ChevronRight, Activity, ArrowUpDown, ArrowUp, ArrowDown, Lock, Cake
} from 'lucide-react';
import { API_BASE, apiUrl } from '../config/api';
import DevoteeDetail from '../components/DevoteeDetail';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${active ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-900/50'}`}
  >
    {children}
  </button>
);

export default function AdminDashboard() {
  const token = localStorage.getItem('bace_token');
  const user = JSON.parse(localStorage.getItem('bace_user') || '{}');
  const isMainAdmin = user?.devoteeId === 'BACE-ADMIN-108';
  const [stats, setStats] = useState({});
  const [requests, setRequests] = useState([]);
  const [devotees, setDevotees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [serviceRolesList, setServiceRolesList] = useState([]);
  const [memberGroupsList, setMemberGroupsList] = useState([]);
  const [subMemberGroupsList, setSubMemberGroupsList] = useState([]);
  const [bookTestsList, setBookTestsList] = useState([]);
  const [editingBookTestId, setEditingBookTestId] = useState(null);
  const [editBookTestForm, setEditBookTestForm] = useState({ bookName: '', totalMarks: '', passingMarks: '' });
  const [bulkBookTest, setBulkBookTest] = useState(null);
  const [bulkDevotees, setBulkDevotees] = useState([]);
  const [bulkEntries, setBulkEntries] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState(user?.devoteeId === 'BACE-ADMIN-108' ? 'requests' : 'directory');

  // Search & Filter state for devotee list
  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState('All');
  const [searchGroup, setSearchGroup] = useState('All');
  const [searchSubGroup, setSearchSubGroup] = useState('All');
  const [searchStatus, setSearchStatus] = useState('All');
  const [searchDuration, setSearchDuration] = useState('All');
  
  // Devotee detail view
  const [selectedDevoteeId, setSelectedDevoteeId] = useState(null);

  // Sort state for devotee directory
  const [sortField, setSortField] = useState('dateJoined');
  const [sortOrder, setSortOrder] = useState('desc');

  // New Album creation state — removed (managed from Memories page)

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Load only the data needed to render the initial directory view.
      const fetches = [
        fetch(apiUrl('/api/admin/stats'), { headers }),
        fetch(apiUrl('/api/devotees'), { headers }),
        ...(isMainAdmin ? [
          fetch(apiUrl('/api/admin/requests'), { headers }),
          fetch(apiUrl('/api/admin/edit-requests'), { headers })
        ] : [])
      ];

      const responses = await Promise.allSettled(fetches);

      const json = async (r) => r.status === 'fulfilled' && r.value.ok ? (await r.value.json()) : null;

      const statsJson = await json(responses[0]);
      if (statsJson?.status === 'success') setStats(statsJson.data);

      const devJson = await json(responses[1]);
      if (devJson?.status === 'success') setDevotees(devJson.data);

      if (isMainAdmin) {
        const reqJson = await json(responses[2]);
        if (reqJson?.status === 'success') setRequests(reqJson.data);

        const editReqJson = await json(responses[3]);
        if (editReqJson?.status === 'success') setEditRequests(editReqJson.data);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const loadTabData = async () => {
      setTabLoading(true);
      try {
        if (activeSubTab === 'logs' && logs.length === 0) {
          const res = await fetch(apiUrl('/api/admin/logs'), { headers });
          const json = await res.json();
          if (json?.status === 'success') setLogs(json.data);
        } else if (activeSubTab === 'leaves' && leaveRequests.length === 0) {
          const res = await fetch(apiUrl('/api/admin/leave-requests'), { headers });
          const json = await res.json();
          if (json?.status === 'success') setLeaveRequests(json.data);
        } else if (['directory', 'serviceRoles', 'memberGroups', 'subMemberGroups'].includes(activeSubTab)) {
          const [rolesRes, groupsRes, subGroupsRes] = await Promise.all([
            fetch(apiUrl('/api/admin/service-roles'), { headers }),
            fetch(apiUrl('/api/admin/member-groups'), { headers }),
            fetch(apiUrl('/api/admin/sub-member-groups'), { headers })
          ]);
          const [rolesJson, groupsJson, subGroupsJson] = await Promise.all([
            rolesRes.json(), groupsRes.json(), subGroupsRes.json()
          ]);
          if (rolesJson?.status === 'success') setServiceRolesList(rolesJson.data);
          if (groupsJson?.status === 'success') setMemberGroupsList(groupsJson.data);
          if (subGroupsJson?.status === 'success') setSubMemberGroupsList(subGroupsJson.data);
        } else if (activeSubTab === 'bookTests' && bookTestsList.length === 0) {
          const res = await fetch(apiUrl('/api/admin/book-tests'), { headers });
          const json = await res.json();
          if (json?.status === 'success') setBookTestsList(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setTabLoading(false);
      }
    };
    if (token) loadTabData();
  }, [token, activeSubTab]);

  // Fetch every devotee's score for the book test selected for bulk grading
  useEffect(() => {
    if (!bulkBookTest) { setBulkDevotees([]); return; }
    setBulkLoading(true);
    fetch(apiUrl(`/api/admin/book-tests/${bulkBookTest.id}/scores`), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(json => {
        if (json.status === 'success') {
          setBulkDevotees(json.data.devotees);
          const initialEntries = {};
          json.data.devotees.forEach(d => { if (d.marksObtained != null) initialEntries[d.profileId] = String(d.marksObtained); });
          setBulkEntries(initialEntries);
        }
      })
      .catch(() => {})
      .finally(() => setBulkLoading(false));
  }, [bulkBookTest, token]);

  const handleBulkSave = async () => {
    if (!bulkBookTest) return;
    const entries = Object.entries(bulkEntries)
      .filter(([, marks]) => marks !== '')
      .map(([profileId, marksObtained]) => ({ profileId, marksObtained }));
    if (entries.length === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/book-tests/${bulkBookTest.id}/scores/bulk`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ entries })
      });
      const json = await res.json();
      if (res.ok) {
        const failed = json.data.filter(r => r.error);
        if (failed.length > 0) alert(`${failed.length} entrie(s) failed: ${failed.map(f => f.error).join(', ')}`);
        setBulkBookTest(null);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to save marks');
      }
    } catch { alert('Failed to save marks'); } finally { setBulkSaving(false); }
  };

  // Handle Request Action (Approve / Reject)
  const handleRequestAction = async (id, action) => {
    const comment = prompt(`Enter comments/remarks for setting status as ${action === 'Approve' ? 'Approved' : 'Rejected'}:`);
    try {
      const res = await fetch(apiUrl(`/api/admin/requests/${id}/action`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, comment })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Create Album — removed (managed from Memories page)

  // Handle Edit Request Action (Approve / Reject)
  const handleEditRequestAction = async (id, action) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/edit-requests/${id}/action`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Devotee
  const handleDeleteDevotee = async (profileId) => {
    if (!confirm('Warning: This will permanently delete the devotee profile and associated credentials. Proceed?')) return;
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Export devotee database to CSV (server-side full export)
  const handleExportCSV = async () => {
    try {
      const res = await fetch(apiUrl('/api/export/devotees/export'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BACE-Devotees-Directory-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  // Filter devotees list
  const filteredDevotees = devotees.filter(dev => {
    const nameMatch = (dev.user?.name || '').toLowerCase().includes(searchName.toLowerCase());
    const typeMatch = searchType === 'All' || dev.memberType === searchType;
    const groupMatch = searchGroup === 'All' || (dev.memberGroups || []).includes(searchGroup);
    const subGroupMatch = searchSubGroup === 'All' || (dev.subMemberGroups || []).includes(searchSubGroup);
    const statusMatch = searchStatus === 'All' || dev.memberStatus === searchStatus;
    const durationMatch = searchDuration === 'All' || (dev.durationType || 'Permanent') === searchDuration;
    return nameMatch && typeMatch && groupMatch && subGroupMatch && statusMatch && durationMatch;
  }).sort((a, b) => {
    let valA, valB;
    switch (sortField) {
      case 'devoteeId':
        valA = parseInt((a.devoteeId || '').replace('BACE-', ''), 10) || 0;
        valB = parseInt((b.devoteeId || '').replace('BACE-', ''), 10) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      case 'name':
        valA = (a.user?.name || '').toLowerCase();
        valB = (b.user?.name || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      case 'dateJoined':
        valA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        valB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      case 'memberStatus':
        valA = a.memberStatus || '';
        valB = b.memberStatus || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      case 'memberType':
        valA = a.memberType || '';
        valB = b.memberType || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      default:
        valA = parseInt((a.devoteeId || '').replace('BACE-', ''), 10) || 0;
        valB = parseInt((b.devoteeId || '').replace('BACE-', ''), 10) || 0;
        return valA - valB;
    }
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1 text-saffron-600" /> 
      : <ArrowDown className="h-3 w-3 ml-1 text-saffron-600" />;
  };

  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [birthdayCalMonth, setBirthdayCalMonth] = useState(new Date().getMonth() + 1);
  const [birthdayCalData, setBirthdayCalData] = useState([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(apiUrl('/api/devotees/birthdays/today'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => { if (json.status === 'success') setTodayBirthdays(json.data || []); })
      .catch(() => {});
  }, [token]);

  // Fetch birthday calendar for selected month
  useEffect(() => {
    if (!token || activeSubTab !== 'birthdayCalendar') return;
    setLoadingBirthdays(true);
    fetch(apiUrl(`/api/devotees/birthdays/month?month=${birthdayCalMonth}`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => { if (json.status === 'success') setBirthdayCalData(json.data || []); })
      .catch(() => {})
      .finally(() => setLoadingBirthdays(false));
  }, [token, birthdayCalMonth, activeSubTab]);

  const [rentOverview, setRentOverview] = useState(null);
  const [loadingRentOverview, setLoadingRentOverview] = useState(false);
  const [rentYear, setRentYear] = useState(new Date().getFullYear());
  const [rentMonth, setRentMonth] = useState(new Date().getMonth() + 1);

  // Fetch rent (Laxmi) overview whenever the tab is open or the selected month/year changes
  useEffect(() => {
    if (!token || activeSubTab !== 'rentOverview') return;
    setLoadingRentOverview(true);
    fetch(apiUrl(`/api/devotees/rent/overview?year=${rentYear}&month=${rentMonth}`), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(json => { if (json.status === 'success') setRentOverview(json.data); })
      .catch(() => {})
      .finally(() => setLoadingRentOverview(false));
  }, [token, activeSubTab, rentYear, rentMonth]);

  const monthName = (m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-orange-50/10 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Activity className="h-10 w-10 animate-spin text-saffron-600" />
          <span className="text-sm font-semibold">Loading Admin Dashboard statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-orange-50/10 dark:bg-slate-950 min-h-screen transition-colors">

      {/* Birthday Banner */}
      {todayBirthdays.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-950/20 dark:to-amber-950/20 border border-pink-100/50 dark:border-pink-900/30 shadow-sm relative">
          <button onClick={() => setTodayBirthdays([])} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 text-pink-400 hover:text-pink-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎂</span>
            <h3 className="font-extrabold text-sm text-pink-700 dark:text-pink-400">Today's Birthday{todayBirthdays.length > 1 ? 's' : ''}!</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {todayBirthdays.map(b => (
              <div key={b.devoteeId} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-pink-100 dark:border-pink-900/30">
                <img src={b.photographUrl && b.photographUrl.startsWith('http') ? b.photographUrl : `${API_BASE}${b.photographUrl || ''}?token=${token}`} alt={b.name} className="h-9 w-9 rounded-full object-cover border border-pink-200" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'; }} />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-800 dark:text-white">{b.name}</span>
                  <span className="text-[10px] text-slate-400">{b.devoteeId}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-pink-600/70 dark:text-pink-400/50 mt-2 font-medium">Hare Krishna! Wishing a wonderful birthday 🙏</p>
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage devotee memberships, approve uploads, and audit records.</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <div className="p-5 rounded-2xl glass-panel border border-orange-100/30 dark:border-slate-800 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Registered</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.totalUsers || 0}</span>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-orange-100/30 dark:border-slate-800 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Pending Requests</span>
          <span className={`text-2xl font-extrabold ${requests.length > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{requests.length}</span>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-orange-100/30 dark:border-slate-800 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Albums</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.totalAlbums || 0}</span>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-orange-100/30 dark:border-slate-800 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Leave Requests</span>
          <span className={`text-2xl font-extrabold ${leaveRequests.length > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{leaveRequests.length}</span>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-orange-100/30 dark:border-slate-800 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Book Tests Defined</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{bookTestsList.length}</span>
        </div>
      </div>

      {/* Subtab selection headers */}
      <div className="flex flex-wrap gap-2 border-b border-orange-100/20 dark:border-slate-800 pb-3 mb-6">
        {isMainAdmin && (
          <TabButton active={activeSubTab === 'requests'} onClick={() => setActiveSubTab('requests')}>
            Membership Requests ({requests.length})
          </TabButton>
        )}
        <TabButton active={activeSubTab === 'directory'} onClick={() => setActiveSubTab('directory')}>
          Devotee Directory ({devotees.length})
        </TabButton>
        <TabButton active={activeSubTab === 'leaves'} onClick={() => setActiveSubTab('leaves')}>
          Leave Requests{leaveRequests.length > 0 ? ` (${leaveRequests.length})` : ''}
        </TabButton>
        {isMainAdmin && (
          <TabButton active={activeSubTab === 'editRequests'} onClick={() => setActiveSubTab('editRequests')}>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Edit Requests{editRequests.length > 0 ? ` (${editRequests.length})` : ''}</span>
          </TabButton>
        )}
        <TabButton active={activeSubTab === 'logs'} onClick={() => setActiveSubTab('logs')}>
          Audit Logs
        </TabButton>
        <TabButton active={activeSubTab === 'rentOverview'} onClick={() => setActiveSubTab('rentOverview')}>
          Rent Overview
        </TabButton>
        <TabButton active={activeSubTab === 'birthdayCalendar'} onClick={() => setActiveSubTab('birthdayCalendar')}>
          Birthday Calendar
        </TabButton>

        {/* Grouped "manage list" tabs collapsed into one dropdown to reduce clutter */}
        {(() => {
          const manageTabs = [
            { key: 'serviceRoles', label: 'Service Roles' },
            { key: 'memberGroups', label: 'Member Groups' },
            { key: 'subMemberGroups', label: 'Sub Member Groups' },
            { key: 'bookTests', label: `Book Tests${bookTestsList.length > 0 ? ` (${bookTestsList.length})` : ''}` }
          ];
          const isManageActive = manageTabs.some(t => t.key === activeSubTab);
          return (
            <select
              value={isManageActive ? activeSubTab : ''}
              onChange={e => e.target.value && setActiveSubTab(e.target.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isManageActive ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 bg-transparent hover:bg-orange-50/50 dark:hover:bg-slate-900/50'}`}
            >
              <option value="" disabled>Manage Lists...</option>
              {manageTabs.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          );
        })()}
      </div>

      {/* SUBTAB DETAILS */}
      {tabLoading && (
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-400" role="status">
          <Activity className="h-4 w-4 animate-spin text-saffron-600" /> Loading tab data...
        </div>
      )}
      
      {/* 1. Membership Requests */}
      {activeSubTab === 'requests' && (
        <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
          {requests.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No pending membership registration requests.</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-orange-100/20 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Mobile</th>
                    <th className="pb-3">Registered Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="border-b border-orange-50/10 dark:border-slate-800/40 hover:bg-orange-50/10 dark:hover:bg-slate-900/10">
                      <td className="py-3 font-semibold text-slate-800 dark:text-white">{req.name}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{req.email}</td>
                      <td className="py-3 text-slate-500">{req.mobile}</td>
                      <td className="py-3 text-slate-400 text-xs">{new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td className="py-3 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => handleRequestAction(req.id, 'Approve')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-colors border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button 
                          onClick={() => handleRequestAction(req.id, 'Reject')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs transition-colors border border-red-100 dark:bg-red-950/20 dark:border-red-900/50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Devotee Directory */}
      {activeSubTab === 'directory' && (
        <div className="flex flex-col gap-6">
          {/* Quick Filters */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Search by Name</label>
              <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Legal Name" className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs" />
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Member Group</label>
              <select value={searchGroup} onChange={e => setSearchGroup(e.target.value)} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white">
                <option value="All">All Groups ({devotees.length})</option>
                {memberGroupsList.map(g => (
                  <option key={g.id} value={g.name}>{g.name} ({devotees.filter(d => (d.memberGroups || []).includes(g.name)).length})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sub Member Group</label>
              <select value={searchSubGroup} onChange={e => setSearchSubGroup(e.target.value)} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white">
                <option value="All">All Sub Groups ({devotees.length})</option>
                {subMemberGroupsList.map(g => (
                  <option key={g.id} value={g.name}>{g.name} ({devotees.filter(d => (d.subMemberGroups || []).includes(g.name)).length})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
              <select value={searchStatus} onChange={e => setSearchStatus(e.target.value)} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white">
                <option value="All">All Status ({devotees.length})</option>
                <option value="Active">Active ({devotees.filter(d => d.memberStatus === 'Active').length})</option>
                <option value="Inactive">Inactive ({devotees.filter(d => d.memberStatus === 'Inactive').length})</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
              <select value={searchDuration} onChange={e => setSearchDuration(e.target.value)} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white">
                <option value="All">All Durations ({devotees.length})</option>
                <option value="Permanent">Permanent ({devotees.filter(d => (d.durationType || 'Permanent') === 'Permanent').length})</option>
                <option value="Temporary">Temporary ({devotees.filter(d => d.durationType === 'Temporary').length})</option>
              </select>
            </div>

            <button 
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs w-full sm:w-auto sm:ml-auto shadow-sm"
            >
              <FileText className="h-4 w-4" /> Export CSV
            </button>
          </div>

          {/* Directory Table */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
            <p className="text-xs text-slate-400 mb-3">Showing {filteredDevotees.length} of {devotees.length} devotees</p>
            {filteredDevotees.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-6 text-center">No devotees matching search query.</p>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-orange-100/20 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('devoteeId')}>
                        <span className="flex items-center">Devotee ID <SortIcon field="devoteeId" /></span>
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                        <span className="flex items-center">Name <SortIcon field="name" /></span>
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('dateJoined')}>
                        <span className="flex items-center">Date of Joining <SortIcon field="dateJoined" /></span>
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('memberType')}>
                        <span className="flex items-center">Type <SortIcon field="memberType" /></span>
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('memberStatus')}>
                        <span className="flex items-center">Status <SortIcon field="memberStatus" /></span>
                      </th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevotees.map(dev => (
                      <tr key={dev.id} onClick={() => setSelectedDevoteeId(dev.id)} className="border-b border-orange-50/10 dark:border-slate-800/40 hover:bg-orange-50/10 dark:hover:bg-slate-900/10 cursor-pointer">
                        <td className="py-3 font-bold text-saffron-700 dark:text-saffron-400 text-xs">{dev.devoteeId}</td>
                        <td className="py-3 text-slate-800 dark:text-white font-semibold">{dev.user?.name}</td>
                        <td className="py-3 text-slate-500 text-xs">{dev.dateJoined ? new Date(dev.dateJoined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td className="py-3 text-slate-400 text-xs">{(dev.serviceRoles || []).join(', ') || dev.memberType}</td>
                        <td className="py-3 text-xs"><span className={`font-bold ${dev.memberStatus === 'Active' ? 'text-green-600' : 'text-red-500'}`}>{dev.memberStatus}</span></td>
                        <td className="py-3 text-xs"><span className={`font-bold ${dev.durationType === 'Temporary' ? 'text-amber-600' : 'text-slate-500'}`}>{dev.durationType || 'Permanent'}</span></td>
                        <td className="py-3 text-right flex justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedDevoteeId(dev.id)} 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-saffron-600 hover:bg-orange-50 dark:hover:bg-saffron-950/20 transition-colors"
                            title="View full profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDevotee(dev.id)} 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Audit Logs */}
      {activeSubTab === 'logs' && (
        <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No action logs recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {logs.map(log => (
                <div key={log.id} className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-orange-50/10 dark:bg-slate-900/10 text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-md bg-saffron-100/60 text-saffron-800 font-extrabold text-[9px] uppercase tracking-wider">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 mt-1">{log.details}</p>
                  <span className="text-[10px] text-slate-400 font-medium">Administrator: {log.admin?.name} ({log.admin?.email})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rent (Laxmi) Overview */}
      {activeSubTab === 'rentOverview' && (
        <div className="flex flex-col gap-6">
          {loadingRentOverview ? (
            <div className="py-16 flex justify-center"><Activity className="h-8 w-8 animate-spin text-saffron-600" /></div>
          ) : !rentOverview ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">Failed to load rent overview.</p>
          ) : (() => {
            const selected = rentOverview.monthly.find(m => m.year === rentYear && m.month === rentMonth);
            const collected = selected?.totalCollected || 0;
            const paidCount = selected?.paidCount || 0;
            return (
              <>
                <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                    <select value={rentYear} onChange={e => setRentYear(parseInt(e.target.value))} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs font-bold dark:text-white">
                      {Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Month</label>
                    <select value={rentMonth} onChange={e => setRentMonth(parseInt(e.target.value))} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs font-bold dark:text-white">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name, idx) => <option key={idx} value={idx + 1}>{name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl glass-panel border border-orange-100/30 dark:border-slate-800 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Rent Due — {monthName(rentMonth)} {rentYear}</span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{rentOverview.selectedExpected.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400">Sum of individual rent amounts for {rentOverview.selectedDevoteeCount} devotee(s) who had joined by then</span>
                  </div>
                  <div className="p-5 rounded-2xl glass-panel border border-orange-100/30 dark:border-slate-800 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Actually Paid — {monthName(rentMonth)} {rentYear}</span>
                    <span className="text-2xl font-extrabold text-emerald-600">₹{collected.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400">{paidCount} / {rentOverview.selectedDevoteeCount} devotees paid</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}


      {/* Leave Requests */}
      {activeSubTab === 'leaves' && (
        <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
          {leaveRequests.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No leave requests submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {leaveRequests.map(leave => (
                <div key={leave.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-orange-50/10 dark:bg-slate-900/10 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{leave.name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(leave.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                  {leave.spiritualName && <span className="text-slate-500 text-[10px]">({leave.spiritualName})</span>}
                  <div className="flex gap-4 mt-1">
                    <span><strong>From:</strong> {new Date(leave.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    <span><strong>To:</strong> {new Date(leave.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                  <span><strong>Destination:</strong> {leave.destination}</span>
                  {leave.reason && <span><strong>Reason:</strong> {leave.reason}</span>}
                  <span className="text-[10px] text-slate-400">Contact: {leave.mobile}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Edit Requests */}
      {activeSubTab === 'editRequests' && (
        <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
          {editRequests.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No pending edit requests.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {editRequests.map(req => (
                <div key={req.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-orange-50/10 dark:bg-slate-900/10 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {req.profile?.user?.name || 'Unknown'}
                      {req.profile?.personalInformation?.spiritualName && (
                        <span className="text-slate-400 font-normal ml-1.5">({req.profile.personalInformation.spiritualName})</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">Requested: {new Date(req.createdAt).toLocaleString()}</span>
                    <span className="text-xs font-medium text-saffron-700 dark:text-saffron-400">Section: {req.section}</span>
                    {req.reason && <span className="text-xs text-slate-500 italic mt-0.5">"{req.reason}"</span>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEditRequestAction(req.id, 'Approved')}
                      className="p-2 rounded-lg bg-emerald-100/60 hover:bg-emerald-500 hover:text-white text-emerald-600 transition-all"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditRequestAction(req.id, 'Rejected')}
                      className="p-2 rounded-lg bg-rose-100/60 hover:bg-rose-500 hover:text-white text-rose-600 transition-all"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Service Roles Management */}
      {activeSubTab === 'serviceRoles' && (
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Manage Service Roles</h3>
            <p className="text-xs text-slate-400">Create roles like "Kitchen Incharge", "Accountant", etc. Then assign them to devotees from their profile.</p>
            
            {/* Add new role */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = e.target.roleName.value.trim();
              if (!name) return;
              try {
                const res = await fetch(apiUrl('/api/admin/service-roles'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name })
                });
                const json = await res.json();
                if (res.ok) {
                  e.target.reset();
                  setServiceRolesList(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
                } else {
                  alert(json.message);
                }
              } catch { alert('Failed to create role'); }
            }} className="flex gap-2">
              <input name="roleName" placeholder="New role name (e.g. Kitchen Incharge)" className="flex-1 p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs" required />
              <button type="submit" className="px-4 py-2 rounded-xl bg-saffron-600 text-white font-bold text-xs hover:bg-saffron-700 transition-colors">Add Role</button>
            </form>

            {/* Roles list */}
            <div className="flex flex-col gap-2">
              {serviceRolesList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No service roles created yet.</p>
              ) : (
                serviceRolesList.map(role => (
                  <div key={role.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-orange-50/10 dark:bg-slate-900/10">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{role.name}</span>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete role "${role.name}"? It will be removed from all assigned devotees.`)) return;
                        const res = await fetch(apiUrl(`/api/admin/service-roles/${role.id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                        if (res.ok) setServiceRolesList(prev => prev.filter(r => r.id !== role.id));
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Member Groups Management */}
      {activeSubTab === 'memberGroups' && (
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Manage Member Groups</h3>
            <p className="text-xs text-slate-400">Create groups like "Gauranga Group", "BACE Members", etc. Then assign them to devotees from their profile.</p>
            
            {/* Add new group */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = e.target.groupName.value.trim();
              if (!name) return;
              try {
                const res = await fetch(apiUrl('/api/admin/member-groups'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name })
                });
                const json = await res.json();
                if (res.ok) {
                  e.target.reset();
                  setMemberGroupsList(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
                } else {
                  alert(json.message);
                }
              } catch { alert('Failed to create group'); }
            }} className="flex gap-2">
              <input name="groupName" placeholder="New group name (e.g. Gauranga Group)" className="flex-1 p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs" required />
              <button type="submit" className="px-4 py-2 rounded-xl bg-saffron-600 text-white font-bold text-xs hover:bg-saffron-700 transition-colors">Add Group</button>
            </form>

            {/* Groups list */}
            <div className="flex flex-col gap-2">
              {memberGroupsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No member groups created yet.</p>
              ) : (
                memberGroupsList.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-orange-50/10 dark:bg-slate-900/10">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{group.name}</span>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete group "${group.name}"? It will be removed from all assigned devotees.`)) return;
                        const res = await fetch(apiUrl(`/api/admin/member-groups/${group.id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                        if (res.ok) setMemberGroupsList(prev => prev.filter(g => g.id !== group.id));
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub Member Groups Management */}
      {activeSubTab === 'subMemberGroups' && (
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Manage Sub Member Groups</h3>
            <p className="text-xs text-slate-400">Create finer-grained sub groups within a Member Group. Then assign them to devotees from their profile.</p>

            {/* Add new sub group */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = e.target.subGroupName.value.trim();
              if (!name) return;
              try {
                const res = await fetch(apiUrl('/api/admin/sub-member-groups'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name })
                });
                const json = await res.json();
                if (res.ok) {
                  e.target.reset();
                  setSubMemberGroupsList(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
                } else {
                  alert(json.message);
                }
              } catch { alert('Failed to create sub group'); }
            }} className="flex gap-2">
              <input name="subGroupName" placeholder="New sub group name" className="flex-1 p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs" required />
              <button type="submit" className="px-4 py-2 rounded-xl bg-saffron-600 text-white font-bold text-xs hover:bg-saffron-700 transition-colors">Add Sub Group</button>
            </form>

            {/* Sub groups list */}
            <div className="flex flex-col gap-2">
              {subMemberGroupsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No sub member groups created yet.</p>
              ) : (
                subMemberGroupsList.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-orange-50/10 dark:bg-slate-900/10">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{group.name}</span>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete sub group "${group.name}"? It will be removed from all assigned devotees.`)) return;
                        const res = await fetch(apiUrl(`/api/admin/sub-member-groups/${group.id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                        if (res.ok) setSubMemberGroupsList(prev => prev.filter(g => g.id !== group.id));
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Book Tests Management */}
      {activeSubTab === 'bookTests' && (
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Manage Book Tests</h3>
            <p className="text-xs text-slate-400">Define a book test (name, total marks, passing marks). Marks obtained by each devotee are then recorded individually from their profile's "Book Test Marks" section.</p>

            {/* Add new book test */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const bookName = e.target.bookName.value.trim();
              const totalMarks = e.target.totalMarks.value;
              const passingMarks = e.target.passingMarks.value;
              if (!bookName || !totalMarks) return;
              try {
                const res = await fetch(apiUrl('/api/admin/book-tests'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ bookName, totalMarks, passingMarks: passingMarks || undefined })
                });
                const json = await res.json();
                if (res.ok) {
                  e.target.reset();
                  setBookTestsList(prev => [json.data, ...prev]);
                } else {
                  alert(json.message);
                }
              } catch { alert('Failed to create book test'); }
            }} className="flex flex-wrap gap-2">
              <input name="bookName" placeholder="Book name (e.g. Bhagavad Gita As It Is)" className="flex-1 min-w-[220px] p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs" required />
              <input name="totalMarks" type="number" min="1" placeholder="Total marks" className="w-28 p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs" required />
              <input name="passingMarks" type="number" min="0" placeholder="Passing marks (optional)" className="w-40 p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs" />
              <button type="submit" className="px-4 py-2 rounded-xl bg-saffron-600 text-white font-bold text-xs hover:bg-saffron-700 transition-colors">Add Book Test</button>
            </form>

            {/* Book tests list */}
            <div className="flex flex-col gap-2">
              {bookTestsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No book tests created yet.</p>
              ) : (
                bookTestsList.map(bt => (
                  <div key={bt.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-orange-50/10 dark:bg-slate-900/10">
                    {editingBookTestId === bt.id ? (
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        <input
                          value={editBookTestForm.bookName}
                          onChange={e => setEditBookTestForm(f => ({ ...f, bookName: e.target.value }))}
                          className="flex-1 min-w-[180px] p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs"
                        />
                        <input
                          type="number" min="1"
                          value={editBookTestForm.totalMarks}
                          onChange={e => setEditBookTestForm(f => ({ ...f, totalMarks: e.target.value }))}
                          placeholder="Total"
                          className="w-20 p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs"
                        />
                        <input
                          type="number" min="0"
                          value={editBookTestForm.passingMarks}
                          onChange={e => setEditBookTestForm(f => ({ ...f, passingMarks: e.target.value }))}
                          placeholder="Passing"
                          className="w-20 p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs"
                        />
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(apiUrl(`/api/admin/book-tests/${bt.id}`), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify(editBookTestForm)
                              });
                              const json = await res.json();
                              if (res.ok) {
                                setEditingBookTestId(null);
                                fetchAdminData();
                                if (json.warning) alert(json.warning);
                              } else {
                                alert(json.message);
                              }
                            } catch { alert('Failed to update book test'); }
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingBookTestId(null)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{bt.bookName}</span>
                          <span className="text-[10px] text-slate-400">Total: {bt.totalMarks} · Passing: {bt.passingMarks} · Scored: {bt.scoresCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setBulkBookTest(bt); setBulkEntries({}); }}
                            className="px-2 py-1 rounded-lg bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300 text-[10px] font-bold"
                          >
                            Grade All
                          </button>
                          <button
                            onClick={() => {
                              setEditingBookTestId(bt.id);
                              setEditBookTestForm({ bookName: bt.bookName, totalMarks: String(bt.totalMarks), passingMarks: String(bt.passingMarks) });
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              const res = await fetch(apiUrl(`/api/admin/book-tests/${bt.id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                              if (res.ok) { setBookTestsList(prev => prev.filter(b => b.id !== bt.id)); return; }
                              const json = await res.json();
                              if (res.status === 409) {
                                if (!confirm(`${json.message} Proceed with permanent deletion?`)) return;
                                const forceRes = await fetch(apiUrl(`/api/admin/book-tests/${bt.id}?force=true`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                if (forceRes.ok) setBookTestsList(prev => prev.filter(b => b.id !== bt.id));
                              } else {
                                alert(json.message || 'Failed to delete book test');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bulk grading panel: grade every devotee for one selected book test */}
          {bulkBookTest && (
            <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">Grade All Devotees — {bulkBookTest.bookName}</h3>
                  <p className="text-xs text-slate-400">Out of {bulkBookTest.totalMarks} · Passing: {bulkBookTest.passingMarks}</p>
                </div>
                <button onClick={() => setBulkBookTest(null)} className="text-[10px] font-bold text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  ✕ Close
                </button>
              </div>

              {bulkLoading ? (
                <div className="py-6 flex justify-center"><Activity className="h-6 w-6 animate-spin text-saffron-600" /></div>
              ) : (
                <>
                  <div className="max-h-[28rem] overflow-y-auto flex flex-col gap-1">
                    {bulkDevotees.map(d => (
                      <div key={d.profileId} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-orange-50/50 dark:hover:bg-slate-800/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 dark:text-white">{d.name}</span>
                          <span className="text-[10px] text-slate-400">{d.devoteeId}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={bulkBookTest.totalMarks}
                          value={bulkEntries[d.profileId] ?? ''}
                          onChange={e => setBulkEntries(prev => ({ ...prev, [d.profileId]: e.target.value }))}
                          placeholder="Marks"
                          className="w-24 p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs text-right dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleBulkSave}
                    disabled={bulkSaving}
                    className="self-end px-5 py-2 rounded-xl bg-saffron-600 text-white font-bold text-xs hover:bg-saffron-700 transition-colors disabled:opacity-50"
                  >
                    {bulkSaving ? 'Saving...' : 'Save All Marks'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. Birthday Calendar */}
      {activeSubTab === 'birthdayCalendar' && (
        <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Birthday Calendar</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setBirthdayCalMonth(m => m <= 1 ? 12 : m - 1)} className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-500 transition-colors text-sm font-bold">&lt;</button>
              <select value={birthdayCalMonth} onChange={e => setBirthdayCalMonth(parseInt(e.target.value))} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs font-bold dark:text-white">
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((name, i) => (
                  <option key={i+1} value={i+1}>{name}</option>
                ))}
              </select>
              <button onClick={() => setBirthdayCalMonth(m => m >= 12 ? 1 : m + 1)} className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-500 transition-colors text-sm font-bold">&gt;</button>
            </div>
          </div>

          {loadingBirthdays ? (
            <div className="py-8 flex justify-center"><Activity className="h-6 w-6 animate-spin text-saffron-600" /></div>
          ) : birthdayCalData.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-6 text-center">No birthdays in this month.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {birthdayCalData.map(b => (
                <div key={b.devoteeId} className="flex items-center gap-3 p-3 rounded-xl border border-pink-100/50 dark:border-pink-900/30 bg-pink-50/30 dark:bg-pink-950/10">
                  <img
                    src={b.photographUrl && b.photographUrl.startsWith('http') ? b.photographUrl : `${API_BASE}${b.photographUrl || ''}?token=${token}`}
                    alt={b.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-pink-200 dark:border-pink-800"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60'; }}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-sm text-slate-800 dark:text-white truncate">{b.name}</span>
                    <span className="text-[10px] text-slate-400">{b.devoteeId}</span>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-2xl font-extrabold text-pink-600 dark:text-pink-400">{b.day}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][birthdayCalMonth - 1]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Devotee Detail Modal */}
      {selectedDevoteeId && (
        <DevoteeDetail profileId={selectedDevoteeId} onClose={() => setSelectedDevoteeId(null)} />
      )}
    </div>
  );
}
