import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, X, CalendarClock, ArrowRight } from 'lucide-react';

const FacultyDashboard = () => {
  const [warnings, setWarnings] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWarnings = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || userInfo.role !== 'FACULTY') return;

        // Check if we already showed it this session
        const hasSeenWarning = sessionStorage.getItem('hasSeenTimelineWarning');
        if (hasSeenWarning) return;

        const res = await axios.get('/api/faculty/evaluator/timeline-warnings', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });

        if (res.data.warnings && res.data.warnings.length > 0) {
          setWarnings(res.data.warnings);
          setShowWarningModal(true);
          sessionStorage.setItem('hasSeenTimelineWarning', 'true');
        }
      } catch (err) {
        console.error('Failed to fetch timeline warnings:', err);
      }
    };
    fetchWarnings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full font-sans fade-in relative px-3 py-6">
      
      {/* Timeline Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up relative">
            <button 
              onClick={() => setShowWarningModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-rose-500 p-6 flex flex-col items-center justify-center text-center">
              <div className="bg-white/20 p-4 rounded-full mb-3 shadow-sm">
                <CalendarClock className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">Action Required</h3>
              <p className="text-rose-100 font-medium mt-1">Pending Evaluations Nearing Deadline</p>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-gray-700 dark:text-gray-300 font-medium text-center mb-6">
                You have teams pending for evaluation in phases whose deadline is expiring within the next 4 days. Please complete your grading.
              </p>

              <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-2">
                {warnings.map((w, idx) => {
                  const daysLeft = Math.ceil((new Date(w.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={idx} className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 p-4 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">Phase {w.phaseNumber} - {w.pblSubject}</h4>
                          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 uppercase tracking-wider">
                            Ends in {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'} ({new Date(w.endDate).toLocaleDateString()})
                          </div>
                        </div>
                        <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-black px-3 py-1 rounded-full">
                          {w.pendingTeamsCount} Pending
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 font-medium">Teams: {w.pendingTeams.slice(0, 5).join(', ')}{w.pendingTeamsCount > 5 ? '...' : ''}</p>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors"
                >
                  Remind Me Later
                </button>
                <button 
                  onClick={() => {
                    setShowWarningModal(false);
                    navigate('/faculty/evaluator');
                  }}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2"
                >
                  Grade Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8 sm:mb-12 mt-4 sm:mt-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1c1f58] tracking-tight mb-2 sm:mb-4">Faculty Role Selection</h1>
        <p className="text-sm sm:text-lg text-gray-600">Please select how you want to continue today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 max-w-6xl w-full px-2 sm:px-6">
        {/* Mentor Card */}
        <Link to="/faculty/mentor" className="group bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg sm:shadow-xl border border-gray-100 hover:shadow-2xl hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white mb-4 sm:mb-6 shadow-md group-hover:rotate-6 transition-transform">
            <svg className="w-7 h-7 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Login as Mentor</h2>
          <p className="text-gray-500 text-sm sm:text-base">View your assigned teams, chat with students, and provide guidance for their PBL projects.</p>
        </Link>

        {/* Super Mentor Card */}
        <Link to="/faculty/super-mentor" className="group bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg sm:shadow-xl border border-gray-100 hover:shadow-2xl hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white mb-4 sm:mb-6 shadow-md group-hover:rotate-6 transition-transform">
            <svg className="w-7 h-7 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Super Mentor</h2>
          <p className="text-gray-500 text-sm sm:text-base">Perform academic quality reviews, validate mentor grades, and approve submissions for LMS sync.</p>
        </Link>

        {/* Evaluator Card */}
        <Link to="/faculty/evaluator" className="group bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg sm:shadow-xl border border-gray-100 hover:shadow-2xl hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white mb-4 sm:mb-6 shadow-md group-hover:rotate-6 transition-transform">
            <svg className="w-7 h-7 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Login as Evaluator</h2>
          <p className="text-gray-500 text-sm sm:text-base">Review phase submissions, grade reports, and finalize scores for teams across the university.</p>
        </Link>
      </div>
    </div>
  );
};

export default FacultyDashboard;
