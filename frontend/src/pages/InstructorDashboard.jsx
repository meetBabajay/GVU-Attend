/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Users, LogOut, Clock, Activity, BarChart3, 
  Copy, Check, BookOpen, MapPin, Plus, Download 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../services/api';

const InstructorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getCoordinates, loading: geoLoading } = useGeolocation();

  // Stats & Courses
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    todayClasses: 0,
    overallAttendanceRate: 0,
    studentsAtRisk: 0
  });
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [attendees, setAttendees] = useState([]);
  
  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dbRooms, setDbRooms] = useState([]);
  const [sessionForm, setSessionForm] = useState({
    sessionName: '',
    roomPreset: 'Custom Location',
    roomLocation: '',
    roomId: null,
    allowedRadiusMeters: '500',
    latitude: '',
    longitude: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Polling Refs
  const qrPollRef = useRef(null);
  const attendeePollRef = useRef(null);

  // Load General Stats, Courses & Rooms on Mount
  useEffect(() => {
    if (!user) return;
    const loadDashboardData = async () => {
      try {
        const [statsRes, coursesRes, roomsRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/courses'),
          api.get('/sessions/rooms')
        ]);
        setStats(statsRes.data);
        setCourses(coursesRes.data);
        setDbRooms(roomsRes.data);
        if (coursesRes.data.length > 0) {
          setSelectedCourse(coursesRes.data[0]);
        }
        
        if (roomsRes.data.length > 0) {
          const firstRoom = roomsRes.data[0];
          setSessionForm(prev => ({
            ...prev,
            roomPreset: firstRoom.name,
            roomLocation: firstRoom.name,
            roomId: firstRoom.id,
            latitude: parseFloat(firstRoom.latitude).toFixed(8),
            longitude: parseFloat(firstRoom.longitude).toFixed(8),
            allowedRadiusMeters: '500'
          }));
        }
      } catch (err) {
        console.error('Failed to load instructor dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  // Load Sessions when Course changes
  const loadSessions = async (courseId) => {
    try {
      const response = await api.get(`/sessions/course/${courseId}`);
      setSessions(response.data);
      
      // Check if there is an active session in the list
      const active = response.data.find(s => s.isActive);
      if (active) {
        setActiveSession(active);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      loadSessions(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchQRToken = async () => {
    if (!activeSession) return;
    try {
      const response = await api.get(`/sessions/${activeSession.id}/qr`);
      setQrToken(response.data.qrToken);
    } catch (err) {
      console.error('Failed to fetch QR token:', err);
    }
  };

  const fetchAttendees = async () => {
    if (!activeSession) return;
    try {
      const response = await api.get(`/attendance/session/${activeSession.id}`);
      setAttendees(response.data);
    } catch (err) {
      console.error('Failed to fetch attendees list:', err);
    }
  };

  // Polling for QR Code and Attendance logs when a session is active
  useEffect(() => {
    if (activeSession) {
      // 1. Fetch QR token immediately, then poll every 2 minutes
      fetchQRToken();
      qrPollRef.current = setInterval(fetchQRToken, 120000);

      // 2. Fetch attendees immediately, then poll every 10 seconds
      fetchAttendees();
      attendeePollRef.current = setInterval(fetchAttendees, 10000);
    } else {
      // Clean up intervals
      if (qrPollRef.current) clearInterval(qrPollRef.current);
      if (attendeePollRef.current) clearInterval(attendeePollRef.current);
      setQrToken('');
      setAttendees([]);
    }

    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
      if (attendeePollRef.current) clearInterval(attendeePollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession]);

  // Open/Close Session
  const handleOpenSession = async (session) => {
    try {
      const response = await api.post(`/sessions/open/${session.id}`);
      setActiveSession(response.data.session);
      loadSessions(selectedCourse.id);
    } catch (err) {
      console.error('Failed to open session:', err);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/sessions/close/${activeSession.id}`);
      setActiveSession(null);
      loadSessions(selectedCourse.id);
      
      // Reload overall dashboard stats
      const statsRes = await api.get('/reports/dashboard');
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to close session:', err);
    }
  };

  // Preset change handler
  const handlePresetChange = (presetName) => {
    if (presetName === 'Custom Location') {
      setSessionForm(prev => ({
        ...prev,
        roomPreset: presetName,
        roomLocation: '',
        roomId: null,
        latitude: '',
        longitude: '',
        allowedRadiusMeters: '500'
      }));
      return;
    }

    const preset = dbRooms.find(p => p.name === presetName);
    if (preset) {
      setSessionForm(prev => ({
        ...prev,
        roomPreset: presetName,
        roomLocation: preset.name,
        roomId: preset.id,
        latitude: parseFloat(preset.latitude).toFixed(8),
        longitude: parseFloat(preset.longitude).toFixed(8),
        allowedRadiusMeters: '500' // default to 500m as requested by user
      }));
    }
  };

  const handleDetectGPS = async () => {
    try {
      const coords = await getCoordinates();
      setSessionForm(prev => ({
        ...prev,
        latitude: coords.latitude.toFixed(8),
        longitude: coords.longitude.toFixed(8)
      }));
    } catch (err) {
      alert(err.message || 'Failed to capture GPS coordinates');
    }
  };

  // Create Session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const lat = parseFloat(sessionForm.latitude);
    const lng = parseFloat(sessionForm.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setFormError('Latitude and Longitude must be valid numbers');
      setFormLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toTimeString().split(' ')[0];
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toTimeString().split(' ')[0]; // 2 hours duration default

      await api.post(`/sessions/course/${selectedCourse.id}`, {
        sessionName: sessionForm.sessionName,
        date: today,
        startTime: nowTime,
        endTime: endTime,
        roomId: sessionForm.roomId,
        roomLocation: sessionForm.roomLocation || 'Custom Location',
        latitude: lat,
        longitude: lng,
        allowedRadiusMeters: parseInt(sessionForm.allowedRadiusMeters) || 500
      });

      setShowCreateModal(false);
      setSessionForm({
        sessionName: '',
        roomPreset: dbRooms.length > 0 ? dbRooms[0].name : 'Custom Location',
        roomLocation: dbRooms.length > 0 ? dbRooms[0].name : '',
        roomId: dbRooms.length > 0 ? dbRooms[0].id : null,
        allowedRadiusMeters: '500',
        latitude: dbRooms.length > 0 ? parseFloat(dbRooms[0].latitude).toFixed(8) : '',
        longitude: dbRooms.length > 0 ? parseFloat(dbRooms[0].longitude).toFixed(8) : ''
      });
      loadSessions(selectedCourse.id);
    } catch (err) {
      console.error('Failed to create session:', err);
      setFormError(err.response?.data?.error || 'Failed to create session');
    } finally {
      setFormLoading(false);
    }
  };

  // Utility Actions
  const copyToClipboard = () => {
    if (!qrToken) return;
    navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = (courseId) => {
    // Standard direct browser download link
    // We can fetch with Bearer token or let the browser open it.
    
    // We can fetch with Bearer token or let the browser open it.
    // The export-csv route expects authenticateJWT, but since standard links don't pass headers,
    // we can implement a custom fetch download.
    api.get(`/reports/course/${courseId}/export-csv`, { responseType: 'blob' })
      .then((response) => {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `Attendance_Report_${selectedCourse.courseCode}.csv`);
        a.click();
      })
      .catch((err) => {
        console.error('Failed to export CSV:', err);
      });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="spinner"></div>
        <span className="text-xs text-slate-550 mt-3 font-semibold">Loading Instructor Portal...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <img src="/gvu_logo.png" alt="GVU Logo" className="w-8 h-8 rounded-full object-cover" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">GVU Attend Lecturer</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 mr-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Lecturer Portal</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                  LP
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                title="Log Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalStudents}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Enrolled Students</div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overallAttendanceRate}%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg Attendance Rate</div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalCourses}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Active Courses</div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 border border-amber-200/50 dark:border-amber-900/30">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.studentsAtRisk}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Students At Risk (&lt;75%)</div>
            </div>
          </div>
        </div>

        {/* Course Selection Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                selectedCourse?.id === course.id
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-250/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {course.courseCode} - {course.courseTitle}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Session / Start Session */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                Active class control
              </h2>
              
              {!activeSession ? (
                <div className="text-center space-y-6 py-4">
                  <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-450 dark:text-slate-500">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Active Attendance Session</h3>
                    <p className="text-xs text-slate-500 mt-2">Select a session from the list or create a new one to enable students check in.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-md hover:shadow-primary-500/30 transition-all hover:-translate-y-0.5 text-xs"
                  >
                    <Plus size={16} />
                    Create New Session
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-5">
                  <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">
                    <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest text-center">Class Scan Token</h3>
                    
                    {qrToken ? (
                      <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-100">
                        <QRCodeSVG 
                          value={qrToken} 
                          size={160}
                          bgColor={"#ffffff"}
                          fgColor={"#0f172a"}
                          level={"M"}
                        />
                      </div>
                    ) : (
                      <div className="w-[160px] h-[160px] flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl">
                        <div className="spinner"></div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                      <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                        {qrToken || 'Fetching active token...'}
                      </span>
                      <button 
                        onClick={copyToClipboard}
                        disabled={!qrToken}
                        className="text-slate-400 hover:text-primary-500 transition-colors p-1"
                        title="Copy session token"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4">
                    <div className="bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/30 p-3 rounded-xl text-center">
                      <div className="text-[10px] text-slate-500 font-semibold">Active Class</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-1 text-[11px] truncate">{activeSession.sessionName}</div>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 p-3 rounded-xl text-center">
                      <div className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold">Live Logins</div>
                      <div className="font-bold text-lg text-primary-750 dark:text-primary-300 mt-0.5">
                        {attendees.length}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleEndSession}
                    className="w-full py-3 rounded-xl bg-slate-950 dark:bg-slate-700 text-white font-semibold text-xs shadow-md hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
                  >
                    End Session (Lock class)
                  </button>
                </div>
              )}
            </div>

            {/* Active Class Attendees List */}
            {activeSession && (
              <div className="glass-panel rounded-3xl p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Live Attendees ({attendees.length})</h3>
                {attendees.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Waiting for students to submit...</p>
                ) : (
                  <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                    {attendees.map(a => (
                      <div key={a.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30 text-xs">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{a.student?.fullName}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{a.student?.matricNumber}</div>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {new Date(a.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-3xl p-6 lg:p-8 h-full">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sessions History</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage and export attendance records for {selectedCourse?.courseCode}</p>
                </div>
                {selectedCourse && (
                  <button 
                    onClick={() => handleDownloadCSV(selectedCourse.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-md transition-colors"
                  >
                    <Download size={14} />
                    Export Course CSV
                  </button>
                )}
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  <Clock className="mx-auto w-10 h-10 text-slate-300 dark:text-slate-650 mb-3" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-350">No Sessions Found</h4>
                  <p className="text-xs text-slate-500 mt-1">Start by creating the first session for this class.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div 
                      key={session.id} 
                      className={`flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border transition-all ${
                        session.isActive 
                          ? 'border-green-300 dark:border-green-800 shadow-sm bg-green-50/20 dark:bg-green-950/10' 
                          : 'border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          session.isActive 
                            ? 'bg-green-150 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          <Users size={18} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-xs">{session.sessionName}</h4>
                          <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 gap-3 mt-1.5">
                            <span className="flex items-center gap-1"><Clock size={10} /> {session.date} ({session.startTime.substring(0, 5)})</span>
                            <span className="flex items-center gap-1"><MapPin size={10} /> {session.roomLocation}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {session.isActive ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 animate-pulse">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenSession(session)}
                            disabled={!!activeSession}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-[10px] transition-colors ${
                              activeSession 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900'
                            }`}
                          >
                            Open Session
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl shadow-xl animate-fade-in relative border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95">
            <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">Create Class Session</h3>
            
            {formError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-800/30">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Session Name</label>
                <input
                  type="text"
                  value={sessionForm.sessionName}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, sessionName: e.target.value }))}
                  placeholder="e.g. Lecture 4: Filesystems"
                  className="block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Room Location Preset</label>
                <select
                  value={sessionForm.roomPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white font-semibold"
                >
                  {dbRooms.map(room => (
                    <option key={room.id} value={room.name}>{room.name}</option>
                  ))}
                  <option value="Custom Location">Custom Location</option>
                </select>
              </div>

              {sessionForm.roomPreset === 'Custom Location' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Custom Venue Name</label>
                  <input
                    type="text"
                    value={sessionForm.roomLocation}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, roomLocation: e.target.value }))}
                    placeholder="e.g. Lecture Room 12"
                    className="block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Latitude</label>
                  <input
                    type="text"
                    value={sessionForm.latitude}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="e.g. 6.42806200"
                    className="block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Longitude</label>
                  <input
                    type="text"
                    value={sessionForm.longitude}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="e.g. 3.42194300"
                    className="block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={geoLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-200 dark:border-primary-850 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-semibold"
                >
                  <MapPin size={12} />
                  {geoLoading ? 'Detecting...' : 'Detect Device GPS'}
                </button>

                <div className="space-y-1 w-[60%]">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">Allowed Radius</label>
                  <select
                    value={sessionForm.allowedRadiusMeters}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, allowedRadiusMeters: e.target.value }))}
                    className="block w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white font-semibold"
                  >
                    <option value="15">15m (Tight room)</option>
                    <option value="30">30m (Standard classroom)</option>
                    <option value="50">50m (Computing Lab)</option>
                    <option value="100">100m (Auditorium)</option>
                    <option value="500">500m (Geofence georeserve)</option>
                  </select>
                </div>
              </div>

              {geoLoading && (
                <div className="text-[10px] text-indigo-500 font-semibold animate-pulse flex items-center gap-1">
                  <MapPin size={12} /> Detecting room coordinates via browser GPS...
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold flex items-center justify-center gap-1.5"
                >
                  {formLoading ? <div className="spinner !w-4 !h-4"></div> : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
