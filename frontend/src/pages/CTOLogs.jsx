import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Search, Filter, ShieldCheck, Upload, BookOpen, Key, AlertCircle } from 'lucide-react';

const CTOLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const { data } = await axios.get('/api/cto/logs', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setLogs(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionConfig = (action) => {
    switch (action) {
      case 'LOGIN':
        return { icon: <Key size={16} />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'User Login' };
      case 'SUBMITTED':
        return { icon: <Upload size={16} />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Submission' };
      case 'GRADED':
        return { icon: <ShieldCheck size={16} />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Graded' };
      case 'GRADE_EDITED':
        return { icon: <BookOpen size={16} />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Grade Edited' };
      case 'TEAM_GRADED':
        return { icon: <ShieldCheck size={16} />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Team Graded' };
      case 'TEAM_GRADE_EDITED':
        return { icon: <BookOpen size={16} />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Team Grade Edited' };
      default:
        return { icon: <Activity size={16} />, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', label: action };
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchMatch = 
      log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase());
    
    const actionMatch = filterAction === 'ALL' || log.action.includes(filterAction);
    
    return searchMatch && actionMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1c1f58]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex items-center gap-3 shadow-sm">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-[#1c1f58] flex items-center gap-2">
              <Activity className="w-6 h-6" /> System Audit Logs
            </h2>
            <p className="text-gray-500 mt-1">Track comprehensive system activities across the PBL portal.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fbc02d] focus:border-transparent transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 pr-8 py-2 w-full sm:w-48 appearance-none border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fbc02d] focus:border-transparent transition-all outline-none bg-white"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="ALL">All Actions</option>
                <option value="LOGIN">Logins</option>
                <option value="SUBMIT">Submissions</option>
                <option value="GRADE">Evaluations</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-gray-50/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="py-4 px-6 whitespace-nowrap">Timestamp</th>
                  <th className="py-4 px-6 whitespace-nowrap">User</th>
                  <th className="py-4 px-6 whitespace-nowrap">Action Type</th>
                  <th className="py-4 px-6">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-gray-500 font-medium">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      No logs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const config = getActionConfig(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {log.user ? (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {log.user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{log.user.name}</div>
                                <div className="text-xs text-gray-500">{log.user.role}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">System / Unknown</span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          <div className="max-w-md break-words font-mono text-xs bg-gray-50 p-2 rounded border border-gray-100">
                            {log.metadata ? (
                              <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                            ) : (
                              <span className="italic text-gray-400">No additional metadata</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-center text-gray-400 font-medium">
          Showing latest {filteredLogs.length} events (descending order).
        </div>
      </div>
    </div>
  );
};

export default CTOLogs;
