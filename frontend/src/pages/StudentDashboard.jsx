import React, { useState, useEffect } from 'react';
import { Camera, Calendar, CheckCircle, XCircle, LogOut, Clock, Activity, Key, AlertCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useFingerprint } from '../hooks/useFingerprint';
import api from '../services/api';

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    return null;
  }
};

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getCoordinates, error: geoError, loading: geoLoading } = useGeolocation();
  const fingerprint = useFingerprint();

  const [sessionCode, setSessionCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error', text: '' }
  
  const [courses, setCourses] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHistory = async () => {
    if (!user?.studentProfile?.id) return;
    try {
      const response = await api.get(`/attendance/student/${user.studentProfile.id}`);
      setAttendanceHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    };

    fetchCourses();
    fetchHistory();
  }, [user]);

  useEffect(() => {
    let scanner = null;
    if (scanning) {
      import('html5-qrcode')
        .then((pkg) => {
          const Html5QrcodeScanner = pkg.Html5QrcodeScanner;
          const container = document.getElementById('reader');
          if (!container) return;

          scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );
          
          scanner.render(
            (decodedText) => {
              handleCheckIn(decodedText);
              setScanning(false);
              scanner.clear().catch(e => console.error("Error clearing scanner:", e));
            },
            (error) => {
              // Ignore scanning trace errors
            }
          );
        })
        .catch((err) => {
          console.error("Failed to load scanner", err);
          setScannerError("Camera scanner failed to load. Please paste the session token manually.");
          setScanning(false);
        });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Cleanup error:", e));
      }
    };
  }, [scanning]);

  const handleCheckIn = async (token) => {
    setStatusMessage(null);
    setScannerError('');
    setIsSubmitting(true);
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.sessionId) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid session token. Please scan/paste a valid GVU Attend token.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Get location coordinates first
      const coords = await getCoordinates();
      
      const response = await api.post('/attendance/submit', {
        classSessionId: decoded.sessionId,
        qrToken: token,
        latitude: coords.latitude,
        longitude: coords.longitude,
        deviceFingerprint: fingerprint
      });

      setStatusMessage({
        type: 'success',
        text: `Successfully signed attendance! Verified distance: ${parseFloat(response.data.distanceMeters).toFixed(1)} meters.`
      });
      
      setSessionCode('');
      fetchHistory();
    } catch (err) {
      console.error('Attendance submission error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to submit attendance';
      setStatusMessage({
        type: 'error',
        text: errMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCheckIn = (e) => {
    e.preventDefault();
    if (!sessionCode.trim()) return;
    handleCheckIn(sessionCode.trim());
  };

  const toggleScanner = () => {
    setScannerError('');
    setStatusMessage(null);
    setScanning(!scanning);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  // Calculate dynamic stats
  const totalClasses = attendanceHistory.length;
  const attendedCount = attendanceHistory.filter(r => r.status === 'present' || r.status === 'late').length;
  const missedCount = attendanceHistory.filter(r => r.status === 'absent').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 100;

  const initials = user.studentProfile?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ST';

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
              <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">GVU Attend</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 mr-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.studentProfile?.fullName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Matric: {user.studentProfile?.matricNumber}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-450 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                  {initials}
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
        
        {/* Status Alerts */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
            statusMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
          }`}>
            <div className="mt-0.5">
              {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{statusMessage.type === 'success' ? 'Success' : 'Check-In Failed'}</p>
              <p className="text-xs mt-1 opacity-90">{statusMessage.text}</p>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-xs font-semibold hover:underline opacity-80">Dismiss</button>
          </div>
        )}

        {geoError && (
          <div className="p-4 rounded-2xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <div className="mt-0.5">
              <MapPin size={20} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Location Access Issue</p>
              <p className="text-xs mt-1 opacity-90">{geoError}</p>
            </div>
          </div>
        )}

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl">
              <CheckCircle size={28} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{attendancePercentage}%</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Overall Attendance</div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Calendar size={28} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{attendedCount}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Classes Attended</div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl">
              <XCircle size={28} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{missedCount}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Classes Missed</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Check-In Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mark Attendance</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Paste the session token from your instructor or use your camera to scan the QR code.
              </p>

              {scannerError && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs">
                  {scannerError}
                </div>
              )}

              {/* Manual Input form */}
              {!scanning && (
                <form onSubmit={handleManualCheckIn} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1">Session Token</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Key size={18} />
                      </div>
                      <input
                        type="text"
                        value={sessionCode}
                        onChange={(e) => setSessionCode(e.target.value)}
                        placeholder="Paste session JWT token..."
                        className="block w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-xs"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || geoLoading}
                    className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting || geoLoading ? (
                      <>
                        <div className="spinner !w-5 !h-5 !border-white/30 !border-l-white"></div>
                        <span>{geoLoading ? 'Getting Location...' : 'Signing Attendance...'}</span>
                      </>
                    ) : (
                      <span>Submit Token</span>
                    )}
                  </button>
                </form>
              )}

              {/* QR scanner holder */}
              {scanning && (
                <div className="space-y-4">
                  <div id="reader" className="w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 bg-black"></div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={toggleScanner}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium transition-colors text-sm"
                >
                  <Camera size={16} />
                  {scanning ? 'Switch to Manual Input' : 'Scan QR Code instead'}
                </button>
              </div>
            </div>

            {/* Enrolled Courses Card */}
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My Enrolled Courses</h3>
              {courses.length === 0 ? (
                <p className="text-xs text-slate-500">Not enrolled in any courses.</p>
              ) : (
                <div className="space-y-3">
                  {courses.map(course => (
                    <div key={course.id} className="flex justify-between items-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{course.courseCode}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{course.courseTitle}</div>
                      </div>
                      <div className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full font-semibold">
                        L{course.level}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent History */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-3xl p-6 lg:p-8 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Attendance</h2>
                <div className="text-xs text-slate-500">
                  Showing all active records
                </div>
              </div>

              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="spinner"></div>
                  <span className="text-xs text-slate-500">Loading history logs...</span>
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-20">
                  <Clock className="mx-auto w-12 h-12 text-slate-350 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500">No attendance history found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendanceHistory.map((record) => {
                    const formattedTime = record.signedAt 
                      ? new Date(record.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '-';
                    const recordDate = record.session?.date || new Date(record.signedAt).toISOString().split('T')[0];
                    const courseName = record.session?.course 
                      ? `${record.session.course.courseCode} - ${record.session.course.courseTitle}`
                      : 'Unknown Course';

                    return (
                      <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            record.status === 'present' || record.status === 'late'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {record.status === 'present' || record.status === 'late' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{courseName}</h4>
                            <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 gap-3 mt-1">
                              <span className="flex items-center gap-1"><Calendar size={12} /> {recordDate}</span>
                              <span className="flex items-center gap-1"><Clock size={12} /> {formattedTime}</span>
                              {record.distanceMeters && (
                                <span className="flex items-center gap-0.5 text-primary-600 dark:text-primary-450">
                                  <MapPin size={10} /> {parseFloat(record.distanceMeters).toFixed(0)}m
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          record.status === 'present' || record.status === 'late'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {record.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
