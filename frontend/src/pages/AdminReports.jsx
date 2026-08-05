import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Search, X, FileSpreadsheet, Users, UserCheck, ShieldCheck, ClipboardCheck, Download } from 'lucide-react';

const AdminReports = () => {
  const [pbls, setPbls] = useState([]);
  const [selectedPbl, setSelectedPbl] = useState('');
  const [teams, setTeams] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [marksData, setMarksData] = useState([]);
  const [activeMarksPhase, setActiveMarksPhase] = useState(1);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const [pblRes, facRes] = await Promise.all([
          axios.get('/api/admin/pbl', { headers: { Authorization: `Bearer ${userInfo.token}` } }),
          axios.get('/api/admin/faculty', { headers: { Authorization: `Bearer ${userInfo.token}` } })
        ]);
        setPbls(pblRes.data);
        setFacultyList(facRes.data);
      } catch (err) {
        console.error('Error fetching data', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedPbl) {
      setTeams([]);
      setMarksData([]);
      return;
    }
    const fetchTeamsAndMarks = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const [teamsRes, marksRes] = await Promise.all([
          axios.get(`/api/admin/teams/pbl/${selectedPbl}`, {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          }),
          axios.get(`/api/admin/reports/marks/${selectedPbl}`, {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          })
        ]);
        setTeams(teamsRes.data);
        setMarksData(marksRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamsAndMarks();
  }, [selectedPbl]);

  const activePblDetails = pbls.find(p => p.id === selectedPbl);
  const activePhases = activePblDetails?.phases || [];

  const handleExportMentors = () => {
    if (teams.length === 0) return alert('No teams found for this PBL.');
    const mentorData = teams.map(t => ({
      'Team ID': t.teamIdFormatted,
      'Leader': t.leader?.user?.name || 'N/A',
      'Mentor ID': t.mentor?.pblFaculties?.[0]?.mentorIdFormatted || 'N/A',
      'Mentor Name': t.mentor?.user?.name || 'Unassigned'
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mentorData), 'Mentors');
    XLSX.writeFile(wb, `${activePblDetails?.subjectShort}_Mentors.xlsx`);
  };

  const handleExportEvaluators = (phase) => {
    if (teams.length === 0) return alert('No teams found for this PBL.');
    const phaseData = teams.map(t => {
      const pe = t.phaseEvaluators?.find(p => p.phaseId === phase.id);
      return {
        'Team ID': t.teamIdFormatted,
        'Leader': t.leader?.user?.name || 'N/A',
        'Evaluator ID': pe?.evaluator?.pblFaculties?.[0]?.evaluatorIdFormatted || 'N/A',
        'Evaluator Name': pe?.evaluator?.user?.name || 'Unassigned',
        'Evaluator Venue': pe?.evaluator?.venue || '',
        'Evaluation Time': pe?.evaluationTime || ''
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(phaseData), `Phase_${phase.phaseNumber}_Evaluators`);
    XLSX.writeFile(wb, `${activePblDetails?.subjectShort}_Phase_${phase.phaseNumber}_Evaluators.xlsx`);
  };

  const handleExportTeams = () => {
    if (teams.length === 0) return alert('No teams found for this PBL.');
    const teamData = [];
    teams.forEach(t => {
      t.members.forEach(m => {
        teamData.push({
          'Team ID': t.teamIdFormatted,
          'Leader Name': t.leader?.user?.name || 'N/A',
          'Student Name': m.student?.user?.name || 'N/A',
          'Roll Number': m.student?.enrollmentNumber || 'N/A',
          'Section': m.student?.section || 'N/A',
          'Role': t.leaderId === m.student?.id ? 'Leader' : 'Member'
        });
      });
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teamData), 'Teams_And_Members');
    XLSX.writeFile(wb, `${activePblDetails?.subjectShort}_Teams.xlsx`);
  };

  const handleExportSuperMentors = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get(`/api/admin/reports/super-mentor/${selectedPbl}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      const teamsData = res.data.teams || [];
      if (teamsData.length === 0) {
        return alert('No Super Mentor data found for this PBL.');
      }

      const exportData = teamsData.map(t => ({
        'Team ID': t.teamIdFormatted,
        'Project Title': t.projectTitle || 'N/A',
        'Project Description': t.projectDescription || 'N/A',
        'GitHub URL': t.githubUrl || 'N/A',
        'Leader Name': t.leader?.user?.name || 'N/A',
        'Regular Mentor': t.mentor?.user?.name || 'Unassigned',
        'Super Mentor Name': t.superMentor?.user?.name || 'Unassigned',
        'Super Mentor Status': t.superMentorStatus || 'PENDING',
        'Super Mentor Feedback': t.superMentorFeedback || 'N/A'
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Super_Mentor_Validation');
      XLSX.writeFile(wb, `${activePblDetails?.subjectShort}_Super_Mentor_Report.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Failed to export Super Mentor report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarks = (phaseNum) => {
    if (marksData.length === 0) return alert('No marks data found for this PBL.');
    
    const exportData = marksData.map(m => {
       const pd = m.phases[phaseNum] || {};
       const row = {
         'Team ID': m.teamIdFormatted,
         'Enrollment No': m.enrollmentNumber,
         'Student Name': m.name,
         'Section': m.section,
         'Project Level': m.projectLevel || 'N/A',
         'Mentor Grade': pd.mentorGrade === 1 ? 'Approved' : pd.mentorGrade === 0 ? 'Needs Revision' : 'Pending',
         'Mentor Remarks': pd.mentorRemarks || 'N/A'
       };

       if (pd.evaluatorMarksData) {
         Object.keys(pd.evaluatorMarksData).forEach(crit => {
            row[`Criteria: ${crit}`] = pd.evaluatorMarksData[crit];
         });
       }

       row['Evaluator Total Marks'] = pd.evaluatorTotalMarks !== null ? pd.evaluatorTotalMarks : 'N/A';
       row['Evaluator Remarks'] = pd.evaluatorRemarks || 'N/A';

       return row;
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), `Phase_${phaseNum}_Marks`);
    XLSX.writeFile(wb, `${activePblDetails?.subjectShort}_Phase_${phaseNum}_Marks.xlsx`);
  };

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reports & Export</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Export specific lists and audit data to Excel for offline analysis.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select PBL</label>
        <select 
          value={selectedPbl} 
          onChange={(e) => setSelectedPbl(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">-- Select a PBL to view reports --</option>
          {pbls.map(p => (
            <option key={p.id} value={p.id}>{p.subject} ({p.subjectShort} - Sem {p.semester})</option>
          ))}
        </select>
      </div>

      {selectedPbl && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Teams & Members Report */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Teams & Members</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 mb-6">Export a detailed list of all teams and their individual members.</p>
            <button 
              disabled={loading}
              onClick={handleExportTeams}
              className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Excel
            </button>
          </div>

          {/* Mentors Report */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Mentor Allocations</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 mb-6">Export the assignment mapping of teams to mentors.</p>
            <button 
              disabled={loading}
              onClick={handleExportMentors}
              className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Excel
            </button>
          </div>

          {/* Super Mentor Quality Gate Report */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-purple-200 dark:border-purple-800 flex flex-col h-full hover:shadow-md transition-shadow group bg-purple-50/20">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-purple-950 dark:text-purple-200 mb-2">Super Mentor Validation</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 mb-6">Export validation status, project titles, GitHub URLs, and remarks for all teams.</p>
            <button 
              disabled={loading}
              onClick={handleExportSuperMentors}
              className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Excel
            </button>
          </div>

          {/* Evaluator Reports (Dynamic) */}
          {activePhases.map(phase => (
            <div key={phase.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Phase {phase.phaseNumber} Evaluators</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 mb-6">Export evaluator mappings for Phase {phase.phaseNumber}.</p>
              <button 
                disabled={loading}
                onClick={() => handleExportEvaluators(phase)}
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Excel
              </button>
            </div>
          ))}

        </div>
      )}

      {selectedPbl && marksData.length > 0 && (
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 gap-4">
             <div>
               <h3 className="text-xl font-bold text-gray-800 dark:text-white">Student Marks Overview</h3>
               <p className="text-xs text-gray-500">View and export marks for each phase</p>
             </div>
             <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
               {[1, 2, 3].map(p => (
                 <button
                   key={p}
                   onClick={() => setActiveMarksPhase(p)}
                   className={`flex-1 sm:flex-none px-5 py-2 rounded-md text-sm font-bold transition-colors ${
                     activeMarksPhase === p ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                   }`}
                 >
                   Phase {p}
                 </button>
               ))}
             </div>
           </div>
           
           <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Team ID, Student, Roll No, Section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button 
                onClick={() => handleExportMarks(activeMarksPhase)}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all w-full sm:w-auto justify-center text-xs shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Phase {activeMarksPhase} Marks to Excel
              </button>
           </div>
           
           <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-300">
                 <tr>
                   <th className="px-5 py-4">Team</th>
                   <th className="px-5 py-4">Student</th>
                   <th className="px-5 py-4">Roll No</th>
                   <th className="px-5 py-4">Section</th>
                   <th className="px-5 py-4">Project Level</th>
                   <th className="px-5 py-4">Mentor Status</th>
                   <th className="px-5 py-4">Evaluator Marks</th>
                 </tr>
               </thead>
               <tbody>
                 {marksData
                   .filter(m => {
                     if (!searchQuery.trim()) return true;
                     const q = searchQuery.toLowerCase();
                     return (
                       m.teamIdFormatted?.toLowerCase().includes(q) ||
                       m.name?.toLowerCase().includes(q) ||
                       m.enrollmentNumber?.toLowerCase().includes(q) ||
                       m.section?.toLowerCase().includes(q) ||
                       m.projectLevel?.toLowerCase().includes(q)
                     );
                   })
                   .map((m, idx) => {
                   const pd = m.phases[activeMarksPhase];
                   return (
                     <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                       <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400">{m.teamIdFormatted}</td>
                       <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{m.name}</td>
                       <td className="px-5 py-4 text-gray-500">{m.enrollmentNumber}</td>
                       <td className="px-5 py-4 text-gray-500">{m.section}</td>
                       <td className="px-5 py-4">
                        {m.projectLevel && m.projectLevel !== 'N/A' ? (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-bold whitespace-nowrap">
                            {m.projectLevel}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                       </td>
                       <td className="px-5 py-4">
                         {pd?.mentorGrade === 1 ? <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Approved</span> 
                          : pd?.mentorGrade === 0 ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase">Rejected</span> 
                          : <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold uppercase">Pending</span>}
                       </td>
                       <td className="px-5 py-4 font-black text-gray-800 dark:text-gray-200">
                         {pd?.evaluatorTotalMarks !== null ? (
                            pd.evaluatorTotalMarks === 0 && Object.values(pd.evaluatorMarksData || {}).includes('AB') ? (
                              <div className="flex items-center space-x-3">
                                <span className="text-red-500 font-bold">AB (Absent)</span>
                              </div>
                            ) : pd.evaluatorTotalMarks
                          ) : <span className="text-gray-400 font-normal italic">Not Evaluated</span>}
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
