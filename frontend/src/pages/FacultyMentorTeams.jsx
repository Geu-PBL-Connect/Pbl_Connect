import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, X, MapPin, ShieldCheck, ShieldAlert, Shield, 
  MessageSquare, ExternalLink, Lock, RefreshCw, FileText, 
  CheckCircle2, XCircle, AlertTriangle, Users, ArrowRight 
} from 'lucide-react';

const FacultyMentorTeams = () => {
  const [teams, setTeams] = useState([]);
  const [selectedPbl, setSelectedPbl] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedTeamForGrade, setSelectedTeamForGrade] = useState(null);
  const [grade, setGrade] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [gradeLoading, setGradeLoading] = useState(false);
  
  // Venue State
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venue, setVenue] = useState('');
  const [venueLoading, setVenueLoading] = useState(false);

  // Team Details Modal State
  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null);
  
  // Interaction Modal State
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionTeam, setInteractionTeam] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [interactionRecords, setInteractionRecords] = useState({});
  const [interactionTab, setInteractionTab] = useState('history');
  const [interactionLoading, setInteractionLoading] = useState(false);

  const openInteractionModal = (team) => {
    setInteractionTeam(team);
    setShowInteractionModal(true);
    setInteractionTab('history');
    fetchInteractions(team.id);
    
    const initialRecords = {};
    team.members.forEach(m => {
      initialRecords[m.studentId] = { isPresent: true, remark: '' };
    });
    setInteractionRecords(initialRecords);
  };

  const fetchInteractions = async (teamId) => {
    try {
      setInteractionLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get(`/api/faculty/team/${teamId}/interactions`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      setInteractions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleLogInteraction = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const records = Object.keys(interactionRecords).map(studentId => ({
        studentId,
        isPresent: interactionRecords[studentId].isPresent,
        remark: interactionRecords[studentId].remark
      }));

      await axios.post(`/api/faculty/mentor/team/${interactionTeam.id}/interaction`, { records }, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      alert('Interaction logged successfully!');
      fetchInteractions(interactionTeam.id);
      setInteractionTab('history');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log interaction');
    }
  };

  const fetchTeams = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get('/api/faculty/mentor/teams', {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenue = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get('/api/faculty/venue', {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      setVenue(res.data.venue || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateVenue = async (e) => {
    e.preventDefault();
    try {
      setVenueLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.put('/api/faculty/venue', { venue }, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      alert('Venue updated successfully!');
      setShowVenueModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update venue');
    } finally {
      setVenueLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchVenue();
  }, []);

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setGradeLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.post(`/api/faculty/mentor/grade/${selectedSubmission.id}`, {
        grade: parseInt(grade),
        remarks
      }, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      alert('Grade submitted successfully!');
      setSelectedSubmission(null);
      setSelectedTeamForGrade(null);
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit grade');
    } finally {
      setGradeLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Mentored Teams...</div>;

  // Extract unique PBLs for the filter dropdown
  const uniquePbls = [...new Map(teams.map(team => [team.pbl.id, team.pbl])).values()];

  // Filter teams based on selected PBL and Search Query
  const filteredTeams = teams.filter(team => {
    const matchesPbl = selectedPbl === 'All' || team.pbl.id === selectedPbl;
    if (!matchesPbl) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesId = team.teamIdFormatted?.toLowerCase().includes(q);
    const matchesTitle = team.projectTitle?.toLowerCase().includes(q);
    const matchesLeader = team.leader?.user?.name?.toLowerCase().includes(q) || team.leader?.enrollmentNumber?.toLowerCase().includes(q);
    const matchesMember = team.members?.some(m => 
      m.student?.user?.name?.toLowerCase().includes(q) ||
      m.student?.enrollmentNumber?.toLowerCase().includes(q)
    );
    return matchesId || matchesTitle || matchesLeader || matchesMember;
  });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mentored Teams</h2>
          {uniquePbls.length > 0 && (
            <select
              value={selectedPbl}
              onChange={(e) => setSelectedPbl(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="All">All PBLs</option>
              {uniquePbls.map(pbl => (
                <option key={pbl.id} value={pbl.id}>
                  {pbl.subject} (Sem {pbl.semester})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team ID, title, student..."
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
            onClick={() => setShowVenueModal(true)} 
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 shadow-sm flex items-center justify-center gap-2 text-xs shrink-0"
          >
            <MapPin className="w-3.5 h-3.5" /> Set Location / Venue
          </button>
        </div>
      </div>
      
      {filteredTeams.length === 0 ? (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500">{searchQuery ? `No teams matching "${searchQuery}"` : 'No teams found for the selected PBL.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredTeams.map((team) => {
            const isSuperMentorApproved = team.superMentorStatus === 'APPROVED';
            const isSuperMentorRejected = team.superMentorStatus === 'REJECTED';

            return (
              <div key={team.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-primary">{team.teamIdFormatted}</h3>
                      {/* Super Mentor Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isSuperMentorApproved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200'
                          : isSuperMentorRejected
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200'
                      }`}>
                        {isSuperMentorApproved ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : isSuperMentorRejected ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : (
                          <Shield className="w-3.5 h-3.5" />
                        )}
                        {isSuperMentorApproved ? 'Super Mentor: Approved' : isSuperMentorRejected ? 'Super Mentor: Rejected' : 'Super Mentor: Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{team.pbl.subject} (Sem {team.pbl.semester})</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                      Mentor ID: {team.pbl.pblFaculties?.[0]?.mentorIdFormatted || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right text-sm flex flex-col items-end">
                    <p className="font-semibold text-gray-800 dark:text-white">Leader: {team.leader?.user?.name}</p>
                    <p className="text-gray-500 text-xs">{team.members.length} Members</p>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => openInteractionModal(team)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-800 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-lg border border-orange-100 dark:border-orange-800 flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" /> Interaction
                      </button>
                      <button 
                        onClick={() => setSelectedTeamDetails(team)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-1"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Project Title & Repo banner */}
                {team.projectTitle && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700/60 text-xs">
                    <span className="font-bold text-gray-700 dark:text-gray-300 block mb-0.5">Project: {team.projectTitle}</span>
                    {team.githubUrl && (
                      <a href={team.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold">
                        <ExternalLink className="w-3 h-3" /> {team.githubUrl}
                      </a>
                    )}
                  </div>
                )}

                {/* Super Mentor Quality Gate Alert for Mentor */}
                {!isSuperMentorApproved && (
                  <div className={`mb-4 p-3 rounded-xl border text-xs leading-relaxed ${
                    isSuperMentorRejected
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-800 dark:text-red-300'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-800 dark:text-amber-300'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Quality Gate Enforced: {isSuperMentorRejected ? 'Super Mentor Rejected Project' : 'Super Mentor Validation Pending'}</span>
                    </div>
                    <p>
                      {isSuperMentorRejected
                        ? `Super Mentor feedback: "${team.superMentorFeedback || 'Requires revision'}". Mentor grading is locked until student resubmits and receives approval.`
                        : 'Grading is locked until the assigned Super Mentor approves the project title, description, and repository.'}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">Phase Submissions</h4>
                  {team.submissions.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No submissions yet.</p>
                  ) : (
                    team.submissions.map(sub => {
                      const phaseNum = team.pbl.phases?.find(p => p.id === sub.phaseId)?.phaseNumber || '1';
                      const isResubmitted = sub.status === 'PENDING' && sub.mentorGrades && sub.mentorGrades.length > 0;
                      const lastGrade = sub.mentorGrades?.[0];

                      return (
                        <div key={sub.id} className={`p-4 rounded-xl border transition-all ${
                          isResubmitted 
                            ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700/60 shadow-sm' 
                            : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                        } flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-800 dark:text-white text-base">
                                Phase {phaseNum} Submission
                              </span>
                              {isResubmitted ? (
                                <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin" /> Resubmitted
                                </span>
                              ) : sub.status === 'PENDING' ? (
                                <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 rounded-full text-xs font-bold uppercase">
                                  Pending Grade
                                </span>
                              ) : lastGrade && lastGrade.grade === 0 ? (
                                <span className="px-2.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Rejected (Grade 0)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Graded (Approved - Grade 1)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <a href={sub.synopsisUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> Synopsis / Report PDF
                              </a>
                              {sub.fileUrls?.additionalLink && (
                                <a href={sub.fileUrls.additionalLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
                                  <ExternalLink className="w-3.5 h-3.5" /> Project Link
                                </a>
                              )}
                            </div>

                            {(isResubmitted || (lastGrade && lastGrade.grade === 0)) && lastGrade && (
                              <div className="mt-2 p-2.5 bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg text-xs leading-relaxed">
                                <span className="font-bold uppercase text-red-600 dark:text-red-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {isResubmitted ? "Previous Rejection History:" : "Current Rejection Status:"}
                                </span>
                                <strong>Grade:</strong> 0 &bull; <strong>Remarks:</strong> &ldquo;{lastGrade.remarks || 'Needs improvement'}&rdquo;
                              </div>
                            )}

                            {(() => {
                              const mmAssignment = team.examineeAssignments?.find(a => a.phaseId === sub.phaseId);
                              if (!mmAssignment) return null;
                              const evalsCount = mmAssignment.evaluations?.length || 0;
                              const avgScore = evalsCount > 0
                                ? (mmAssignment.evaluations.reduce((sum, ev) => sum + ev.totalMarks, 0) / evalsCount).toFixed(2)
                                : 'Pending';
                              return (
                                <div className="mt-2 text-xs font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 p-2 rounded border border-indigo-100 dark:border-indigo-800 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" /> Peer Review Avg Score: {avgScore} ({evalsCount} reviews)
                                </div>
                              );
                            })()}
                          </div>

                          {/* Grade Action Button */}
                          {isSuperMentorApproved ? (
                            <button 
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setSelectedTeamForGrade(team);
                                setGrade(1);
                                setRemarks('');
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap ${
                                isResubmitted 
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                  : sub.status === 'PENDING'
                                  ? 'bg-primary hover:bg-blue-600 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                              }`}
                            >
                              {isResubmitted ? 'Evaluate Resubmission' : sub.status === 'PENDING' ? 'Grade Now' : 'Edit Grade'}
                            </button>
                          ) : (
                            <button 
                              disabled
                              title="Grading is locked until Super Mentor approves project details"
                              className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-xl text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" /> Grade Locked
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Venue Modal */}
      {showVenueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Set Your Venue</h3>
            <p className="text-sm text-gray-500 mb-4">This location will be visible to your assigned students.</p>
            <form onSubmit={handleUpdateVenue}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Venue / Cabin / Location</label>
                <input 
                  type="text" 
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Lab 4, Cabin 201..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowVenueModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button disabled={venueLoading} type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">
                  {venueLoading ? 'Saving...' : 'Save Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interaction Modal */}
      {showInteractionModal && interactionTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Interactions - Team {interactionTeam.teamIdFormatted}
              </h3>
              <button onClick={() => setShowInteractionModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">✕</button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button 
                onClick={() => setInteractionTab('history')} 
                className={`py-2 px-4 font-bold text-sm border-b-2 transition-colors ${
                  interactionTab === 'history' 
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Interaction History ({interactions.length})
              </button>
              <button 
                onClick={() => setInteractionTab('log')} 
                className={`py-2 px-4 font-bold text-sm border-b-2 transition-colors ${
                  interactionTab === 'log' 
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                + Log New Interaction
              </button>
            </div>

            {interactionTab === 'history' ? (
              <div className="space-y-4">
                {interactionLoading ? (
                  <p className="text-center text-gray-500 py-4">Loading interactions...</p>
                ) : interactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 italic">No interactions logged yet.</p>
                ) : (
                  interactions.map((interaction) => (
                    <div key={interaction.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2">
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Logged by: {interaction.faculty?.user?.name}</span>
                        <span>{new Date(interaction.createdAt).toLocaleDateString()} at {new Date(interaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="space-y-1">
                        {interaction.records.map((r) => (
                          <div key={r.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {r.student?.user?.name} ({r.student?.enrollmentNumber})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                r.isPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {r.isPresent ? 'Present' : 'Absent'}
                              </span>
                              {r.remark && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  "{r.remark}"
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleLogInteraction} className="space-y-4">
                <p className="text-xs text-gray-500">Record attendance and remarks for each member during this interaction session.</p>
                <div className="space-y-3">
                  {interactionTeam.members.map((member) => (
                    <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-gray-800 dark:text-white">
                          {member.student?.user?.name} ({member.student?.enrollmentNumber})
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={interactionRecords[member.studentId]?.isPresent || false}
                            onChange={(e) => setInteractionRecords(prev => ({
                              ...prev,
                              [member.studentId]: { ...prev[member.studentId], isPresent: e.target.checked }
                            }))}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Present</span>
                        </label>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Remarks for this student..." 
                        value={interactionRecords[member.studentId]?.remark || ''}
                        onChange={(e) => setInteractionRecords(prev => ({
                          ...prev,
                          [member.studentId]: { ...prev[member.studentId], remark: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => setInteractionTab('history')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">Save Interaction</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeamDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Team {selectedTeamDetails.teamIdFormatted}</h3>
              <button onClick={() => setSelectedTeamDetails(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">✕</button>
            </div>
            
            <div className="space-y-6">
              {/* Project & Super Mentor Details */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2">
                <h4 className="font-bold text-gray-800 dark:text-white mb-2">Project & Validation Details</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Subject:</strong> {selectedTeamDetails.pbl.subject} (Sem {selectedTeamDetails.pbl.semester})</p>
                <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Leader:</strong> {selectedTeamDetails.leader?.user?.name}</p>
                {selectedTeamDetails.projectTitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Project Title:</strong> {selectedTeamDetails.projectTitle}</p>
                )}
                {selectedTeamDetails.projectDescription && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600">
                    <strong>Abstract:</strong> {selectedTeamDetails.projectDescription}
                  </div>
                )}
                {selectedTeamDetails.githubUrl && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>GitHub:</strong>{" "}
                    <a href={selectedTeamDetails.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedTeamDetails.githubUrl}
                    </a>
                  </p>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between text-xs">
                  <span><strong>Super Mentor:</strong> {selectedTeamDetails.superMentor?.user?.name || 'Not assigned'}</span>
                  <span className="font-bold">Status: {selectedTeamDetails.superMentorStatus || 'PENDING'}</span>
                </div>
                {selectedTeamDetails.superMentorFeedback && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <strong>Super Mentor Remarks:</strong> {selectedTeamDetails.superMentorFeedback}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-3">Team Members ({selectedTeamDetails.members.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedTeamDetails.members.map((member) => (
                    <div key={member.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                      <p className="font-bold text-gray-800 dark:text-white">{member.student?.user?.name}</p>
                      <p className="text-sm text-gray-500">Roll No: {member.student?.enrollmentNumber}</p>
                      <p className="text-sm text-gray-500">Section: {member.student?.section}</p>
                      {selectedTeamDetails.leaderId === member.studentId && (
                        <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">TEAM LEADER</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Grade Submission</h3>
            
            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grade</label>
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 - Approved</option>
                  <option value={0}>0 - Needs Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remarks</label>
                <textarea 
                  rows="3"
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide feedback..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setSelectedSubmission(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button disabled={gradeLoading} type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-sm">
                  {gradeLoading ? 'Submitting...' : 'Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyMentorTeams;
