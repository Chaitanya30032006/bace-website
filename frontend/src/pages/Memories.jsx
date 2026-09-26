import React from 'react';
const { useState, useEffect } = React;
import { Search, Image, Upload, Download, X, Calendar, MapPin, ZoomIn, Eye, Plus, FolderOpen, Trash2 } from 'lucide-react';
import { API_BASE, apiUrl } from '../config/api';

export default function Memories() {
  const token = localStorage.getItem('bace_token');
  const user = JSON.parse(localStorage.getItem('bace_user') || '{}');

  const imageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}?token=${token}`;
  };
  
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedAlbum, setSelectedAlbum] = useState('All');
  
  // Upload photo states
  const [uploadYear, setUploadYear] = useState('');
  const [uploadAlbumId, setUploadAlbumId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  // Create album states
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: '', eventName: '', eventDate: '', description: '' });
  const [albumMessage, setAlbumMessage] = useState('');

  // Lightbox state
  const [activePhoto, setActivePhoto] = useState(null);

  const fetchGalleryData = async () => {
    try {
      setLoading(true);
      const albumsRes = await fetch(apiUrl('/api/gallery/albums'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const albumsJson = await albumsRes.json();
      if (albumsJson.status === 'success') setAlbums(albumsJson.data);

      const photosRes = await fetch(apiUrl('/api/gallery/photos'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const photosJson = await photosRes.json();
      if (photosJson.status === 'success') setPhotos(photosJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGalleryData(); }, [token]);

  // Year options
  const albumYears = [...new Set(albums.map(a => String(a.year)))].sort((a, b) => b - a);
  const yearFilterOptions = ['All', ...albumYears];
  const currentYear = new Date().getFullYear();
  const uploadYearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => String(currentYear - i));

  // Albums filtered by selected year
  const albumsForYear = selectedYear === 'All' ? albums : albums.filter(a => String(a.year) === selectedYear);

  // Albums for upload year picker
  const albumsForUploadYear = uploadYear ? albums.filter(a => String(a.year) === uploadYear) : [];

  // Filtered photos
  const filteredPhotos = photos.filter(photo => {
    const albumMatch = selectedAlbum === 'All' || photo.albumId === selectedAlbum;
    const yearMatch = selectedYear === 'All' || (photo.album && String(photo.album.year) === selectedYear);
    const searchMatch = !searchQuery || 
      (photo.album?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (photo.album?.eventName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (photo.uploader?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return albumMatch && yearMatch && searchMatch;
  });

  // Group photos by year → albums for the "All" view
  const photosByYear = albumYears.reduce((acc, year) => {
    const yearPhotos = photos.filter(p => p.album && String(p.album.year) === year);
    if (yearPhotos.length > 0) acc[year] = yearPhotos;
    return acc;
  }, {});

  // Group photos by album within a year
  const groupByAlbum = (photoList) => {
    const groups = {};
    photoList.forEach(p => {
      const aid = p.albumId;
      if (!groups[aid]) groups[aid] = { album: p.album, photos: [] };
      groups[aid].photos.push(p);
    });
    return Object.values(groups);
  };

  const isAdmin = user?.role === 'Admin';

  const handleFileChange = (e) => {
    setUploadFile(Array.from(e.target.files));
  };

  const handleDeleteAlbum = async (albumId, albumTitle) => {
    if (!confirm(`Delete album "${albumTitle}" and ALL its photos? This cannot be undone.`)) return;
    try {
      const res = await fetch(apiUrl(`/api/gallery/albums/${albumId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      fetchGalleryData();
    } catch (err) {
      alert(`Failed to delete album: ${err.message}`);
    }
  };

  // Create album
  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    setAlbumMessage('');
    try {
      const res = await fetch(apiUrl('/api/gallery/albums'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newAlbum)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAlbumMessage('Album created successfully!');
      setNewAlbum({ title: '', eventName: '', eventDate: '', description: '' });
      setShowCreateAlbum(false);
      fetchGalleryData();
    } catch (err) {
      setAlbumMessage(`Failed: ${err.message}`);
    }
  };

  // Upload photos
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if ((!uploadAlbumId && !uploadYear) || !uploadFile || uploadFile.length === 0) {
      setUploadMessage('Please select year/album and at least one image.');
      return;
    }

    setUploading(true);
    setUploadMessage('');
    const formData = new FormData();
    if (uploadAlbumId) {
      formData.append('albumId', uploadAlbumId);
    } else {
      formData.append('year', uploadYear);
    }

    const isBulk = uploadFile.length > 1;
    if (isBulk) {
      uploadFile.forEach(file => formData.append('photos', file));
    } else {
      formData.append('photo', uploadFile[0]);
    }

    const endpoint = isBulk ? '/api/gallery/upload-bulk' : '/api/gallery/upload';
    try {
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setUploadMessage(`${isBulk ? json.data.length + ' photos' : 'Photo'} uploaded successfully!`);
      setUploadFile(null);
      setUploadYear('');
      setUploadAlbumId('');
      fetchGalleryData();
    } catch (err) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (photoUrl, albumTitle) => {
    const link = document.createElement('a');
    link.href = imageUrl(photoUrl);
    link.download = `${albumTitle}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      const res = await fetch(apiUrl(`/api/gallery/photos/${photoId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        setActivePhoto(null);
      } else {
        const json = await res.json();
        alert(json.message || 'Failed to delete');
      }
    } catch { alert('Failed to delete photo'); }
  };

  // Reusable photo card
  const PhotoCard = ({ photo }) => (
    <div
      onClick={() => setActivePhoto(photo)}
      className="group relative h-56 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-100 dark:border-slate-900 cursor-pointer bg-slate-100 dark:bg-slate-900 transition-all"
    >
      <img
        src={imageUrl(photo.photoUrl)}
        alt="Memory"
        loading="lazy"
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
        <span className="text-xs font-bold leading-none">{photo.album?.title}</span>
        <span className="text-[10px] text-orange-200 mt-1 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {photo.album?.eventDate ? new Date(photo.album.eventDate).toLocaleDateString() : ''}
        </span>
      </div>
      <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye className="h-4 w-4" />
      </div>
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
          className="absolute top-3 left-3 p-1.5 rounded-lg bg-red-600/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
          title="Delete photo"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-orange-50/10 dark:bg-slate-950 min-h-screen transition-colors">
      
      {/* Gallery Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            BACE Memories Section
          </h1>
          <p className="text-sm text-slate-500 mt-1">Preserving festivals, yatras, and devotional events of Mayapur BACE devotees.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-saffron-500 dark:text-white"
            />
          </div>

          <select 
            value={selectedYear} 
            onChange={(e) => { setSelectedYear(e.target.value); setSelectedAlbum('All'); }} 
            className="p-2 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs focus:outline-none dark:text-white"
          >
            {yearFilterOptions.map(y => (
              <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Album filter pills (when a specific year is selected) */}
      {selectedYear !== 'All' && albumsForYear.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedAlbum('All')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${selectedAlbum === 'All' ? 'bg-saffron-600 text-white shadow-sm' : 'bg-orange-50/50 text-slate-600 hover:bg-orange-100/50 dark:bg-slate-900 dark:text-slate-400'}`}
          >
            All Albums ({filteredPhotos.length})
          </button>
          {albumsForYear.map(album => {
            const count = photos.filter(p => p.albumId === album.id).length;
            return (
              <div key={album.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedAlbum(album.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${selectedAlbum === album.id ? 'bg-saffron-600 text-white shadow-sm' : 'bg-orange-50/50 text-slate-600 hover:bg-orange-100/50 dark:bg-slate-900 dark:text-slate-400'}`}
                >
                  {album.title} ({count})
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteAlbum(album.id, album.title)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Delete album"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-8`}>
        
        {/* Admin Sidebar */}
        {isAdmin && (
        <div className="lg:col-span-1 flex flex-col gap-5 self-start">

          {/* Upload Panel */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-orange-100/20 dark:border-slate-800 pb-3">
              <Upload className="h-4.5 w-4.5 text-saffron-700 dark:text-saffron-400" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">Upload Photos</h3>
            </div>

            {uploadMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold border ${uploadMessage.includes('failed') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-950/30'}`}>
                {uploadMessage}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Select Year</label>
                <select
                  required
                  value={uploadYear}
                  onChange={(e) => { setUploadYear(e.target.value); setUploadAlbumId(''); }}
                  className="p-2.5 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white"
                >
                  <option value="">-- Choose Year --</option>
                  {uploadYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {uploadYear && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Album (optional)</label>
                  <select
                    value={uploadAlbumId}
                    onChange={(e) => setUploadAlbumId(e.target.value)}
                    className="p-2.5 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 text-xs dark:text-white"
                  >
                    <option value="">-- Default (General {uploadYear}) --</option>
                    {albumsForUploadYear.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Choose Image(s)</label>
                <input
                  type="file"
                  required
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="p-2 border rounded-xl border-slate-200 dark:border-slate-800 text-xs dark:text-white cursor-pointer"
                />
                {uploadFile && uploadFile.length > 0 && (
                  <span className="text-[10px] text-saffron-600 font-semibold mt-1">
                    {uploadFile.length} image{uploadFile.length > 1 ? 's' : ''} selected
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadYear}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-500 hover:from-saffron-700 hover:to-gold-600 text-white font-extrabold text-xs shadow-md shadow-saffron-500/10 disabled:opacity-50 transition-all"
              >
                {uploading ? 'Uploading...' : 'Submit Memory Photo'}
              </button>
            </form>
          </div>

          {/* Create Album Panel */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-4">
            <button
              onClick={() => setShowCreateAlbum(!showCreateAlbum)}
              className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white"
            >
              <Plus className={`h-4 w-4 text-saffron-600 transition-transform ${showCreateAlbum ? 'rotate-45' : ''}`} />
              {showCreateAlbum ? 'Cancel' : 'Create New Album'}
            </button>

            {albumMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold border ${albumMessage.includes('Failed') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20'}`}>
                {albumMessage}
              </div>
            )}

            {showCreateAlbum && (
              <form onSubmit={handleCreateAlbum} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-500 uppercase text-[9px]">Album Title</label>
                  <input required placeholder="e.g. Rath Yatra 2026" value={newAlbum.title} onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-500 uppercase text-[9px]">Event Name</label>
                  <input required placeholder="e.g. Rath Yatra" value={newAlbum.eventName} onChange={e => setNewAlbum({ ...newAlbum, eventName: e.target.value })} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-500 uppercase text-[9px]">Event Date</label>
                  <input required type="date" value={newAlbum.eventDate} onChange={e => setNewAlbum({ ...newAlbum, eventDate: e.target.value })} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-500 uppercase text-[9px]">Description</label>
                  <textarea placeholder="Event description..." value={newAlbum.description} onChange={e => setNewAlbum({ ...newAlbum, description: e.target.value })} className="p-2 border rounded-xl bg-transparent border-slate-200 dark:border-slate-800 h-16" />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-extrabold">
                  Create Album
                </button>
              </form>
            )}
          </div>

          {/* Albums Management */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-md flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-saffron-600" />
              Albums
            </h3>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {albums.map(album => (
                <div key={album.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{album.title} ({album.year})</span>
                  <button
                    onClick={() => handleDeleteAlbum(album.id, album.title)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                    title="Delete album"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {albums.length === 0 && <span className="text-[10px] text-slate-400 italic">No albums yet.</span>}
            </div>
          </div>
        </div>
        )}

        {/* Gallery display panel */}
        <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-1'} flex flex-col gap-8`}>

          {/* Photos Grid */}
          <div>
            {loading ? (
              <p className="text-sm text-slate-400 italic">Fetching photos...</p>
            ) : selectedYear !== 'All' ? (
              // Specific year selected
              filteredPhotos.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-orange-100 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-3">
                  <Image className="h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-400">No approved photos in this category yet.</p>
                </div>
              ) : selectedAlbum !== 'All' ? (
                // Specific album selected — flat grid
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredPhotos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}
                </div>
              ) : (
                // All albums in the year — grouped by album
                <div className="flex flex-col gap-8">
                  {groupByAlbum(filteredPhotos).map(({ album, photos: albumPhotos }) => (
                    <div key={album?.title || 'unknown'}>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-saffron-600" />
                        {album?.title}
                        <span className="text-xs font-normal text-slate-400">({albumPhotos.length} photos)</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {albumPhotos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // "All" view — grouped by year, then by album
              Object.keys(photosByYear).length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-orange-100 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-3">
                  <Image className="h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-400">No approved photos yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-10">
                  {albumYears.map(year => {
                    const yearPhotos = photosByYear[year];
                    if (!yearPhotos) return null;
                    const albumGroups = groupByAlbum(yearPhotos);
                    return (
                      <div key={year}>
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4 border-b border-orange-100/20 dark:border-slate-800 pb-2 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-saffron-600" />
                          {year}
                          <span className="text-xs font-normal text-slate-400 ml-2">({yearPhotos.length} photos)</span>
                        </h3>
                        <div className="flex flex-col gap-6">
                          {albumGroups.map(({ album, photos: albumPhotos }) => (
                            <div key={album?.title || 'unknown'}>
                              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <FolderOpen className="h-3.5 w-3.5 text-saffron-500" />
                                {album?.title}
                                <span className="text-[10px] font-normal text-slate-400">({albumPhotos.length})</span>
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {albumPhotos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

        </div>
      </div>

      {/* LIGHTBOX OVERLAY */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fade-in">
          {/* Close button */}
          <button 
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="max-w-4xl w-full flex flex-col gap-4">
            {/* Image viewer */}
            <div className="h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/40">
              <img 
                src={imageUrl(activePhoto.photoUrl)} 
                alt="Enlarged Memory" 
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Bottom details card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
              <div className="flex flex-col gap-1">
                <h4 className="font-extrabold text-lg">{activePhoto.album?.title}</h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-orange-200">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Event Date: {new Date(activePhoto.album?.eventDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Event: {activePhoto.album?.eventName}
                  </span>
                  {activePhoto.uploader && (
                    <span>Uploaded by: {activePhoto.uploader?.name}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(activePhoto.photoUrl, activePhoto.album?.title)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDeletePhoto(activePhoto.id)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
