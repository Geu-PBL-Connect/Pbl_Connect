import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, Award, ArrowRight } from 'lucide-react';
import axios from 'axios';

const FacultyDashboard = () => {
  const [isSuperMentor, setIsSuperMentor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo?.token) {
          const res = await axios.get('/api/faculty/super-mentor/check-role', {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          });
          setIsSuperMentor(res.data.isSuperMentor);
        }
      } catch (err) {
        console.error("Failed to check super mentor role", err);
      } finally {
        setLoading(false);
      }
    };
    checkRole();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full font-sans fade-in relative py-8">
      <div className="text-center mb-10 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
          Faculty Role Selection
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select the designated faculty portal to continue.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isSuperMentor ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 max-w-6xl w-full px-6`}>
        {/* Mentor Card */}
        <Link 
          to="/faculty/mentor" 
          className="group bg-white dark:bg-gray-800 rounded-2xl p-7 border border-gray-200 dark:border-gray-700 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-5 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mentor Portal</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              View assigned teams, log interactions, check attendance, and evaluate phase reports once approved.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
            <span>Access Portal</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Super Mentor Card */}
        {isSuperMentor && (
          <Link 
            to="/faculty/super-mentor" 
            className="group bg-white dark:bg-gray-800 rounded-2xl p-7 border border-gray-200 dark:border-gray-700 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Quality Gate
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Super Mentor</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Phase 1 Quality Gate validation. Review project abstracts, GitHub repos, and enforce academic rigor.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
              <span>Review Projects</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        )}

        {/* Evaluator Card */}
        <Link 
          to="/faculty/evaluator" 
          className="group bg-white dark:bg-gray-800 rounded-2xl p-7 border border-gray-200 dark:border-gray-700 shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mb-5 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Evaluator Portal</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              Review assigned project presentations, conduct viva assessments, score rubrics, and finalize marks.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
            <span>Access Portal</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default FacultyDashboard;
