import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Briefcase, CheckCircle, XCircle, Award, 
  BarChart3, PieChart, Activity, Search, FolderKanban, 
  ChevronRight, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';

const CTODashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'projects'
  
  // Project Explorer state
  const [searchProject, setSearchProject] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      
      const [metricsRes, projectsRes] = await Promise.all([
        axios.get('/api/cto/dashboard-metrics', config),
        axios.get('/api/cto/projects', config)
      ]);
      
      setMetrics(metricsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const searchStr = searchProject.toLowerCase();
    return (
      (p.projectTitle && p.projectTitle.toLowerCase().includes(searchStr)) ||
      (p.teamIdFormatted && p.teamIdFormatted.toLowerCase().includes(searchStr)) ||
      (p.leader?.user?.name && p.leader.user.name.toLowerCase().includes(searchStr))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <Activity className="w-12 h-12 text-blue-600 animate-pulse mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Loading Strategic Data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">CTO Command Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">University Project Based Learning Strategic Overview</p>
        </div>
        
        {/* Tabs Navigation */}
        <div className="mt-6 md:mt-0 flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <PieChart className="w-4 h-4 mr-2" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'projects' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <FolderKanban className="w-4 h-4 mr-2" />
            Project Explorer
          </button>
        </div>
      </header>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard 
              title="Total Students" 
              value={metrics?.students?.total} 
              subtitle={`${metrics?.students?.withTeams} formed teams`}
              icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />} 
              gradient="from-blue-500/10 to-cyan-500/10"
              borderColor="border-blue-200 dark:border-blue-900/50"
            />
            <MetricCard 
              title="Total Teams" 
              value={metrics?.projects?.total} 
              subtitle="Registered groups"
              icon={<Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />} 
              gradient="from-purple-500/10 to-pink-500/10"
              borderColor="border-purple-200 dark:border-purple-900/50"
            />
            <MetricCard 
              title="Mentor Approved" 
              value={metrics?.projects?.mentorApproved} 
              subtitle="Quality check passed"
              icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} 
              gradient="from-emerald-500/10 to-teal-500/10"
              borderColor="border-emerald-200 dark:border-emerald-900/50"
            />
            <MetricCard 
              title="Mentor Rejected" 
              value={metrics?.projects?.mentorRejected} 
              subtitle="Requires revision"
              icon={<XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />} 
              gradient="from-rose-500/10 to-red-500/10"
              borderColor="border-rose-200 dark:border-rose-900/50"
            />
            <MetricCard 
              title="Avg Eval Score" 
              value={`${metrics?.evaluationStats?.averageScore}%`} 
              subtitle="Overall performance"
              icon={<Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />} 
              gradient="from-amber-500/10 to-orange-500/10"
              borderColor="border-amber-200 dark:border-amber-900/50"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
                Teacher Evaluation Distribution
              </h3>
              <div className="h-80">
                {metrics?.evaluationStats?.distribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.evaluationStats.distribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {metrics.evaluationStats.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">No evaluation data available yet</div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-indigo-500" />
                Project Approval Status
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Approved', value: metrics?.projects?.mentorApproved || 0 },
                        { name: 'Rejected', value: metrics?.projects?.mentorRejected || 0 },
                        { name: 'Pending', value: metrics?.projects?.pending || 0 },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#EF4444" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}/>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="animate-fade-in bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[800px] max-h-[80vh]">
          
          {/* Explorer Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <FolderKanban className="w-5 h-5 mr-2 text-indigo-500" />
              Project Registry
            </h2>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search projects, teams, or leaders..." 
                value={searchProject}
                onChange={(e) => setSearchProject(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white transition-shadow"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Table Area */}
            <div className={`flex-1 overflow-auto transition-all ${selectedProject ? 'hidden lg:block lg:w-1/2 border-r border-gray-100 dark:border-gray-700' : 'w-full'}`}>
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Team / Project</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Mentor</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500">No projects found.</td>
                    </tr>
                  ) : (
                    filteredProjects.map(project => (
                      <tr 
                        key={project.id} 
                        onClick={() => setSelectedProject(project)}
                        className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors ${selectedProject?.id === project.id ? 'bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{project.projectTitle || 'Untitled Project'}</div>
                          <div className="text-xs text-gray-500 mt-1">{project.teamIdFormatted} • {project.leader?.user?.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{project.mentor?.user?.name || 'Unassigned'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            project.superMentorStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            project.superMentorStatus === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {project.superMentorStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <button className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Details Panel */}
            {selectedProject ? (
              <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 overflow-auto relative animate-fade-in-right">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="lg:hidden absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-500"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                
                <div className="p-8">
                  <div className="mb-6">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">{selectedProject.teamIdFormatted}</span>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-4 leading-tight">{selectedProject.projectTitle || 'Untitled Project'}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" /> Led by {selectedProject.leader?.user?.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mentor</div>
                      <div className="font-bold text-gray-900 dark:text-white">{selectedProject.mentor?.user?.name || 'Unassigned'}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
                      <div className={`font-bold ${
                            selectedProject.superMentorStatus === 'APPROVED' ? 'text-emerald-600' :
                            selectedProject.superMentorStatus === 'REJECTED' ? 'text-rose-600' :
                            'text-amber-600'
                          }`}>{selectedProject.superMentorStatus}</div>
                    </div>
                  </div>

                  {selectedProject.projectDescription && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Project Abstract</h3>
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedProject.projectDescription}
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-indigo-500" />
                      Evaluations & Phases
                    </h3>
                    
                    {selectedProject.evaluations?.length > 0 || selectedProject.submissions?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedProject.evaluations?.map(ev => (
                          <div key={ev.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">Phase {ev.phase?.phaseNumber} Evaluation</div>
                              <div className="text-sm text-gray-500 mt-1">By: {ev.evaluator?.user?.name}</div>
                              {ev.remarks && <div className="text-sm italic text-gray-600 dark:text-gray-400 mt-2">"{ev.remarks}"</div>}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                {ev.marksObtained !== null ? `${ev.marksObtained}/${ev.totalMarks || 100}` : 'Pending'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">No evaluations recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex flex-1 items-center justify-center flex-col text-gray-400 bg-gray-50 dark:bg-gray-900/30">
                <FolderKanban className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a project from the list to view its detailed report</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon, gradient, borderColor }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border ${borderColor} relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110`}></div>
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{title}</h3>
        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl">{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value !== undefined ? value : '-'}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">{subtitle}</div>
      </div>
    </div>
  </div>
);

export default CTODashboard;
