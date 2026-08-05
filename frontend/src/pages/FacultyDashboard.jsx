import { Link } from 'react-router-dom';

const FacultyDashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full font-sans fade-in relative py-8">
      <div className="text-center mb-10 mt-6">
        <h1 className="text-4xl font-extrabold text-[#1c1f58] tracking-tight mb-3">
          Faculty Role Selection
        </h1>
        <p className="text-base text-gray-600">
          Please select the portal you wish to access today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-6">
        {/* Mentor Card */}
        <Link 
          to="/faculty/mentor" 
          className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white mb-6 shadow-md group-hover:rotate-6 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mentor Portal</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              View assigned teams, log interactions, check attendance, and evaluate phase reports once approved.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-blue-600 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Access Portal</span>
            <span>→</span>
          </div>
        </Link>

        {/* Super Mentor Card */}
        <Link 
          to="/faculty/super-mentor" 
          className="group bg-white rounded-3xl p-8 shadow-lg border border-purple-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-white to-purple-50/30"
        >
          <div className="absolute top-3 right-3 bg-purple-100 text-purple-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
            Quality Gate
          </div>
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white mb-6 shadow-md group-hover:rotate-6 transition-transform">
              <span className="text-3xl">🛡️</span>
            </div>
            <h2 className="text-2xl font-bold text-purple-950 mb-2">Super Mentor</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Conduct Phase 1 Quality Gate validation. Review project abstracts, GitHub repos, and enforce academic rigor.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-purple-100 flex items-center justify-between text-purple-700 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Review Projects</span>
            <span>→</span>
          </div>
        </Link>

        {/* Evaluator Card */}
        <Link 
          to="/faculty/evaluator" 
          className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white mb-6 shadow-md group-hover:rotate-6 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluator Portal</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Review assigned project presentations, conduct viva assessments, score rubrics, and finalize marks.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-rose-600 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Access Portal</span>
            <span>→</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default FacultyDashboard;
