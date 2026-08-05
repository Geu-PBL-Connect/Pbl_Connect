import React, { useState, useEffect } from "react";
import axios from "axios";

const FacultySuperMentorTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPbl, setSelectedPbl] = useState("All");

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
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        Loading Super Mentor Teams...
      </div>
    );
  }

  // Filter PBLs
  const uniquePbls = [...new Map(teams.map((t) => [t.pbl.id, t.pbl])).values()];
  const filteredTeams =
    selectedPbl === "All" ? teams : teams.filter((t) => t.pbl.id === selectedPbl);

  // Metrics
  const totalCount = filteredTeams.length;
  const approvedCount = filteredTeams.filter((t) => t.superMentorStatus === "APPROVED").length;
  const rejectedCount = filteredTeams.filter((t) => t.superMentorStatus === "REJECTED").length;
  const pendingCount = totalCount - approvedCount - rejectedCount;

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Super Mentor Quality Gate
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Independent Quality Assurance: Validate project scope, description, and repository standards before mentors can grade.
          </p>
        </div>

        {uniquePbls.length > 0 && (
          <select
            value={selectedPbl}
            onChange={(e) => setSelectedPbl(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm font-medium"
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Assigned
          </p>
          <p className="text-2xl font-black text-gray-800 dark:text-white mt-1">
            {totalCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
            Pending Validation
          </p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
            Approved
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {approvedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">
            Changes Requested
          </p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
            🛡️
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            No Super Mentored Teams Assigned
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            You do not currently have any teams allocated for Super Mentor quality validation in this PBL.
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
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-purple-700 dark:text-purple-400">
                          {team.teamIdFormatted}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200"
                              : isRejected
                              ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200"
                          }`}
                        >
                          {isApproved ? "✓ APPROVED" : isRejected ? "✕ CHANGES REQUESTED" : "⏳ PENDING REVIEW"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {team.pbl.subject} &bull; Sem {team.pbl.semester}
                      </p>
                    </div>

                    <button
                      onClick={() => setDetailsTeam(team)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800"
                    >
                      Team Info →
                    </button>
                  </div>

                  {/* Core Project Details */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                        Project Title
                      </span>
                      <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                        {team.projectTitle || (
                          <span className="text-gray-400 italic font-normal">
                            Not submitted yet
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                        Project Abstract / Description
                      </span>
                      {team.projectDescription ? (
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 leading-relaxed max-h-32 overflow-y-auto">
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
                      <div className="p-2.5 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-400 block text-[11px] font-semibold">GitHub Repository:</span>
                        {team.githubUrl ? (
                          <a
                            href={team.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-bold truncate block mt-0.5"
                          >
                            🔗 {team.githubUrl}
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">None provided</span>
                        )}
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-gray-400 block text-[11px] font-semibold">Synopsis / PDF:</span>
                        {latestSub?.synopsisUrl ? (
                          <a
                            href={latestSub.synopsisUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-bold truncate block mt-0.5"
                          >
                            📄 View Document
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
                          ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200"
                          : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200"
                      }`}>
                        <strong>Your Feedback:</strong> "{team.superMentorFeedback}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={() => handleOpenReview(team, "APPROVE")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${
                      isApproved
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    ✓ {isApproved ? "Approved (Edit)" : "Approve Project"}
                  </button>

                  <button
                    onClick={() => handleOpenReview(team, "REJECT")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${
                      isRejected
                        ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    ✕ {isRejected ? "Rejected (Edit)" : "Request Changes"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Super Mentor Review: {selectedTeam.teamIdFormatted}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedTeam.projectTitle || "Untitled Project"}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Review Action
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction("APPROVE")}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                      reviewAction === "APPROVE"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>✓</span> Approve Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction("REJECT")}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                      reviewAction === "REJECT"
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>✕</span> Reject / Request Changes
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Feedback / Remarks {reviewAction === "REJECT" && <span className="text-red-500">* (Mandatory)</span>}
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  disabled={reviewLoading}
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-colors ${
                    reviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Team {detailsTeam.teamIdFormatted} Details
              </h3>
              <button
                onClick={() => setDetailsTeam(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>PBL Program:</strong> {detailsTeam.pbl.subject} (Sem {detailsTeam.pbl.semester})
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Assigned Mentor:</strong> {detailsTeam.mentor?.user?.name || "Unassigned"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Team Leader:</strong> {detailsTeam.leader?.user?.name}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-3">
                  Team Members ({detailsTeam.members.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detailsTeam.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                    >
                      <p className="font-bold text-gray-800 dark:text-white text-sm">
                        {member.student?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Roll: {member.student?.enrollmentNumber} &bull; Sec: {member.student?.section}
                      </p>
                      {detailsTeam.leaderId === member.studentId && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded">
                          TEAM LEADER
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
