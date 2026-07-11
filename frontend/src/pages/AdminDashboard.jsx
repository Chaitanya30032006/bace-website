import React from 'react';
const { useState, useEffect } = React;
import { 
  Users, Image, Award, Check, X, ShieldAlert, 
  Search, Trash2, Calendar, Eye, Download, FileText, ChevronRight, Activity, ArrowUpDown, ArrowUp, ArrowDown, Lock 
} from 'lucide-react';
import { API_BASE, apiUrl } from '../config/api';
import DevoteeDetail from '../components/DevoteeDetail';

export default function AdminDashboard() {
  const token = localStorage.getItem('bace_token');
  const user = JSON.parse(localStorage.getItem('bace_user') || '{}');
  const isMainAdmin = user?.devoteeId === 'BACE-ADMIN-108';
  const [stats, setStats] = useState({});
  const [requests, setRequests] = useState([]);
  const [devotees, setDevotees] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState(user?.devoteeId === 'BACE-ADMIN-108' ? 'requests' : 'directory');

  // Search & Filter state for devotee list
  const [searchName, setSearchName] = useState('');
  const [searchSpiritual, setSearchSpiritual] = useState('');
  const [searchType, setSearchType] = useState('All');
  
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

      // Fetch all data in parallel for speed
      const fetches = [
        fetch(apiUrl('/api/admin/stats'), { headers }),
        fetch(apiUrl('/api/devotees'), { headers }),
        fetch(apiUrl('/api/gallery/pending'), { headers }),
        fetch(apiUrl('/api/admin/logs'), { headers }),
        fetch(apiUrl('/api/admin/leave-requests'), { headers }),
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

      const photosJson = await json(responses[2]);
      if (photosJson?.status === 'success') setPendingPhotos(photosJson.data);

      const logsJson = await json(responses[3]);
      if (logsJson?.status === 'success') setLogs(logsJson.data);

      const leaveJson = await json(responses[4]);
      if (leaveJson?.status === 'success') setLeaveRequests(leaveJson.data);

      if (isMainAdmin) {
        const reqJson = await json(responses[5]);
        if (reqJson?.status === 'success') setRequests(reqJson.data);

        const editReqJson = await json(responses[6]);
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

  // Handle Approve photo
  const handleApprovePhoto = async (photoId) => {
    try {
      const res = await fetch(apiUrl(`/api/gallery/photos/${photoId}/approve`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete photo
  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      const res = await fetch(apiUrl(`/api/gallery/photos/${photoId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
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
    const spiritualMatch = (dev.spiritualName || '').toLowerCase().includes(searchSpiritual.toLowerCase());
    const typeMatch = searchType === 'All' || dev.memberType === searchType;
    return nameMatch && spiritualMatch && typeMatch;
  }).sort((a, b) => {
    let valA, valB;
    switch (sortField) {
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
        return 0;
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
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
          <span className="text-[10px] uppercase font-bold text-slate-400">Moderation Images</span>
          <span className={`text-2xl font-extrabold ${pendingPhotos.length > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{pendingPhotos.length}</span>
        </div>
      </div>

      {/* Subtab selection headers */}
      <div className="flex gap-2 border-b border-orange-100/20 dark:border-slate-800 pb-3 mb-6">
        {isMainAdmin && (
        <button 
          onClick={() => setActiveSubTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'requests' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-900/50'}`}
        >
          Membership Requests ({requests.length})
        </button>
        )}
        <button 
          onClick={() => setActiveSubTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'directory' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-900/50'}`}
        >
          Devotee Directory ({devotees.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'logs' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-900/50'}`}
        >
          Audit Logs
        </button>
        <button 
          onClick={() => setActiveSubTab('leaves')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'leaves' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-900/50'}`}
        >
          Leave Requests
        </button>
        {isMainAdmin && (
        <button 
          onClick={() => setActiveSubTab('editRequests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'editRequests' ? 'bg-saffron-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-900/50'}`}
        >
          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Edit Requests{editRequests.length > 0 ? ` (${editRequests.length})` : ''}</span>
        </button>
        )}
      </div>

      {/* SUBTAB DETAILS */}
      
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
                      <td className="py-3 text-slate-400 text-xs">{new Date(req.createdAt).toLocaleDateString()}</td>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Search by Spiritual Name</label>
              <input type="text" value={searchSpiritual} onChange={e => setSearchSpiritual(e.target.value)} placeholder="Spiritual Name" className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs" />
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Membership Type</label>
              <select value={searchType} onChange={e => setSearchType(e.target.value)} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white">
                <option value="All">All Types</option>
                <option value="General">General</option>
                <option value="Life Member">Life Member</option>
                <option value="Youth Member">Youth Member</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>

            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs ml-auto shadow-sm"
            >
              <FileText className="h-4 w-4" /> Export CSV
            </button>
          </div>

          {/* Directory Table */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
            {filteredDevotees.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-6 text-center">No devotees matching search query.</p>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-orange-100/20 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">Devotee ID</th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                        <span className="flex items-center">Name <SortIcon field="name" /></span>
                      </th>
                      <th className="pb-3">Spiritual Name</th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('dateJoined')}>
                        <span className="flex items-center">Date of Joining <SortIcon field="dateJoined" /></span>
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('memberType')}>
                        <span className="flex items-center">Type <SortIcon field="memberType" /></span>
                      </th>
                      <th className="pb-3 cursor-pointer select-none" onClick={() => toggleSort('memberStatus')}>
                        <span className="flex items-center">Status <SortIcon field="memberStatus" /></span>
                      </th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevotees.map(dev => (
                      <tr key={dev.id} onClick={() => setSelectedDevoteeId(dev.id)} className="border-b border-orange-50/10 dark:border-slate-800/40 hover:bg-orange-50/10 dark:hover:bg-slate-900/10 cursor-pointer">
                        <td className="py-3 font-bold text-saffron-700 dark:text-saffron-400 text-xs">{dev.devoteeId}</td>
                        <td className="py-3 text-slate-800 dark:text-white font-semibold">{dev.user?.name}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300 font-medium italic">{dev.spiritualName || 'N/A'}</td>
                        <td className="py-3 text-slate-500 text-xs">{dev.dateJoined ? new Date(dev.dateJoined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td className="py-3 text-slate-400 text-xs">{dev.memberType}</td>
                        <td className="py-3 text-xs"><span className={`font-bold ${dev.memberStatus === 'Active' ? 'text-green-600' : 'text-slate-400'}`}>{dev.memberStatus}</span></td>
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
                    <span className="text-[10px] text-slate-400">{new Date(leave.createdAt).toLocaleDateString()}</span>
                  </div>
                  {leave.spiritualName && <span className="text-slate-500 text-[10px]">({leave.spiritualName})</span>}
                  <div className="flex gap-4 mt-1">
                    <span><strong>From:</strong> {new Date(leave.fromDate).toLocaleDateString()}</span>
                    <span><strong>To:</strong> {new Date(leave.toDate).toLocaleDateString()}</span>
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

      {/* Devotee Detail Modal */}
      {selectedDevoteeId && (
        <DevoteeDetail profileId={selectedDevoteeId} onClose={() => setSelectedDevoteeId(null)} />
      )}
    </div>
  );
}
