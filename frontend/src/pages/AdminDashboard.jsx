import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, pending, rooms
  const [pending, setPending] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    totalRooms: 0,
    totalPending: 0
  });

  // Room form state
  const [roomName, setRoomName] = useState('');
  const [roomLat, setRoomLat] = useState('');
  const [roomLng, setRoomLng] = useState('');
  const [roomError, setRoomError] = useState(null);
  const [roomSuccess, setRoomSuccess] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);

      // Fetch pending users
      const pendingRes = await api.get('/auth/pending');
      setPending(pendingRes.data);

      // Fetch rooms
      const roomsRes = await api.get('/admin/rooms');
      setRooms(roomsRes.data);

      setError(null);
    } catch (e) {
      console.error(e);
      setError('Failed to load dashboard data. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionMessage(null);
      const res = await api.post(`/auth/approve/${id}`);
      setActionMessage({ type: 'success', text: res.data.message || 'User approved successfully.' });
      fetchData();
    } catch (e) {
      setActionMessage({ type: 'error', text: e.response?.data?.error || 'Failed to approve user.' });
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject and delete this registration request?')) {
      return;
    }
    try {
      setActionMessage(null);
      const res = await api.delete(`/auth/reject/${id}`);
      setActionMessage({ type: 'success', text: res.data.message || 'User registration rejected.' });
      fetchData();
    } catch (e) {
      setActionMessage({ type: 'error', text: e.response?.data?.error || 'Failed to reject user.' });
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setRoomError(null);
    setRoomSuccess(null);

    if (!roomName || !roomLat || !roomLng) {
      setRoomError('All room fields are required');
      return;
    }

    try {
      const res = await api.post('/admin/rooms', {
        name: roomName,
        latitude: parseFloat(roomLat),
        longitude: parseFloat(roomLng)
      });
      setRoomSuccess(res.data.message || 'Room created successfully');
      setRoomName('');
      setRoomLat('');
      setRoomLng('');
      // Refresh list & stats
      const roomsRes = await api.get('/admin/rooms');
      setRooms(roomsRes.data);
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      setRoomError(err.response?.data?.error || 'Failed to create room');
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room? This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/admin/rooms/${id}`);
      setRoomSuccess('Room deleted successfully');
      // Refresh list & stats
      const roomsRes = await api.get('/admin/rooms');
      setRooms(roomsRes.data);
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      setRoomError(err.response?.data?.error || 'Failed to delete room');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 3m0-3a2 2 0 110 3m-9 1h1c1 0 2 1.22 2 2.52V18a3 3 0 003 3h8a3 3 0 003-3v-6.48c0-1.3-.1-2.52-2-2.52h-1m-4-6V4M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-indigo-400">
                Admin Control Room
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Attendance Management System</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-300 bg-red-50/50 hover:bg-red-50 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:hover:bg-red-950/40 dark:text-red-400 text-sm font-medium transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 rounded-r-lg shadow-sm">
            <p className="font-semibold">System Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {actionMessage && (
          <div className={`mb-6 p-4 rounded-xl shadow-sm border ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' 
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400'
          }`}>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">{actionMessage.text}</p>
              <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl mb-8 max-w-md shadow-inner">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-lg transition-all relative ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Pending Users</span>
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold pulse-glow">
                {pending.length}
              </span>
            )}
          </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'rooms'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Classrooms</span>
            </button>
            <button
              onClick={() => setActiveTab('scoreboard')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'scoreboard'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3 -3v6" />
              </svg>
              <span>Scoreboard</span>
            </button>
          </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => setActiveTab('students')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Enrolled Students</p>
                    <p className="text-3xl font-extrabold tracking-tight mt-1">{stats.totalStudents}</p>
                  </div>
                  <div className="p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => setActiveTab('lecturers')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Lecturers</p>
                    <p className="text-3xl font-extrabold tracking-tight mt-1">{stats.totalLecturers}</p>
                  </div>
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => setActiveTab('rooms')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Rooms</p>
                    <p className="text-3xl font-extrabold tracking-tight mt-1">{stats.totalRooms}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => setActiveTab('pending')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Approvals</p>
                    <p className={`text-3xl font-extrabold tracking-tight mt-1 ${stats.totalPending > 0 ? 'text-rose-500' : ''}`}>
                      {stats.totalPending}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stats.totalPending > 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions / System Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-panel p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-4">Pending Approval Tasks</h3>
                {pending.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold text-sm">Perfect State</p>
                    <p className="text-xs mt-1">No registration requests waiting in the queue.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      You have <span className="font-bold text-sky-500">{pending.length}</span> registration request(s) waiting for approval.
                    </p>
                    <button
                      onClick={() => setActiveTab('pending')}
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm transition shadow-md shadow-sky-500/10 hover:shadow-sky-500/20"
                    >
                      View Approval Queue
                    </button>
                  </div>
                )}
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">Location Restrictions Status</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Students can sign attendance only when they are physically present inside the designated classroom coordinates (allowed radius limit: <strong>500 meters</strong>).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rooms.slice(0, 3).map((r) => (
                      <span key={r.id} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
                        📍 {r.name}
                      </span>
                    ))}
                    {rooms.length > 3 && (
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-500">
                        +{rooms.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition"
                >
                  Manage Classrooms
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scoreboard' && (
          <div className="glass-panel p-6 rounded-2xl shadow-sm animate-fadeIn">
            <h2 className="text-xl font-bold mb-4">Student Scoreboard</h2>
            {scoreboard.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No scores available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase text-slate-400">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Attendance</th>
                      <th className="py-3 px-4">Assignment</th>
                      <th className="py-3 px-4">Test</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                    {scoreboard.map((s) => (
                      <tr key={s.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-900 dark:text-slate-100">{s.fullName}</td>
                        <td className="py-4 px-4">{s.attendanceCount}</td>
                        <td className="py-4 px-4">
                          <input
                            type="number"
                            min="0"
                            value={s.assignmentScore}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setScoreboard((prev) => prev.map((item) => item.studentId === s.studentId ? { ...item, assignmentScore: val } : item));
                            }}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <input
                            type="number"
                            min="0"
                            value={s.testScore}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setScoreboard((prev) => prev.map((item) => item.studentId === s.studentId ? { ...item, testScore: val } : item));
                            }}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="py-4 px-4 font-semibold">{s.total}</td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={async () => {
                              try {
                                await api.put(`/admin/score/${s.studentId}`, { assignmentScore: s.assignmentScore, testScore: s.testScore });
                                setActionMessage({ type: 'success', text: 'Score updated.' });
                              } catch (e) {
                                setActionMessage({ type: 'error', text: e.response?.data?.error || 'Failed to update.' });
                              }
                            }}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-medium"
                          >Save</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="glass-panel p-6 rounded-2xl shadow-sm animate-fadeIn">
            <h2 className="text-xl font-bold mb-6">Registration Approvals Queue</h2>
            {pending.length === 0 ? (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p className="text-lg font-bold">Queue is Clean!</p>
                <p className="text-sm text-slate-400 mt-1">All registrations have been approved or rejected.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase text-slate-400">
                      <th className="py-3 px-4">Name / Role</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                    {pending.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{u.fullName || u.studentProfile?.fullName || '—'}</div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize mt-1 ${
                            u.role === 'lecturer' 
                              ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' 
                              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs">{u.email}</td>
                        <td className="py-4 px-4 text-xs">
                          {u.role === 'student' && u.studentProfile ? (
                            <div className="space-y-0.5 text-slate-500 dark:text-slate-400">
                              <p>Matric: <strong className="text-slate-700 dark:text-slate-300">{u.studentProfile.matricNumber}</strong></p>
                              <p>Dept: {u.studentProfile.department?.name || 'Computer Science'}</p>
                              <p>Level: {u.studentProfile.level}L</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleApprove(u.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(u.id)}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 dark:hover:bg-rose-950/40 dark:text-rose-400 rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            Reject
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

        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            {/* Room Creator */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm h-fit">
              <h2 className="text-lg font-bold mb-4">Add Classroom Location</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create designated classrooms with GPS coordinates to allow geofenced scan checks.</p>
              
              {roomError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {roomError}
                </div>
              )}

              {roomSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                  {roomSuccess}
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Classroom Name</label>
                  <input
                    type="text"
                    required
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Lecture Room 1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={roomLat}
                      onChange={(e) => setRoomLat(e.target.value)}
                      placeholder="e.g. 6.429000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={roomLng}
                      onChange={(e) => setRoomLng(e.target.value)}
                      placeholder="e.g. 3.422500"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm transition shadow-md shadow-sky-500/10 hover:shadow-sky-500/20"
                >
                  Create Room Location
                </button>
              </form>
            </div>

            {/* Room List */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold">Classroom Registry</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">View coordinates of configured locations.</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
                  {rooms.length} registered
                </span>
              </div>

              {rooms.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <p className="font-semibold">No Rooms Configured</p>
                  <p className="text-xs text-slate-400">Use the creation panel to register classroom zones.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms.map((r) => (
                    <div key={r.id} className="p-4 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 rounded-xl relative hover:border-slate-300 dark:hover:border-slate-700 transition">
                      <div className="font-semibold text-sm pr-8">{r.name}</div>
                      <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                        <p>Lat: <span className="font-mono text-slate-700 dark:text-slate-300">{parseFloat(r.latitude).toFixed(6)}</span></p>
                        <p>Lng: <span className="font-mono text-slate-700 dark:text-slate-300">{parseFloat(r.longitude).toFixed(6)}</span></p>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteRoom(r.id)}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                        title="Delete Room"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
