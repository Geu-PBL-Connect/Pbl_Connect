import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Briefcase, CheckCircle, XCircle, Award, 
  BarChart3, PieChart, Activity, Search, FolderKanban, 
  ChevronRight, ArrowUpRight, UserCheck, UserX, UsersRound, BookOpen, User,
  Sparkles, Filter, FileText
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

  const [selectedPbl, setSelectedPbl] = useState('');
  const [pblList, setPblList] = useState([]);

  useEffect(() => {
    fetchPbls();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPbl]);

  const fetchPbls = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get('/api/cto/pbl', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setPblList(res.data);
    } catch (err) {
      console.error('Failed to fetch PBLs', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      
      let metricsUrl = '/api/cto/dashboard-metrics';
      let projectsUrl = '/api/cto/projects';
      
      if (selectedPbl) {
        metricsUrl += `?pblId=${selectedPbl}`;
        projectsUrl += `?pblId=${selectedPbl}`;
      }

      const [metricsRes, projectsRes] = await Promise.all([
        axios.get(metricsUrl, config),
        axios.get(projectsUrl, config)
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
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">System Overview</h1>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-200 dark:border-indigo-800">CTO</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-500" />
            Platform statistics and PBL tracking
          </p>
        </div>
        
        {/* PBL Filter and Tabs Navigation */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* PBL Filter Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Filter size={18} className="text-indigo-500 ml-2" />
            <select 
              value={selectedPbl}
              onChange={(e) => setSelectedPbl(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-200 font-semibold text-sm border-none focus:ring-0 cursor-pointer pr-8 focus:outline-none"
            >
              <option value="">All PBLs (University Level)</option>
              {pblList.map(pbl => (
                <option key={pbl.id} value={pbl.id}>
                  {pbl.subject} ({pbl.semester} Sem - {pbl.session})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
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
              Projects
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Total Students" 
              value={metrics?.students?.total} 
              subtitle="Registered students"
              icon={<Users size={24} />} 
              color="bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
            />
            <MetricCard 
              title="Students With Team" 
              value={metrics?.students?.withTeams} 
              subtitle="Formed teams"
              icon={<UserCheck size={24} />} 
              color="bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
            />
            <MetricCard 
              title="Students Without Team" 
              value={metrics?.students?.withoutTeams} 
              subtitle="Pending formation"
              icon={<UserX size={24} />} 
              color="bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
            />
            <MetricCard 
              title="Total Teams" 
              value={metrics?.projects?.total} 
              subtitle="Registered groups"
              icon={<UsersRound size={24} />} 
              color="bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
            />
            <MetricCard 
              title="Teams Without Mentor" 
              value={metrics?.projects?.withoutMentor} 
              subtitle="Unassigned teams"
              icon={<Users size={24} />} 
              color="bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
            />
            <MetricCard 
              title="Total Mentors" 
              value={metrics?.mentors?.total} 
              subtitle="Faculty members"
              icon={<User size={24} />} 
              color="bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
            />
            <MetricCard 
              title="Active PBLs" 
              value={metrics?.pbls?.active} 
              subtitle="Ongoing batches"
              icon={<BookOpen size={24} />} 
              color="bg-cyan-50 text-cyan-600 border border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800"
            />
            <MetricCard 
              title="Avg Eval Score" 
              value={`${metrics?.evaluationStats?.averageScore}%`} 
              subtitle="Overall performance"
              icon={<Award size={24} />} 
              color="bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
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
                  className="lg:hidden absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                      {selectedProject.teamIdFormatted}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-4 leading-tight">
                      {selectedProject.projectTitle || 'Untitled Project'}
                    </h2>
                    
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Leader:</span> {selectedProject.leader?.user?.name}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Team Size:</span> {(selectedProject.members?.length || 0) + 1}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Mentor:</span> {selectedProject.mentor?.user?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Approval Status</div>
                      <div className={`font-black text-lg ${
                            selectedProject.superMentorStatus === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400' :
                            selectedProject.superMentorStatus === 'REJECTED' ? 'text-rose-600 dark:text-rose-400' :
                            'text-amber-500 dark:text-amber-400'
                          }`}>{selectedProject.superMentorStatus}</div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Rejections</div>
                      <div className="font-black text-lg text-rose-600 dark:text-rose-400">
                        {selectedProject.submissions?.filter(s => s.status === 'REJECTED').length || 0}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phases Done</div>
                      <div className="font-black text-lg text-blue-600 dark:text-blue-400">
                        {selectedProject.submissions?.filter(s => s.status === 'APPROVED').length || 0}
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Avg Score</div>
                      <div className="font-black text-lg text-indigo-600 dark:text-indigo-400">
                        {selectedProject.evaluations?.length > 0 ? 
                          (selectedProject.evaluations.reduce((sum, ev) => sum + (ev.marksObtained/ev.totalMarks*100), 0) / selectedProject.evaluations.length).toFixed(1) + '%' 
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {selectedProject.projectDescription && (
                    <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Project Abstract</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {selectedProject.projectDescription}
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" /> Phase-wise Reports & Feedback
                    </h3>
                    
                    {selectedProject.submissions?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedProject.submissions.map(sub => (
                          <div key={sub.id} className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${
                              sub.status === 'APPROVED' ? 'bg-emerald-500' :
                              sub.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}></div>
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                              <div>
                                <h4 className="font-black text-lg text-gray-900 dark:text-white">
                                  Phase {sub.phase?.phaseNumber}: {sub.phase?.title}
                                </h4>
                                <div className="text-xs font-medium text-gray-500 mt-1">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                sub.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' :
                                sub.status === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400' :
                                'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                            
                            {(sub.synopsisUrl || sub.fileUrls) && (
                              <div className="mb-4 flex flex-wrap gap-3">
                                {sub.synopsisUrl ? (
                                  <a href={sub.synopsisUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl transition-colors">
                                    <FileText className="w-4 h-4 mr-2"/> View Synopsis
                                  </a>
                                ) : (
                                  <a href={sub.fileUrls?.[0]} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl transition-colors">
                                    <FileText className="w-4 h-4 mr-2"/> View Submission Document
                                  </a>
                                )}
                              </div>
                            )}

                            {sub.mentorGrades?.length > 0 && (
                              <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Mentor Review</h5>
                                {sub.mentorGrades.map(mg => (
                                  <div key={mg.id} className="mb-3 last:mb-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Grade: {mg.grade}/10</span>
                                    </div>
                                    {mg.remarks && <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{mg.remarks}"</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center shadow-sm">
                        <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <div className="text-gray-500 font-medium">No reports submitted yet</div>
                      </div>
                    )}
                  </div>

                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-2 flex items-center">
                      <Award className="w-4 h-4 mr-2" /> Faculty Evaluations
                    </h3>
                    
                    {selectedProject.evaluations?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedProject.evaluations?.map(ev => (
                          <div key={ev.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">Phase {ev.phase?.phaseNumber} Evaluation</div>
                              <div className="text-sm font-medium text-gray-500 mt-1">Evaluator: {ev.evaluator?.user?.name}</div>
                              {ev.remarks && <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">"{ev.remarks}"</div>}
                            </div>
                            <div className="sm:text-right shrink-0 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Score</div>
                              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                {ev.marksObtained !== null ? `${ev.marksObtained}/${ev.totalMarks || 100}` : 'Pending'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center shadow-sm">
                        <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <div className="text-gray-500 font-medium">No faculty evaluations recorded</div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-2 flex items-center">
                      <UsersRound className="w-4 h-4 mr-2" /> Peer Reviews
                    </h3>
                    
                    {selectedProject.examineeAssignments?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedProject.examineeAssignments.map(assignment => (
                          <div key={assignment.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="font-bold text-gray-900 dark:text-white mb-4">Phase {assignment.phase?.phaseNumber} Peer Review</div>
                            
                            {assignment.evaluations?.length > 0 ? (
                              <div className="space-y-3">
                                {assignment.evaluations.map(pe => (
                                  <div key={pe.id} className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Reviewer: {pe.reviewerStudent?.user?.name || 'Peer'}</div>
                                      {pe.marksData?.remarks && <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">"{pe.marksData.remarks}"</div>}
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Marks</div>
                                      <div className="text-xl font-black text-blue-700 dark:text-blue-400">
                                        {pe.totalMarks}/50
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm font-medium text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center">
                                Peer evaluations pending
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center shadow-sm">
                        <UsersRound className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <div className="text-gray-500 font-medium">No peer reviews conducted for this project</div>
                      </div>
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

const MetricCard = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-gray-800 dark:text-white mt-2 tracking-tight">{value !== undefined ? value : '-'}</p>
        {subtitle && <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default CTODashboard;
