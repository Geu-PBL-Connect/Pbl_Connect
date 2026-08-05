import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  FileText,
  Users,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  Layers,
  Search,
} from "lucide-react";

const FacultySuperMentorTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPbl, setSelectedPbl] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Modal State
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [reviewAction, setReviewAction] = useState("APPROVE");
  const [feedback, setFeedback] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Team Details Modal State
  const [detailsTeam, setDetailsTeam] = useState(null);

  useEffect(() => {
    fetchSuperMentoredTeams();
  }, []);

  const fetchSuperMentoredTeams = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const res = await axios.get("/api/faculty/super-mentor/teams", {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (team, action = "APPROVE") => {
    setSelectedTeam(team);
    setReviewAction(action);
    setFeedback(team.superMentorFeedback || "");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewAction === "REJECT" && (!feedback || !feedback.trim())) {
      alert("Please provide detailed feedback explaining why the project was rejected.");
      return;
    }

    try {
      setReviewLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      await axios.post(
        `/api/faculty/super-mentor/review/${selectedTeam.id}`,
        {
          action: reviewAction,
          feedback: feedback.trim(),
        },
        {
          headers: { Authorization: `Bearer ${userInfo?.token}` },
        }
      );

      alert(`Team ${selectedTeam.teamIdFormatted} project has been ${reviewAction === "APPROVE" ? "approved" : "rejected"}!`);
      setSelectedTeam(null);
      fetchSuperMentoredTeams();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        Loading Super Mentor Teams...
      </div>
    );
  }

  // Filter PBLs & Search Query
  const uniquePbls = [...new Map(teams.map((t) => [t.pbl.id, t.pbl])).values()];
  const filteredTeams = teams.filter((t) => {
    const matchesPbl = selectedPbl === "All" || t.pbl.id === selectedPbl;
    if (!matchesPbl) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesId = t.teamIdFormatted?.toLowerCase().includes(q);
    const matchesTitle = t.projectTitle?.toLowerCase().includes(q);
    const matchesLeader = t.leader?.user?.name?.toLowerCase().includes(q) || t.leader?.enrollmentNumber?.toLowerCase().includes(q);
    const matchesMember = t.members?.some((m) =>
      m.student?.user?.name?.toLowerCase().includes(q) ||
      m.student?.enrollmentNumber?.toLowerCase().includes(q)
    );
    return matchesId || matchesTitle || matchesLeader || matchesMember;
  });

  // Metrics
  const totalCount = filteredTeams.length;
  const approvedCount = filteredTeams.filter((t) => t.superMentorStatus === "APPROVED").length;
  const rejectedCount = filteredTeams.filter((t) => t.superMentorStatus === "REJECTED").length;
  const pendingCount = totalCount - approvedCount - rejectedCount;

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Super Mentor Quality Gate
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Validate project scope, description, and repository standards before mentors can grade.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team, project, student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {uniquePbls.length > 0 && (
            <select
              value={selectedPbl}
              onChange={(e) => setSelectedPbl(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs font-semibold shrink-0"
            >
              <option value="All">All PBL Programs</option>
              {uniquePbls.map((pbl) => (
                <option key={pbl.id} value={pbl.id}>
                  {pbl.subject} (Sem {pbl.semester})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Assigned
            </span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {totalCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {approvedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Changes Requested
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {searchQuery ? `No teams matching "${searchQuery}"` : "No Super Mentored Teams Assigned"}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? "Try adjusting your search criteria or clear the search input."
              : "You do not currently have any teams allocated for Super Mentor quality validation in this PBL."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTeams.map((team) => {
            const status = team.superMentorStatus || "PENDING";
            const isApproved = status === "APPROVED";
            const isRejected = status === "REJECTED";
            const latestSub = team.submissions?.[0];

            return (
              <div
                key={team.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs p-6 flex flex-col justify-between hover:border-indigo-200 transition-colors"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {team.teamIdFormatted}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : isRejected
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-3 h-3" />}
                          {isRejected && <XCircle className="w-3 h-3" />}
                          {!isApproved && !isRejected && <Clock className="w-3 h-3" />}
                          {isApproved ? "Approved" : isRejected ? "Changes Requested" : "Pending Review"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {team.pbl.subject} &bull; Sem {team.pbl.semester}
                      </p>
                    </div>

                    <button
                      onClick={() => setDetailsTeam(team)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-1"
                    >
                      Team Details
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Core Project Details */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                        Project Title
                      </span>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                        {team.projectTitle || (
                          <span className="text-gray-400 italic font-normal">
                            Not submitted yet
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                        Project Abstract / Description
                      </span>
                      {team.projectDescription ? (
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-200 dark:border-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                          {team.projectDescription}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic mt-0.5">
                          No description provided yet.
                        </p>
                      )}
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                        <span className="text-gray-400 block text-[11px] font-medium">GitHub Repository:</span>
                        {team.githubUrl ? (
                          <a
                            href={team.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold truncate block mt-0.5 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{team.githubUrl}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">None provided</span>
                        )}
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                        <span className="text-gray-400 block text-[11px] font-medium">Synopsis / PDF:</span>
                        {latestSub?.synopsisUrl ? (
                          <a
                            href={latestSub.synopsisUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold truncate block mt-0.5 flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 shrink-0" />
                            <span>View Document</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">No document uploaded</span>
                        )}
                      </div>
                    </div>

                    {/* Regular Mentor info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span><strong>Regular Mentor:</strong> {team.mentor?.user?.name || "Unassigned"}</span>
                      <span><strong>Leader:</strong> {team.leader?.user?.name || "N/A"}</span>
                    </div>

                    {/* Review Feedback history */}
                    {team.superMentorFeedback && (
                      <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isRejected
                          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}>
                        <strong>Feedback Given:</strong> "{team.superMentorFeedback}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={() => handleOpenReview(team, "APPROVE")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      isApproved
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isApproved ? "Approved (Edit)" : "Approve Project"}
                  </button>

                  <button
                    onClick={() => handleOpenReview(team, "REJECT")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      isRejected
                        ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    {isRejected ? "Rejected (Edit)" : "Request Changes"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Super Mentor Review: {selectedTeam.teamIdFormatted}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedTeam.projectTitle || "Untitled Project"}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Review Action
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction("APPROVE")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                      reviewAction === "APPROVE"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction("REJECT")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                      reviewAction === "REJECT"
                        ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Request Changes
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Feedback / Remarks {reviewAction === "REJECT" && <span className="text-rose-500">* (Mandatory)</span>}
                </label>
                <textarea
                  rows={4}
                  required={reviewAction === "REJECT"}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    reviewAction === "REJECT"
                      ? "Explain the shortcomings or scope issues clearly so the student team and mentor can address them..."
                      : "Optional remarks or commendations for the project scope..."
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={reviewLoading}
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-semibold text-xs text-white shadow-xs transition-colors ${
                    reviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {reviewLoading ? "Saving..." : `Confirm ${reviewAction === "APPROVE" ? "Approval" : "Rejection"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsTeam && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Team {detailsTeam.teamIdFormatted} Details
              </h3>
              <button
                onClick={() => setDetailsTeam(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1.5 text-xs">
                <p className="text-gray-600 dark:text-gray-300">
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">PBL Program:</strong> {detailsTeam.pbl.subject} (Sem {detailsTeam.pbl.semester})
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">Assigned Mentor:</strong> {detailsTeam.mentor?.user?.name || "Unassigned"}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong className="font-semibold text-gray-800 dark:text-gray-200">Team Leader:</strong> {detailsTeam.leader?.user?.name}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
                  Team Members ({detailsTeam.members.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {detailsTeam.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-xs"
                    >
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {member.student?.user?.name}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Roll: {member.student?.enrollmentNumber} &bull; Sec: {member.student?.section}
                      </p>
                      {detailsTeam.leaderId === member.studentId && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold rounded-md">
                          Team Leader
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultySuperMentorTeams;
