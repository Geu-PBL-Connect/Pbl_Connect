import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, UserCheck, UserX, UsersRound, BarChart3, 
  PieChart as PieIcon, Award, Search, Filter, CheckCircle2,
  TrendingUp, User, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
  const [selectedPbl, setSelectedPbl] = useState('');
  const [pblList, setPblList] = useState([]);
  const defaultGraphData = [
    { name: 'Step 1: Teams', value: 0 },
    { name: 'Step 2: Mentors', value: 0 },
    { name: 'Step 3: Phase 1', value: 0 },
    { name: 'Step 4: Phase 2', value: 0 },
    { name: 'Step 5: Phase 3', value: 0 }
  ];

  const [statsData, setStatsData] = useState({
    students: 0,
    teams: 0,
    faculty: 0,
    activePbls: 0,
    studentsWithTeam: 0,
    studentsWithoutTeam: 0,
    graphData: defaultGraphData
  });

  // Faculty Grading Analytics State
  const [facultyStats, setFacultyStats] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [facultySearch, setFacultySearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'ACTIVE_ONLY'

  useEffect(() => {
    const fetchPbls = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const res = await axios.get('/api/admin/pbl', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setPblList(res.data);
      } catch (err) {
        console.error('Failed to fetch PBLs', err);
      }
    };
    fetchPbls();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        let url = `/api/admin/stats`;
        if (selectedPbl) url += `?pblId=${selectedPbl}`;
        
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setStatsData({
          ...res.data,
          graphData: res.data.graphData?.length ? res.data.graphData : defaultGraphData
        });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };

    const fetchFacultyStats = async () => {
      try {
        setFacultyLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        let url = `/api/admin/faculty-grading-stats`;
        if (selectedPbl) url += `?pblId=${selectedPbl}`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setFacultyStats(res.data || []);
      } catch (err) {
        console.error('Failed to fetch faculty stats', err);
      } finally {
        setFacultyLoading(false);
      }
    };

    fetchStats();
    fetchFacultyStats();
  }, [selectedPbl]);

  const stats = [
    { title: 'Total Students', value: statsData.students, icon: <Users size={24} />, color: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
    { title: 'Students With Team', value: statsData.studentsWithTeam, icon: <UserCheck size={24} />, color: 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
    { title: 'Students Without Team', value: statsData.studentsWithoutTeam, icon: <UserX size={24} />, color: 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
    { title: 'Total Teams Formed', value: statsData.teams, icon: <UsersRound size={24} />, color: 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' },
  ];

  // Filter faculties by search & activity filter
  const filteredFaculties = facultyStats.filter(fac => {
    const matchesSearch = fac.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
                          fac.email.toLowerCase().includes(facultySearch.toLowerCase()) ||
                          fac.department.toLowerCase().includes(facultySearch.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'ACTIVE_ONLY') return fac.hasActivity;
    return true;
  });

  return (
    <div className="space-y-8 fade-in pb-12">
      {/* Header & PBL Selection Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span>Dashboard Overview</span>
            <Sparkles className="text-yellow-500 w-5 h-5" />
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Showing stats for 
            {selectedPbl ? (() => {
              const p = pblList.find(x => x.id === selectedPbl);
              return p ? <span className="font-bold text-blue-600 dark:text-blue-400"> {p.subjectShort}</span> : ' All Subjects';
            })() : <span className="font-bold text-blue-600 dark:text-blue-400"> All Subjects</span>}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {pblList.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-600">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 pl-2 whitespace-nowrap">Filter PBL:</label>
              <select
                value={selectedPbl}
                onChange={(e) => setSelectedPbl(e.target.value)}
                className="px-3 py-1.5 border-none rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-semibold text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="">All Subjects</option>
                {pblList.map(p => (
                  <option key={p.id} value={p.id}>{p.subjectShort}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-black text-gray-800 dark:text-white mt-2 tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-inner ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Phase Progress Chart */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-500" size={20} /> PBL Phase Progress Overview
          </h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statsData.graphData || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={46} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FACULTY INDIVIDUAL GRADING CRITERIA & PIE CHARTS SECTION */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* Section Header with Search and Activity Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <PieIcon className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold tracking-tight">Faculty Stats</h3>
            </div>
            <p className="text-blue-200 text-xs mt-1">
              Individual mark distribution criteria and average scoring pattern per faculty member.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search faculty..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-blue-950/60 border border-blue-700/50 rounded-xl text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center bg-blue-950/60 p-1 rounded-xl border border-blue-700/50">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeFilter === 'ALL' ? 'bg-yellow-400 text-gray-900 shadow' : 'text-blue-200 hover:text-white'
                }`}
              >
                All ({facultyStats.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('ACTIVE_ONLY')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeFilter === 'ACTIVE_ONLY' ? 'bg-yellow-400 text-gray-900 shadow' : 'text-blue-200 hover:text-white'
                }`}
              >
                Active Only ({facultyStats.filter(f => f.hasActivity).length})
              </button>
            </div>
          </div>
        </div>

        {/* Faculty Grid of Pie Charts */}
        {facultyLoading ? (
          <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-semibold text-sm">Loading Faculty Grading Analytics...</p>
          </div>
        ) : filteredFaculties.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold text-gray-700 dark:text-gray-300 text-base">No Faculty Found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or PBL filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFaculties.map((fac) => {
              const initials = fac.name
                ? fac.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'FA';

              return (
                <div
                  key={fac.facultyId}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Faculty Header Card */}
                  <div>
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                            {fac.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                            {fac.department || fac.email}
                          </p>
                        </div>
                      </div>

                      {fac.hasActivity ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* KPI Quick Metrics */}
                    <div className="grid grid-cols-2 gap-2 my-3">
                      <div className="bg-blue-50/70 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Avg Evaluator Score</p>
                        <p className="text-lg font-black text-blue-950 dark:text-blue-100 mt-0.5">
                          {fac.avgEvaluationScore !== null ? `${fac.avgEvaluationScore}` : 'N/A'}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {fac.totalEvaluated} student{fac.totalEvaluated === 1 ? '' : 's'} evaluated
                        </p>
                      </div>

                      <div className="bg-purple-50/70 dark:bg-purple-950/30 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/50">
                        <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Avg Mentor Marks</p>
                        <p className="text-lg font-black text-purple-950 dark:text-purple-100 mt-0.5">
                          {fac.avgMentorMarks !== null ? `${fac.avgMentorMarks} / 10` : 'N/A'}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {fac.totalMentoredGrades} team phase grade{fac.totalMentoredGrades === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Pie Chart for Grading Distribution */}
                    <div className="my-2 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-2 border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-300 text-center mb-1">
                        Marks Awarding Distribution
                      </p>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={fac.pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={36}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {fac.pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ 
                                borderRadius: '8px', 
                                border: 'none', 
                                backgroundColor: '#1E293B',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                              }}
                              formatter={(value, name) => [`${value} student/grade(s)`, name]}
                            />
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              iconType="circle"
                              iconSize={8}
                              wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Criteria breakdown if available */}
                    {fac.criteriaBreakdown && fac.criteriaBreakdown.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Criteria Average Breakdown:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {fac.criteriaBreakdown.map((crit, cIdx) => (
                            <span 
                              key={cIdx}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-semibold"
                            >
                              {crit.criteria}: <strong className="text-blue-600 dark:text-blue-400">{crit.average}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mentor synopsis approval stats */}
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400">
                    <span>Mentor Approvals:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      <span className="text-green-600 dark:text-green-400">{fac.mentorApprovedCount} Approved</span>
                      {' / '}
                      <span className="text-red-500 dark:text-red-400">{fac.mentorRejectedCount} Rejected</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
