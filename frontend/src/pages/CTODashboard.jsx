import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Briefcase, CheckCircle, Clock, 
  BarChart3, PieChart, Activity, Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';

const CTODashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchRollNo, setSearchRollNo] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get('/api/cto/dashboard-metrics', {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudent = async (e) => {
    e.preventDefault();
    if (!searchRollNo) return;
    try {
      setSearchLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get(`/api/cto/student-profile/${searchRollNo}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      setStudentProfile(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Student not found');
      setStudentProfile(null);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading CTO Dashboard...</div>;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const phaseData = metrics?.phaseProgress?.map(p => ({
    name: `Phase ${p.phaseNumber}`,
    submissions: p.submissions
  })) || [];

  const projectStatusData = [
    { name: 'Completed', value: metrics?.projects?.completed || 0 },
    { name: 'Pending', value: metrics?.projects?.pending || 0 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">CTO Strategic Dashboard</h1>
          <p className="text-gray-500 mt-1 font-medium">Real-time overview of university PBL operations.</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-gray-500">Total Students</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.students?.total || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Briefcase className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-gray-500">Total Teams</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.projects?.total || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-gray-500">Completed Evals</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.projects?.completed || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-gray-500">Pending Evals</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.projects?.pending || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5"/> Phase-wise Submissions</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Bar dataKey="submissions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><PieChart className="w-5 h-5"/> Project Status Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Legend verticalAlign="bottom" height={36}/>
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Student 360 Search */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mt-8">
        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Student 360 Profile Search</h3>
        <p className="text-sm text-gray-500 mb-6">Enter a student's roll number to view their complete academic and project history.</p>
        
        <form onSubmit={handleSearchStudent} className="flex max-w-md gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchRollNo}
              onChange={(e) => setSearchRollNo(e.target.value)}
              placeholder="e.g. 22010123"
              className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <button disabled={searchLoading} type="submit" className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition disabled:opacity-50">
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {studentProfile && (
          <div className="p-5 border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl fade-in space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white">{studentProfile.user?.name}</h4>
                <p className="font-medium text-gray-500">Roll No: {studentProfile.enrollmentNumber} &bull; Section: {studentProfile.section}</p>
                <p className="text-sm text-gray-500">{studentProfile.user?.email}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Active Student</span>
            </div>

            {studentProfile.teamMembers && studentProfile.teamMembers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Project History</h5>
                <div className="space-y-3">
                  {studentProfile.teamMembers.map(tm => (
                    <div key={tm.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                      <p className="font-bold text-primary">{tm.team.projectTitle || 'Untitled Project'}</p>
                      <p className="text-xs text-gray-500 mb-2">Team ID: {tm.team.teamIdFormatted} &bull; Subject: {tm.team.pbl?.subject}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-500">Mentor:</span> {tm.team.mentor?.user?.name || 'Unassigned'}</div>
                        <div><span className="text-gray-500">Super Mentor Status:</span> {tm.team.superMentorStatus}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CTODashboard;
