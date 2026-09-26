import React from 'react';
const { useState, useEffect } = React;
import { 
  User, ShieldAlert, Award, BookOpen, MapPin, 
  Users, GraduationCap, Heart, Briefcase, Plus, Trash2, Edit2, Check, X, ClipboardList, Activity, Lock, Clock, IndianRupee, Plane, Cake 
} from 'lucide-react';

import { API_BASE, apiUrl } from '../config/api';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60';

const emptyAddress = (type) => ({
  type,
  houseStreetPO: '',
  country: 'India',
  stateProvince: '',
  cityDistrict: '',
  pinZip: ''
});

const resolveAddress = (addresses, type, legacyType) => {
  const match = (addresses || []).find(a => a.type === type)
    || (legacyType ? (addresses || []).find(a => a.type === legacyType) : null);
  return match ? { ...match } : emptyAddress(type);
};

const getPhotoUrl = (url) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http')) return url;
  const token = localStorage.getItem('bace_token');
  return `${API_BASE}${url}${token ? `?token=${token}` : ''}`;
};

export default function Dashboard() {
  const token = localStorage.getItem('bace_token');
  const currentUser = JSON.parse(localStorage.getItem('bace_user') || '{}');
  const isAdmin = currentUser?.role === 'Admin';
  const [isAccountant, setIsAccountant] = useState((currentUser?.additionalRoles || []).includes('Accountant'));
  
  // Check if admin is editing another devotee's profile
  const urlParams = new URLSearchParams(window.location.search);
  const editProfileId = urlParams.get('editProfile');
  
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('Basic Info');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lockedSections, setLockedSections] = useState([]);
  const [pendingSections, setPendingSections] = useState([]);
  const [requestingEdit, setRequestingEdit] = useState(false);

  // Form edit states
  const [basicForm, setBasicForm] = useState({});
  const [personalForm, setPersonalForm] = useState({});
  const [familyForm, setFamilyForm] = useState({});
  const [devotionalForm, setDevotionalForm] = useState({});
  
  // Lists edit states
  const [educationList, setEducationList] = useState([]);
  const [chantingList, setChantingList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [booksList, setBooksList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [selectedPaymentYear, setSelectedPaymentYear] = useState(new Date().getFullYear());
  const [currentAddress, setCurrentAddress] = useState(emptyAddress('Current'));
  const [nativeAddress, setNativeAddress] = useState(emptyAddress('Native'));

  // Sub-resource creation inputs
  const [newEdu, setNewEdu] = useState({ qualification: '', school: '', college: '', degree: '', passingYear: '' });
  const [newChanting, setNewChanting] = useState({ rounds: 16, startDate: '' });
  const [newCourse, setNewCourse] = useState({ courseName: '', completionYear: '', status: 'Completed' });
  const [newBook, setNewBook] = useState({ bookName: '', totalChapters: '' });
  const [addingBook, setAddingBook] = useState(false);
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [birthdayCalMonth, setBirthdayCalMonth] = useState(new Date().getMonth() + 1);
  const [birthdayCalData, setBirthdayCalData] = useState([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(false);

  // Accountant: manage others' payments
  const [accDevotees, setAccDevotees] = useState([]);
  const [accSearch, setAccSearch] = useState('');
  const [accSelectedProfile, setAccSelectedProfile] = useState(null);
  const [accPayments, setAccPayments] = useState([]);
  const [accPaySummary, setAccPaySummary] = useState(null);
  const [accPayYear, setAccPayYear] = useState(new Date().getFullYear());
  const [accLoading, setAccLoading] = useState(false);
  const [rentOverview, setRentOverview] = useState(null);
  const [rentOverviewYear, setRentOverviewYear] = useState(new Date().getFullYear());
  const [rentOverviewMonth, setRentOverviewMonth] = useState(new Date().getMonth() + 1);

  const tabs = [
    { name: 'Basic Info', icon: User },
    { name: 'Personal', icon: Briefcase },
    { name: 'Communication', icon: ClipboardList },
    { name: 'Addresses', icon: MapPin },
    { name: 'Family', icon: Users },
    { name: 'Education', icon: GraduationCap },
    { name: 'Devotional', icon: Heart },
    { name: 'Payments', icon: IndianRupee },
    { name: 'Leave', icon: Plane },
    { name: 'Membership Info', icon: Award },
    { name: 'Book Reading', icon: BookOpen },
    { name: 'Book Test Marks', icon: Award },
    { name: 'Birthday Calendar', icon: Cake },
    ...(isAccountant || isAdmin ? [{ name: 'Manage Payments', icon: IndianRupee }] : [])
  ];

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      let prof, user;
      
      if (editProfileId && isAdmin) {
        // Admin editing another devotee's profile
        const res = await fetch(apiUrl(`/api/devotees/${editProfileId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        prof = json.data || {};
        user = prof.user || {};
      } else {
        // Normal: load own profile
        const res = await fetch(apiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        user = json.data?.user || {};
        prof = json.data?.profile || {};
      }
      if (!prof.id) {
        throw new Error('Profile not found. Please contact the administrator.');
      }
      setProfileData({ ...prof, user });

      // Update localStorage with fresh user data (includes additionalRoles)
      if (user && !editProfileId) {
        const storedUser = JSON.parse(localStorage.getItem('bace_user') || '{}');
        const updatedUser = { ...storedUser, additionalRoles: user.additionalRoles || [] };
        localStorage.setItem('bace_user', JSON.stringify(updatedUser));
        setIsAccountant((user.additionalRoles || []).includes('Accountant'));
      }

      // Populate forms
      setBasicForm({
        name: user.name || '',
        mobile: user.mobile || '',
        spiritualName: prof.spiritualName || '',
        gender: prof.gender || 'male',
        dob: prof.dob || '',
        bloodGroup: prof.bloodGroup || '',
        center: prof.center || '',
        harinamInitiated: prof.harinamInitiated || false,
        initiatedName: prof.initiatedName || '',
        spiritualMaster: prof.spiritualMaster || '',
        initiatedDatePlace: prof.initiatedDatePlace || '',
        initiationCeremony: prof.initiationCeremony || '',
        brahminInitiated: prof.brahminInitiated || false,
        whatsappNumber: prof.whatsappNumber || '',
        panNumber: prof.panNumber || '',
        aadharNumber: prof.aadharNumber || '',
        photographUrl: prof.photographUrl || '',
        firstLanguage: prof.firstLanguage || '',
        languagesKnown: prof.languagesKnown || '',
        citizenOf: prof.citizenOf || '',
        nativeCountry: prof.nativeCountry || '',
        nativeState: prof.nativeState || '',
        nativeCity: prof.nativeCity || '',
        caste: prof.caste || ''
      });

      setPersonalForm({
        occupation: prof.skills?.occupation || '',
        companyOrg: prof.skills?.companyOrg || '',
        skills: prof.skills?.skills || '',
        interests: prof.skills?.interests || '',
        hobbies: prof.skills?.hobbies || ''
      });

      setFamilyForm({
        fatherName: prof.family?.fatherName || '',
        motherName: prof.family?.motherName || '',
        fatherContact: prof.family?.fatherContact || '',
        motherContact: prof.family?.motherContact || '',
        emergencyContact: prof.family?.emergencyContact || ''
      });

      setDevotionalForm({
        dateJoined: prof.devotionalInfo?.dateJoined ? prof.devotionalInfo.dateJoined.split('T')[0] : '',
        introducedBy: prof.devotionalInfo?.introducedBy || '',
        introducedWhen: prof.devotionalInfo?.introducedWhen || '',
        firstConnectedCenter: prof.devotionalInfo?.firstConnectedCenter || '',
        spiritualGuide: prof.devotionalInfo?.spiritualGuide || '',
        programDetails: prof.devotionalInfo?.programDetails || ''
      });

      setCurrentAddress(resolveAddress(prof.addresses, 'Current', 'Present'));
      setNativeAddress(resolveAddress(prof.addresses, 'Native', 'Permanent'));
      setEducationList(prof.educationRecords || []);
      setChantingList(prof.chantingTimeline || []);
      setCoursesList(prof.devotionalCourses || []);
      setBooksList(prof.bookProgress || []);

      // Fetch payments
      try {
        const payRes = await fetch(apiUrl(`/api/devotees/${prof.id}/payments`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payJson = await payRes.json();
        if (payJson.status === 'success') {
          setPaymentsList(payJson.data.payments || []);
          setPaymentSummary(payJson.data.summary || null);
        }
      } catch { setPaymentsList([]); setPaymentSummary(null); }

      // Fetch leave history
      try {
        const leaveRes = await fetch(apiUrl(`/api/devotees/${prof.id}/leave`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const leaveJson = await leaveRes.json();
        if (leaveJson.status === 'success') {
          setLeaveHistory(leaveJson.data || []);
        }
      } catch { setLeaveHistory([]); }

      // Fetch per-section lock status
      if (prof.lockedSections && prof.lockedSections.length > 0) {
        try {
          const lockRes = await fetch(apiUrl(`/api/devotees/${prof.id}/edit-request-status`), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const lockJson = await lockRes.json();
          setLockedSections(lockJson.lockedSections || []);
          setPendingSections((lockJson.pendingRequests || []).map(r => r.section));
        } catch {
          setLockedSections(prof.lockedSections || []);
          setPendingSections([]);
        }
      } else {
        setLockedSections([]);
        setPendingSections([]);
      }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

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
    if (!token || activeTab !== 'Birthday Calendar') return;
    setLoadingBirthdays(true);
    fetch(apiUrl(`/api/devotees/birthdays/month?month=${birthdayCalMonth}`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => { if (json.status === 'success') setBirthdayCalData(json.data || []); })
      .catch(() => {})
      .finally(() => setLoadingBirthdays(false));
  }, [token, birthdayCalMonth, activeTab]);

  // Accountant or Admin: fetch devotee list when tab is opened
  useEffect(() => {
    if (!token || (!isAccountant && !isAdmin) || activeTab !== 'Manage Payments') return;
    if (accDevotees.length > 0) return; // already fetched
    fetch(apiUrl('/api/devotees'), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(json => { if (json.status === 'success') setAccDevotees(json.data || []); })
      .catch(() => {});
  }, [token, activeTab, isAccountant, isAdmin]);

  // Fetch rent (Laxmi) overview when Manage Payments tab is opened or selection changes
  useEffect(() => {
    if (!token || (!isAccountant && !isAdmin) || activeTab !== 'Manage Payments') return;
    fetch(apiUrl(`/api/devotees/rent/overview?year=${rentOverviewYear}&month=${rentOverviewMonth}`), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(json => { if (json.status === 'success') setRentOverview(json.data); })
      .catch(() => {});
  }, [token, activeTab, isAccountant, isAdmin, rentOverviewYear, rentOverviewMonth]);

  // Accountant: fetch selected devotee's payments
  const fetchAccPayments = async (profId) => {
    setAccLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profId}/payments`), { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.status === 'success') {
        setAccPayments(json.data.payments || []);
        setAccPaySummary(json.data.summary || null);
      }
    } catch { setAccPayments([]); setAccPaySummary(null); }
    finally { setAccLoading(false); }
  };

  const accTogglePayment = async (year, month, currentStatus) => {
    if (!accSelectedProfile) return;
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    let amount = null;
    if (newStatus === 'Paid') {
      const fee = accPaySummary?.monthlyFee || '';
      const input = prompt(`Enter paid amount (₹):`, fee);
      if (input === null) return;
      amount = parseFloat(input) || null;
    }
    const remarks = prompt('Remark (optional):', '') || null;
    try {
      await fetch(apiUrl(`/api/devotees/${accSelectedProfile.id}/payments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ year, month, status: newStatus, amount, remarks })
      });
      fetchAccPayments(accSelectedProfile.id);
    } catch (err) { console.error(err); }
  };

  // Calculate Profile Completion
  const calculateCompletion = () => {
    if (!profileData) return 0;
    const fields = [
      profileData.spiritualName, profileData.dob, profileData.gender,
      profileData.bloodGroup, profileData.center,
      profileData.whatsappNumber, profileData.panNumber, profileData.aadharNumber,
      personalForm.occupation, personalForm.skills,
      familyForm.fatherName, familyForm.motherName,
      familyForm.fatherContact, familyForm.motherContact,
      devotionalForm.dateJoined, devotionalForm.spiritualGuide
    ];
    const filled = fields.filter(f => f && f !== '').length;
    const basePercent = Math.round((filled / fields.length) * 100);
    let bonus = 0;
    if (currentAddress.houseStreetPO) bonus += 8;
    if (nativeAddress.houseStreetPO) bonus += 7;
    if (educationList.length > 0) bonus += 15;
    if (coursesList.length > 0) bonus += 10;
    return Math.min(100, basePercent + bonus);
  };

  const handleProfileSave = async () => {
    setMessage('');
    setError('');
    if (!profileData?.id) {
      setError('Profile not found. Please refresh the page or contact the administrator.');
      return;
    }

    // Only send the data for the active tab
    const payload = {};
    switch (activeTab) {
      case 'Basic Info':
        payload.basicInfo = basicForm;
        break;
      case 'Personal':
        payload.personalInfo = personalForm;
        break;
      case 'Communication':
        payload.communicationInfo = { mobile: basicForm.mobile, whatsappNumber: basicForm.whatsappNumber };
        break;
      case 'Addresses':
        payload.addressInfo = [currentAddress, nativeAddress].filter(a => a.houseStreetPO);
        break;
      case 'Family':
        payload.familyInfo = familyForm;
        break;
      case 'Education':
        break;
      case 'Devotional':
        payload.devotionalInfo = devotionalForm;
        break;
      case 'Membership Info':
        break;
      default:
        payload.basicInfo = basicForm;
    }

    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileData.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setMessage('Profile details saved successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRequestEdit = async (section) => {
    try {
      setRequestingEdit(true);
      const res = await fetch(apiUrl(`/api/devotees/${profileData.id}/request-edit`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ section, reason: `Requesting permission to edit ${section}` })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setMessage('Edit request submitted! Please wait for admin approval.');
      setPendingSections(prev => [...prev, section]);
    } catch (e) {
      setError(e.message);
    } finally {
      setRequestingEdit(false);
    }
  };

  // Profile photograph upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!profileData?.id) {
      setError('Profile not found. Please refresh the page and try again.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    setError('');
    setMessage('');
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(apiUrl(`/api/devotees/${profileData.id}/photo`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Photo upload failed');

      setBasicForm(prev => ({ ...prev, photographUrl: json.data.photographUrl }));
      setMessage('Profile photo uploaded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Add education record
  const [addingEdu, setAddingEdu] = useState(false);
  const handleAddEducation = async (e) => {
    e.preventDefault();
    if (addingEdu) return;
    setAddingEdu(true);
    try {
      const payload = {
        ...newEdu,
        passingYear: newEdu.passingYear ? parseInt(newEdu.passingYear, 10) : null
      };
      const res = await fetch(apiUrl(`/api/devotees/${profileData.id}/education`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewEdu({ qualification: '', school: '', college: '', degree: '', passingYear: '' });
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingEdu(false);
    }
  };

  // Delete education record
  const handleDeleteEducation = async (id) => {
    try {
      await fetch(apiUrl(`/api/devotees/${profileData.id}/education/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Chanting Record
  const [addingChanting, setAddingChanting] = useState(false);
  const handleAddChanting = async (e) => {
    e.preventDefault();
    if (addingChanting) return;
    setAddingChanting(true);
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileData.id}/chanting`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newChanting)
      });
      setNewChanting({ rounds: 16, startDate: '' });
      if (res.ok) fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingChanting(false);
    }
  };

  // Add Devotional Course
  const [addingCourse, setAddingCourse] = useState(false);
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (addingCourse) return;
    setAddingCourse(true);
    try {
      const payload = {
        ...newCourse,
        completionYear: newCourse.completionYear ? parseInt(newCourse.completionYear, 10) : null
      };
      const res = await fetch(apiUrl(`/api/devotees/${profileData.id}/courses`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewCourse({ courseName: '', completionYear: '', status: 'Completed' });
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCourse(false);
    }
  };

  // Log book progress
  const handleUpdateBook = async (bookId, chapters, total, notes, remarks) => {
    if (chapters > total) return;
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileData.id}/books/${bookId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ completedChapters: chapters, notes, remarks })
      });
      if (res.ok) {
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBook.bookName.trim() || !newBook.totalChapters) return;
    setAddingBook(true);
    try {
      const res = await fetch(apiUrl(`/api/devotees/${profileData.id}/books`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookName: newBook.bookName.trim(), totalChapters: parseInt(newBook.totalChapters) })
      });
      if (res.ok) {
        setNewBook({ bookName: '', totalChapters: '' });
        fetchProfile();
      }
    } catch (err) { console.error(err); }
    finally { setAddingBook(false); }
  };

  const handleDeleteBook = async (bookId) => {
    if (!confirm('Remove this book from your reading list?')) return;
    try {
      await fetch(apiUrl(`/api/devotees/${profileData.id}/books/${bookId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfile();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-orange-50/10 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Activity className="h-10 w-10 animate-spin text-saffron-600" />
          <span className="text-sm font-semibold">Loading your Devotee Profile...</span>
        </div>
      </div>
    );
  }

  const completionPercent = calculateCompletion();

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
                <img src={getPhotoUrl(b.photographUrl)} alt={b.name} className="h-9 w-9 rounded-full object-cover border border-pink-200" />
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
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-saffron-500 shadow-sm shrink-0 bg-orange-100">
            <img 
              src={getPhotoUrl(basicForm.photographUrl)} 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {basicForm.spiritualName || basicForm.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Devotee ID: <span className="text-saffron-700 dark:text-saffron-400">{profileData?.devoteeId}</span>
            </p>
            {(profileData?.serviceRoles || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {profileData.serviceRoles.map(r => (
                  <span key={r} className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">{r}</span>
                ))}
              </div>
            )}
            {(profileData?.memberGroups || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {profileData.memberGroups.map(g => (
                  <span key={g} className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Completion Circular Percentage Indicator */}
        <div className="flex items-center gap-4 bg-orange-50/40 dark:bg-slate-800/40 py-2.5 px-4 rounded-2xl border border-orange-100/30 dark:border-slate-800/50">
          <div className="relative h-12 w-12 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="absolute transform -rotate-90 w-12 h-12">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-800" fill="transparent" />
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" className="text-saffron-600 dark:text-saffron-500" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * completionPercent) / 100} fill="transparent" />
            </svg>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">{completionPercent}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Profile Completeness</span>
            <span className="text-[10px] text-slate-400">Fill missing tabs to reach 100%</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/50 text-sm font-semibold flex items-center gap-2">
          <Check className="h-5 w-5" />
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/50 text-sm font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><X className="h-5 w-5" />{error}</span>
          <button onClick={() => setError('')} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Navigation / Right Form Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Tabs navigation list */}
        <div className="flex flex-col gap-1 md:col-span-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => {
                  setActiveTab(tab.name);
                  setIsEditing(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${activeTab === tab.name ? 'bg-gradient-to-r from-saffron-600 to-gold-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-900/50'}`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="md:col-span-3 p-6 md:p-8 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-orange-100/20 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeTab}</h2>
            
            {activeTab !== 'Payments' && activeTab !== 'Book Reading' && activeTab !== 'Manage Payments' && activeTab !== 'Birthday Calendar' && (() => {
              const tabToSection = {
                'Basic Info': 'basicInfo',
                'Personal': 'personalInfo',
                'Communication': 'communicationInfo',
                'Addresses': 'addressInfo',
                'Family': 'familyInfo',
                'Education': 'educationInfo',
                'Devotional': 'devotionalInfo',
                'Membership Info': 'membershipInfo'
              };
              const currentSection = tabToSection[activeTab];
              const isLocked = currentSection && lockedSections.includes(currentSection) && profileData?.user?.role?.toLowerCase() !== 'admin';
              const isPending = currentSection && pendingSections.includes(currentSection);

              if (isLocked) {
                if (isPending) {
                  return (
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100/60 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      Edit Request Pending
                    </span>
                  );
                }
                return (
                  <button
                    onClick={() => handleRequestEdit(currentSection)}
                    disabled={requestingEdit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-100/60 hover:bg-saffron-700 hover:text-white dark:bg-slate-800 dark:hover:bg-saffron-700 text-saffron-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {requestingEdit ? 'Requesting...' : 'Request Edit Permission'}
                  </button>
                );
              }

              return (
                <button
                  onClick={() => {
                    if (isEditing) handleProfileSave();
                    else setIsEditing(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-100/60 hover:bg-saffron-700 hover:text-white dark:bg-slate-800 dark:hover:bg-saffron-700 text-saffron-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm"
                >
                  {isEditing ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Mode
                    </>
                  )}
                </button>
              );
            })()}
          </div>

          {/* TAB CONTENT PANELS */}
          {activeTab === 'Basic Info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-6 pb-4 border-b border-orange-100/10 dark:border-slate-800">
                <div className="h-28 w-28 rounded-2xl overflow-hidden border-2 border-orange-200 bg-orange-100 shrink-0 relative group">
                  <img src={getPhotoUrl(basicForm.photographUrl)} className="h-full w-full object-cover" />
                  {isEditing && (
                    <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-[10px] font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingPhoto ? 'Uploading...' : 'Upload'}
                      <input type="file" onChange={handlePhotoUpload} accept="image/*" disabled={uploadingPhoto} className="hidden" />
                    </label>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-bold text-slate-400">Devotee ID: {profileData?.devoteeId}</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500">Legal Name</label>
                      <input disabled={!isEditing} value={basicForm.name || ''} onChange={e => setBasicForm({ ...basicForm, name: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 disabled:opacity-75" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500">Spiritual Name</label>
                      <input disabled={!isEditing} value={basicForm.spiritualName || ''} onChange={e => setBasicForm({ ...basicForm, spiritualName: e.target.value })} placeholder="e.g. Yuvaraja Krsna Dasa" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 disabled:opacity-75" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Date of Birth</label>
                <input type="date" disabled={!isEditing} value={basicForm.dob || ''} onChange={e => setBasicForm({ ...basicForm, dob: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Gender</label>
                <select disabled={!isEditing} value={basicForm.gender || 'male'} onChange={e => setBasicForm({ ...basicForm, gender: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Blood Group</label>
                <input disabled={!isEditing} value={basicForm.bloodGroup || ''} onChange={e => setBasicForm({ ...basicForm, bloodGroup: e.target.value })} placeholder="e.g. O+ve" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Aadhar Card Number</label>
                <input disabled={!isEditing} value={basicForm.aadharNumber || ''} onChange={e => setBasicForm({ ...basicForm, aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="12-digit Aadhar number" maxLength={12} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="md:col-span-2 border-t border-orange-100/10 dark:border-slate-800 pt-4 flex flex-col gap-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-saffron-700 dark:text-saffron-400">Initiation details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" id="harinamInitiated" disabled={!isEditing} checked={basicForm.harinamInitiated || false} onChange={e => setBasicForm({ ...basicForm, harinamInitiated: e.target.checked })} className="rounded text-saffron-600 focus:ring-saffron-500" />
                    <label htmlFor="harinamInitiated" className="text-xs font-bold text-slate-500">Is Harinam Initiated?</label>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Initiated Name</label>
                    <input disabled={!isEditing || !basicForm.harinamInitiated} value={basicForm.initiatedName || ''} onChange={e => setBasicForm({ ...basicForm, initiatedName: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Spiritual Master (Guru)</label>
                    <input disabled={!isEditing || !basicForm.harinamInitiated} value={basicForm.spiritualMaster || ''} onChange={e => setBasicForm({ ...basicForm, spiritualMaster: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Initiation Date & Place</label>
                    <input disabled={!isEditing || !basicForm.harinamInitiated} value={basicForm.initiatedDatePlace || ''} onChange={e => setBasicForm({ ...basicForm, initiatedDatePlace: e.target.value })} placeholder="e.g. 14-Mar-2026 / GEV" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" id="brahminInitiated" disabled={!isEditing} checked={basicForm.brahminInitiated || false} onChange={e => setBasicForm({ ...basicForm, brahminInitiated: e.target.checked })} className="rounded text-saffron-600 focus:ring-saffron-500" />
                    <label htmlFor="brahminInitiated" className="text-xs font-bold text-slate-500">Is Brahmin (2nd) Initiated?</label>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">National Identifier (PAN Number)</label>
                    <input disabled={!isEditing} value={basicForm.panNumber || ''} onChange={e => setBasicForm({ ...basicForm, panNumber: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 border-t border-orange-100/10 dark:border-slate-800 pt-4 flex flex-col gap-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-saffron-700 dark:text-saffron-400">Personal Background</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">First Language</label>
                    <input disabled={!isEditing} value={basicForm.firstLanguage || ''} onChange={e => setBasicForm({ ...basicForm, firstLanguage: e.target.value })} placeholder="e.g. Marathi" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Languages Known</label>
                    <input disabled={!isEditing} value={basicForm.languagesKnown || ''} onChange={e => setBasicForm({ ...basicForm, languagesKnown: e.target.value })} placeholder="e.g. Hindi, English, Marathi" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Citizen Of</label>
                    <input disabled={!isEditing} value={basicForm.citizenOf || ''} onChange={e => setBasicForm({ ...basicForm, citizenOf: e.target.value })} placeholder="e.g. India" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Native Country</label>
                    <input disabled={!isEditing} value={basicForm.nativeCountry || ''} onChange={e => setBasicForm({ ...basicForm, nativeCountry: e.target.value })} placeholder="e.g. India" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Native State</label>
                    <input disabled={!isEditing} value={basicForm.nativeState || ''} onChange={e => setBasicForm({ ...basicForm, nativeState: e.target.value })} placeholder="e.g. Maharashtra" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Native City</label>
                    <input disabled={!isEditing} value={basicForm.nativeCity || ''} onChange={e => setBasicForm({ ...basicForm, nativeCity: e.target.value })} placeholder="e.g. Pune" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Caste</label>
                    <input disabled={!isEditing} value={basicForm.caste || ''} onChange={e => setBasicForm({ ...basicForm, caste: e.target.value })} placeholder="e.g. Brahmin" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Occupation</label>
                <input disabled={!isEditing} value={personalForm.occupation || ''} onChange={e => setPersonalForm({ ...personalForm, occupation: e.target.value })} placeholder="e.g. Software Engineer" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Company / Organization</label>
                <input disabled={!isEditing} value={personalForm.companyOrg || ''} onChange={e => setPersonalForm({ ...personalForm, companyOrg: e.target.value })} placeholder="e.g. Google" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500">Professional Skills</label>
                <textarea disabled={!isEditing} value={personalForm.skills || ''} onChange={e => setPersonalForm({ ...personalForm, skills: e.target.value })} placeholder="e.g. Web Development, Project Management, Public Speaking" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 h-20" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Devotional Interests</label>
                <input disabled={!isEditing} value={personalForm.interests || ''} onChange={e => setPersonalForm({ ...personalForm, interests: e.target.value })} placeholder="e.g. Book Distribution, Deity Worship, Kirtan" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Personal Hobbies</label>
                <input disabled={!isEditing} value={personalForm.hobbies || ''} onChange={e => setPersonalForm({ ...personalForm, hobbies: e.target.value })} placeholder="e.g. Reading, Gardening" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>
            </div>
          )}

          {activeTab === 'Communication' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Mobile Number</label>
                <input disabled={!isEditing} value={basicForm.mobile || ''} onChange={e => setBasicForm({ ...basicForm, mobile: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">WhatsApp Number</label>
                <input disabled={!isEditing} value={basicForm.whatsappNumber || ''} onChange={e => setBasicForm({ ...basicForm, whatsappNumber: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500">Email Address (Registered)</label>
                <input disabled={true} value={profileData?.user?.email || ''} className="p-2 border rounded-lg bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 opacity-75" />
              </div>
            </div>
          )}

          {activeTab === 'Addresses' && (
            <div className="flex flex-col gap-8 text-sm">
              {[
                { title: 'Current Address', address: currentAddress, setAddress: setCurrentAddress },
                { title: 'Native Address', address: nativeAddress, setAddress: setNativeAddress }
              ].map(({ title, address, setAddress }) => (
                <div key={title} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-orange-50/20 dark:bg-slate-900/20 flex flex-col gap-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-saffron-700 dark:text-saffron-400">{title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500">House / Street / PO</label>
                      <input disabled={!isEditing} value={address.houseStreetPO || ''} onChange={e => setAddress({ ...address, houseStreetPO: e.target.value })} placeholder="House no., street, area" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500">City / District</label>
                      <input disabled={!isEditing} value={address.cityDistrict || ''} onChange={e => setAddress({ ...address, cityDistrict: e.target.value })} placeholder="City or district" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500">State / Province</label>
                      <input disabled={!isEditing} value={address.stateProvince || ''} onChange={e => setAddress({ ...address, stateProvince: e.target.value })} placeholder="State" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500">Country</label>
                      <input disabled={!isEditing} value={address.country || 'India'} onChange={e => setAddress({ ...address, country: e.target.value })} placeholder="Country" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500">Pincode / Zip</label>
                      <input disabled={!isEditing} value={address.pinZip || ''} onChange={e => setAddress({ ...address, pinZip: e.target.value })} placeholder="Pincode" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Family' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Father's Name</label>
                <input disabled={!isEditing} value={familyForm.fatherName || ''} onChange={e => setFamilyForm({ ...familyForm, fatherName: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Mother's Name</label>
                <input disabled={!isEditing} value={familyForm.motherName || ''} onChange={e => setFamilyForm({ ...familyForm, motherName: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Father's Contact Number</label>
                <input disabled={!isEditing} value={familyForm.fatherContact || ''} onChange={e => setFamilyForm({ ...familyForm, fatherContact: e.target.value })} placeholder="+91 XXXXX XXXXX" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Mother's Contact Number</label>
                <input disabled={!isEditing} value={familyForm.motherContact || ''} onChange={e => setFamilyForm({ ...familyForm, motherContact: e.target.value })} placeholder="+91 XXXXX XXXXX" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500">Emergency Contact (Name & Number)</label>
                <input disabled={!isEditing} value={familyForm.emergencyContact || ''} onChange={e => setFamilyForm({ ...familyForm, emergencyContact: e.target.value })} placeholder="e.g. Ramesh Kaple - +91 XXXXX XXXXX" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
              </div>
            </div>
          )}

          {activeTab === 'Education' && (
            <div className="flex flex-col gap-6 text-sm">
              <div className="flex flex-col gap-4">
                {educationList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No academic records added yet.</p>
                ) : (
                  educationList.map(edu => (
                    <div key={edu.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center bg-orange-50/10 dark:bg-slate-900/10">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold">{edu.degree} ({edu.qualification})</span>
                        <span className="text-xs text-slate-500">{edu.college || edu.school} - {edu.passingYear || ''}</span>
                      </div>
                      {isEditing && (
                        <button onClick={() => handleDeleteEducation(edu.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {isEditing && (
                <form onSubmit={handleAddEducation} className="p-4 border border-dashed border-orange-200 dark:border-slate-800 rounded-2xl flex flex-col gap-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Add New Academic Record</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required value={newEdu.qualification} onChange={e => setNewEdu({ ...newEdu, qualification: e.target.value })} placeholder="Qualification (e.g. BE, HSC)" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    <input required value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Degree / Specialization" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    <input value={newEdu.college} onChange={e => setNewEdu({ ...newEdu, college: e.target.value })} placeholder="College / University" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    <input value={newEdu.passingYear} onChange={e => setNewEdu({ ...newEdu, passingYear: e.target.value })} placeholder="Year of Passing (YYYY)" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                    <button type="submit" disabled={addingEdu} className="md:col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-saffron-600 text-white font-bold text-xs disabled:opacity-50">
                      <Plus className="h-4 w-4" /> {addingEdu ? 'Saving...' : 'Save Academic Record'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'Devotional' && (
            <div className="flex flex-col gap-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Date Joined ISKCON/BACE</label>
                  <input type="date" disabled={!isEditing} value={devotionalForm.dateJoined || ''} onChange={e => setDevotionalForm({ ...devotionalForm, dateJoined: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Spiritual Counselor / Guide</label>
                  <input disabled={!isEditing} value={devotionalForm.spiritualGuide || ''} onChange={e => setDevotionalForm({ ...devotionalForm, spiritualGuide: e.target.value })} placeholder="e.g. Vedanta Caitanya Dasa" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">First Connected Center</label>
                  <input disabled={!isEditing} value={devotionalForm.firstConnectedCenter || ''} onChange={e => setDevotionalForm({ ...devotionalForm, firstConnectedCenter: e.target.value })} placeholder="e.g. Nigdi" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Introduced By</label>
                  <input disabled={!isEditing} value={devotionalForm.introducedBy || ''} onChange={e => setDevotionalForm({ ...devotionalForm, introducedBy: e.target.value })} placeholder="e.g. HG Vedant chaitanya prabhuji" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800" />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500">Associated Programs / Services Performing</label>
                  <textarea disabled={!isEditing} value={devotionalForm.programDetails || ''} onChange={e => setDevotionalForm({ ...devotionalForm, programDetails: e.target.value })} placeholder="e.g. Youth preaching, temple security services, Sunday feast cooking" className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 h-20" />
                </div>
              </div>

              {/* Chanting timeline grid */}
              <div className="border-t border-orange-100/10 dark:border-slate-800 pt-6">
                <h3 className="font-bold text-xs uppercase tracking-wider text-saffron-700 dark:text-saffron-400 mb-4">Chanting Hare Krishna Mahamantra Timeline</h3>
                <div className="flex flex-col gap-3 mb-4">
                  {chantingList.map(ch => (
                    <div key={ch.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-orange-50/10 dark:bg-slate-900/10 flex justify-between items-center text-xs">
                      <span className="font-bold text-saffron-800 dark:text-saffron-400">{ch.rounds} Rounds Chanting</span>
                      <span className="text-slate-400 font-medium">Chanting from {new Date(ch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <form onSubmit={handleAddChanting} className="p-4 border border-dashed border-orange-200 dark:border-slate-800 rounded-2xl flex gap-4 items-end">
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-500">Rounds</label>
                      <input type="number" required value={newChanting.rounds} onChange={e => setNewChanting({ ...newChanting, rounds: parseInt(e.target.value) })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-500">Start Date</label>
                      <input type="date" required value={newChanting.startDate} onChange={e => setNewChanting({ ...newChanting, startDate: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs" />
                    </div>
                    <button type="submit" disabled={addingChanting} className="p-2.5 rounded-lg bg-saffron-600 text-white font-bold text-xs shrink-0 h-9 disabled:opacity-50">
                      Add Chanting Milestone
                    </button>
                  </form>
                )}
              </div>

              {/* Devotional Courses done */}
              <div className="border-t border-orange-100/10 dark:border-slate-800 pt-6">
                <h3 className="font-bold text-xs uppercase tracking-wider text-saffron-700 dark:text-saffron-400 mb-4">Completed Devotional Courses</h3>
                <div className="flex flex-col gap-3 mb-4">
                  {coursesList.map(cr => (
                    <div key={cr.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-orange-50/10 dark:bg-slate-900/10 flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold">{cr.courseName}</span>
                        <span className="text-[10px] text-slate-400">Completed Year: {cr.completionYear}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-bold text-[9px]">DOCS UPLOADED</span>
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <form onSubmit={handleAddCourse} className="p-4 border border-dashed border-orange-200 dark:border-slate-800 rounded-2xl grid grid-cols-3 gap-4 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500">Course Name</label>
                      <input required placeholder="e.g. IDC" value={newCourse.courseName} onChange={e => setNewCourse({ ...newCourse, courseName: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500">Year</label>
                      <input placeholder="e.g. 2022" value={newCourse.completionYear} onChange={e => setNewCourse({ ...newCourse, completionYear: e.target.value })} className="p-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs" />
                    </div>
                    <button type="submit" disabled={addingCourse} className="p-2.5 rounded-lg bg-saffron-600 text-white font-bold text-xs h-9 disabled:opacity-50">
                      {addingCourse ? 'Adding...' : 'Add Course'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Payments' && (
            <div className="flex flex-col gap-4 text-sm">
              {/* Deposit & Monthly Fee Info */}
              {paymentSummary && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Monthly Fee</span>
                    <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">₹{paymentSummary.monthlyFee || 0}</p>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${
                    paymentSummary.depositPaid
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20'
                      : 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Deposit</span>
                    <p className={`text-lg font-extrabold ${
                      paymentSummary.depositPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {paymentSummary.depositPaid ? `✓ ₹${paymentSummary.depositAmount || 0}` : 'Not Paid'}
                    </p>
                    {paymentSummary.depositRemarks && (
                      <span className="text-[9px] text-slate-400">{paymentSummary.depositRemarks}</span>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400">Monthly rent payment history. Contact admin for any discrepancies.</p>
              {(() => {
                const currentYear = new Date().getFullYear();
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const yearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);
                const year = selectedPaymentYear;

                return (
                  <>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-500">Select Year</label>
                      <select
                        value={selectedPaymentYear}
                        onChange={e => setSelectedPaymentYear(parseInt(e.target.value))}
                        className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-sm font-bold dark:text-white"
                      >
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-orange-50/10 dark:bg-slate-900/10">
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-base mb-4">{year}</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {months.map((monthName, idx) => {
                          const monthNum = idx + 1;
                          const payment = paymentsList.find(p => p.year === year && p.month === monthNum);
                          const isPaid = payment?.status === 'Paid';
                          const isFuture = year === currentYear && monthNum > new Date().getMonth() + 1;
                          const fee = paymentSummary?.monthlyFee || 0;
                          const paidAmt = payment?.amount || 0;

                          return (
                            <div
                              key={monthNum}
                              className={`flex flex-col items-center p-2.5 rounded-xl border text-center ${
                                isFuture
                                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-50'
                                  : isPaid
                                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20'
                                    : 'border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-900/20'
                              }`}
                            >
                              <span className="text-[10px] font-bold text-slate-500">{monthName}</span>
                              <span className={`text-xs font-extrabold mt-0.5 ${
                                isFuture ? 'text-slate-400' : isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isFuture ? '—' : isPaid ? '✓ Paid' : '✗ Unpaid'}
                              </span>
                              {!isFuture && (
                                <>
                                  <span className="text-[9px] text-emerald-500 mt-0.5">₹{paidAmt}</span>
                                  <span className="text-[9px] text-rose-500">Rem: ₹{fee - paidAmt > 0 ? fee - paidAmt : 0}</span>
                                  {payment?.remarks && <span className="text-[8px] text-slate-400 italic truncate w-full">{payment.remarks}</span>}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'Leave' && (
            <div className="flex flex-col gap-4 text-sm">
              <p className="text-xs text-slate-400">Submit a leave form when going home or travelling.</p>
              
              {/* Leave Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  const data = {
                    fromDate: form.fromDate.value,
                    toDate: form.toDate.value,
                    destination: form.destination.value,
                    reason: form.reason.value
                  };
                  if (!data.fromDate || !data.toDate || !data.destination) {
                    alert('Please fill From Date, To Date, and Destination');
                    return;
                  }
                  try {
                    e.target.querySelector('button[type=submit]').disabled = true;
                    const res = await fetch(apiUrl(`/api/devotees/${profileData.id}/leave`), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify(data)
                    });
                    const json = await res.json();
                    if (res.ok) {
                      alert('Leave submitted successfully!');
                      form.reset();
                      fetchProfile();
                    } else {
                      alert(json.message || 'Failed to submit');
                    }
                  } catch { alert('Failed to submit leave request'); }
                  finally { e.target.querySelector('button[type=submit]').disabled = false; }
                }}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-col gap-4"
              >
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Going Home Form</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">From Date</label>
                    <input type="date" name="fromDate" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">To Date</label>
                    <input type="date" name="toDate" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" required />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Destination (Where are you going?)</label>
                  <input type="text" name="destination" placeholder="e.g. Mumbai, Native Place" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Reason (optional)</label>
                  <textarea name="reason" rows="2" placeholder="e.g. Family function, vacation..." className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none" />
                </div>
                <button type="submit" className="self-start px-5 py-2 rounded-xl bg-saffron-600 text-white font-bold text-xs hover:bg-saffron-700 transition-colors">
                  Submit Leave
                </button>
              </form>

              {/* Leave History */}
              {leaveHistory.length > 0 && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-col gap-3">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">Leave History</h4>
                  <div className="flex flex-col gap-2">
                    {leaveHistory.map(leave => (
                      <div key={leave.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-orange-50/10 dark:bg-slate-900/10 flex flex-col gap-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{leave.destination}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                            leave.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>{leave.status}</span>
                        </div>
                        <span className="text-slate-400">
                          {new Date(leave.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} — {new Date(leave.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        {leave.reason && <span className="text-slate-500 italic">{leave.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Membership Info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-orange-50/30 dark:bg-slate-900/30 border border-orange-100/30 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Membership ID</span>
                <span className="font-extrabold text-slate-800 dark:text-white text-lg">{profileData?.memberId || 'N/A'}</span>
              </div>

              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-orange-50/30 dark:bg-slate-900/30 border border-orange-100/30 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Membership Type</span>
                <span className="font-extrabold text-saffron-700 dark:text-saffron-400 text-lg uppercase">{profileData?.memberType}</span>
              </div>

              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-orange-50/30 dark:bg-slate-900/30 border border-orange-100/30 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Membership Start Date</span>
                <span className="font-extrabold text-slate-800 dark:text-white text-base">
                  {profileData?.memberStartDate ? new Date(profileData.memberStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Pending'}
                </span>
              </div>

              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-orange-50/30 dark:bg-slate-900/30 border border-orange-100/30 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Membership Status</span>
                <span className={`font-extrabold text-base uppercase ${profileData?.memberStatus === 'Active' ? 'text-green-600' : 'text-amber-500'}`}>
                  {profileData?.memberStatus}
                </span>
              </div>

              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-orange-50/30 dark:bg-slate-900/30 border border-orange-100/30 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Approved By</span>
                <span className="font-extrabold text-slate-800 dark:text-white text-base">
                  {profileData?.approvedByName || '—'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'Book Reading' && (
            <div className="flex flex-col gap-6 text-sm">
              <p className="text-xs text-slate-400">Log your completed chapters for Srila Prabhupada's translations to update progress bars automatically.</p>

              <div className="flex flex-col gap-6">
                {booksList.map(book => (
                  <div key={book.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-4 bg-orange-50/10 dark:bg-slate-900/10 shadow-sm">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-base">{book.bookName}</h4>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Status: <span className={book.status === 'Read' ? 'text-green-600' : 'text-saffron-700'}>{book.status}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-saffron-700 dark:text-saffron-400">{book.readingPercentage}%</span>
                          <p className="text-[10px] text-slate-400">{book.completedChapters} of {book.totalChapters} chapters</p>
                        </div>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Remove book"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-saffron-600 to-gold-500 rounded-full" style={{ width: `${book.readingPercentage}%` }} />
                    </div>

                    {/* Chapter updates & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Chapters</label>
                        <input
                          type="number"
                          max={book.totalChapters}
                          min={0}
                          defaultValue={book.completedChapters}
                          onBlur={(e) => handleUpdateBook(book.id, parseInt(e.target.value), book.totalChapters, book.notes, book.remarks)}
                          className="p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs w-24 text-center font-bold"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reading Notes / Remarks</label>
                        <input
                          placeholder="Write reading notes here..."
                          defaultValue={book.notes || ''}
                          onBlur={(e) => handleUpdateBook(book.id, book.completedChapters, book.totalChapters, e.target.value, book.remarks)}
                          className="p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new book */}
                <form onSubmit={handleAddBook} className="p-5 border-2 border-dashed border-orange-200 dark:border-slate-700 rounded-2xl flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-40">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Book Name</label>
                    <input
                      placeholder="e.g. Bhagavad Gita"
                      value={newBook.bookName}
                      onChange={(e) => setNewBook(b => ({ ...b, bookName: e.target.value }))}
                      className="p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-700 text-xs w-full dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Chapters</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="18"
                      value={newBook.totalChapters}
                      onChange={(e) => setNewBook(b => ({ ...b, totalChapters: e.target.value }))}
                      className="p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-700 text-xs w-24 text-center dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingBook || !newBook.bookName.trim() || !newBook.totalChapters}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300 text-xs font-bold hover:bg-saffron-200 transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Book
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'Book Test Marks' && (
            <div className="flex flex-col gap-4 text-sm">
              <p className="text-xs text-slate-400">Your book test scores recorded by the administrator.</p>
              {!profileData?.bookTestScores || profileData.bookTestScores.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs">
                  No book test scores have been recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-orange-50/40 dark:bg-slate-900/40">
                        <th className="text-left py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Book Name</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Total Marks</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Marks Obtained</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Percentage</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileData.bookTestScores.map(score => {
                        const pct = score.totalMarks > 0 ? Math.round((score.marksObtained / score.totalMarks) * 100) : 0;
                        const threshold = score.passingMarks ?? Math.ceil((score.totalMarks || 100) * 0.5);
                        const passed = score.marksObtained >= threshold;
                        return (
                          <tr key={score.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-orange-50/10 dark:hover:bg-slate-900/10">
                            <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{score.bookName || '—'}</td>
                            <td className="py-3 px-4 text-center text-slate-500">{score.totalMarks ?? '—'}</td>
                            <td className="py-3 px-4 text-center font-bold text-saffron-700 dark:text-saffron-400">{score.marksObtained}</td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{pct}%</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${passed ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                {passed ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Birthday Calendar' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Birthdays of fellow devotees this month</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {birthdayCalData.map(b => (
                    <div key={b.devoteeId} className="flex items-center gap-3 p-3 rounded-xl border border-pink-100/50 dark:border-pink-900/30 bg-pink-50/30 dark:bg-pink-950/10">
                      <img
                        src={b.photographUrl && b.photographUrl.startsWith('http') ? b.photographUrl : getPhotoUrl(b.photographUrl)}
                        alt={b.name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-pink-200 dark:border-pink-800"
                        onError={e => { e.target.src = DEFAULT_AVATAR; }}
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

          {/* Manage Payments (Accountant only) */}
          {activeTab === 'Manage Payments' && (isAccountant || isAdmin) && (
            <div className="flex flex-col gap-5">
              <p className="text-xs text-slate-400">Search for a devotee and manage their monthly payment records.</p>

              {/* Rent (Laxmi) overview */}
              {rentOverview && (() => {
                const selected = rentOverview.monthly.find(m => m.year === rentOverviewYear && m.month === rentOverviewMonth);
                const collected = selected?.totalCollected || 0;
                const paidCount = selected?.paidCount || 0;
                const monthLabel = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][rentOverviewMonth - 1];
                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-end gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Year</label>
                        <select value={rentOverviewYear} onChange={e => setRentOverviewYear(parseInt(e.target.value))} className="p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs font-bold dark:text-white">
                          {Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Month</label>
                        <select value={rentOverviewMonth} onChange={e => setRentOverviewMonth(parseInt(e.target.value))} className="p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs font-bold dark:text-white">
                          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name, idx) => <option key={idx} value={idx + 1}>{name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20">
                        <span className="text-[9px] font-bold uppercase text-slate-500">Total Rent Due — {monthLabel} {rentOverviewYear}</span>
                        <p className="text-lg font-extrabold text-blue-600">₹{rentOverview.selectedExpected.toLocaleString('en-IN')}</p>
                        <span className="text-[9px] text-slate-400">Sum of individual rent amounts across {rentOverview.selectedDevoteeCount} devotee(s)</span>
                      </div>
                      <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20">
                        <span className="text-[9px] font-bold uppercase text-slate-500">Actually Paid — {monthLabel} {rentOverviewYear}</span>
                        <p className="text-lg font-extrabold text-emerald-600">₹{collected.toLocaleString('en-IN')}</p>
                        <span className="text-[9px] text-slate-400">{paidCount} / {rentOverview.selectedDevoteeCount} devotees paid</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Search */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accSearch}
                  onChange={e => setAccSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="flex-1 p-2.5 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 dark:text-white"
                />
              </div>

              {/* Devotee list (filtered) */}
              {!accSelectedProfile && (
                <div className="flex flex-col gap-1 max-h-[28rem] overflow-y-auto">
                  {accDevotees
                    .filter(d => (d.user?.name || '').toLowerCase().includes(accSearch.toLowerCase()))
                    .sort((a, b) => (parseInt((a.devoteeId || '').replace('BACE-', ''), 10) || 0) - (parseInt((b.devoteeId || '').replace('BACE-', ''), 10) || 0))
                    .map(d => (
                      <button
                        key={d.id}
                        onClick={() => { setAccSelectedProfile(d); fetchAccPayments(d.id); }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-800 text-left transition-colors border border-transparent hover:border-saffron-200 dark:hover:border-slate-700"
                      >
                        <img src={getPhotoUrl(d.photographUrl)} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 dark:text-white">{d.user?.name}</span>
                          <span className="text-[10px] text-slate-400">{d.devoteeId}</span>
                        </div>
                      </button>
                    ))}
                  {accDevotees.length === 0 && <p className="text-xs text-slate-400 italic py-4 text-center">Loading devotees...</p>}
                </div>
              )}

              {/* Selected devotee payment management */}
              {accSelectedProfile && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-saffron-50/50 dark:bg-saffron-950/20 border border-saffron-100 dark:border-saffron-900/30">
                    <div className="flex items-center gap-3">
                      <img src={getPhotoUrl(accSelectedProfile.photographUrl)} alt="" className="h-10 w-10 rounded-full object-cover border border-saffron-200" />
                      <div>
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{accSelectedProfile.user?.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{accSelectedProfile.devoteeId}</span>
                      </div>
                    </div>
                    <button onClick={() => { setAccSelectedProfile(null); setAccPayments([]); setAccPaySummary(null); }} className="text-[10px] font-bold text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                      ✕ Close
                    </button>
                  </div>

                  {/* Fee controls */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        const fee = prompt('Set monthly fee (₹):', accPaySummary?.monthlyFee || '');
                        if (fee === null) return;
                        await fetch(apiUrl(`/api/devotees/${accSelectedProfile.id}/monthly-fee`), {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ monthlyFee: fee })
                        });
                        fetchAccPayments(accSelectedProfile.id);
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                    >
                      Set Monthly Fee {accPaySummary?.monthlyFee ? `(₹${accPaySummary.monthlyFee})` : ''}
                    </button>
                    <button
                      onClick={async () => {
                        const amt = prompt('Deposit amount (₹):', accPaySummary?.depositAmount || '');
                        if (amt === null) return;
                        await fetch(apiUrl(`/api/devotees/${accSelectedProfile.id}/deposit`), {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ depositPaid: true, depositAmount: amt })
                        });
                        fetchAccPayments(accSelectedProfile.id);
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold"
                    >
                      {accPaySummary?.depositPaid ? `✓ Deposit ₹${accPaySummary.depositAmount}` : 'Mark Deposit Paid'}
                    </button>
                  </div>

                  {/* Payment grid */}
                  {accLoading ? (
                    <div className="py-6 flex justify-center"><Activity className="h-6 w-6 animate-spin text-saffron-600" /></div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                        <select value={accPayYear} onChange={e => setAccPayYear(parseInt(e.target.value))} className="p-1.5 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 text-xs font-bold dark:text-white">
                          {Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((monthName, idx) => {
                          const monthNum = idx + 1;
                          const payment = accPayments.find(p => p.year === accPayYear && p.month === monthNum);
                          const isPaid = payment?.status === 'Paid';
                          const isFuture = accPayYear === new Date().getFullYear() && monthNum > new Date().getMonth() + 1;
                          const fee = accPaySummary?.monthlyFee || 0;
                          const paidAmt = payment?.amount || 0;
                          return (
                            <button
                              key={monthNum}
                              disabled={isFuture}
                              onClick={() => accTogglePayment(accPayYear, monthNum, isPaid ? 'Paid' : 'Unpaid')}
                              className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                                isFuture ? 'border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed'
                                : isPaid ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 cursor-pointer'
                                : 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 cursor-pointer'
                              }`}
                              title={isFuture ? 'Future month' : `Click to mark as ${isPaid ? 'Unpaid' : 'Paid'}`}
                            >
                              <span className="text-[9px] font-bold text-slate-500">{monthName}</span>
                              <span className={`text-[10px] font-extrabold ${isFuture ? 'text-slate-400' : isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                      <p className="text-[9px] text-slate-400">Click a month to toggle Paid/Unpaid</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
