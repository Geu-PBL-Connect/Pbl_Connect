import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  SlidersHorizontal,
  Users,
  Sparkles,
  ExternalLink,
  FileText,
  Check,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";

const AdminSuperMentor = () => {
  const [pbls, setPbls] = useState([]);
  const [selectedPblId, setSelectedPblId] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("monitor"); // 'monitor' | 'allocation'

  // Allocation State
  const [selectedSuperMentorIds, setSelectedSuperMentorIds] = useState([]);
  const [teamAssignments, setTeamAssignments] = useState({});
  const [savingAllocation, setSavingAllocation] = useState(false);

  // Override Modal State
  const [overrideTeam, setOverrideTeam] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState("APPROVED");
  const [overrideFeedback, setOverrideFeedback] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPblId) {
      setSelectedSuperMentorIds([]);
      fetchPblTeams(selectedPblId);
      fetchFacultiesForPbl(selectedPblId);
    } else {
      setTeams([]);
      setFacultyList([]);
      setSelectedSuperMentorIds([]);
    }
  }, [selectedPblId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

      const pblRes = await axios.get("/api/admin/pbl", config);
      setPbls(pblRes.data);

      if (pblRes.data.length > 0) {
        const firstPblId = pblRes.data[0].id;
        setSelectedPblId(firstPblId);
        await fetchFacultiesForPbl(firstPblId);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultiesForPbl = async (pblId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const res = await axios.get(`/api/admin/faculty?pblId=${pblId}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      setFacultyList(res.data);
    } catch (err) {
      console.error("Error fetching faculties for PBL:", err);
    }
  };

  const fetchPblTeams = async (pblId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const res = await axios.get(`/api/admin/super-mentor/teams/${pblId}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      setTeams(res.data);

      // Populate assignment mapping
      const mapping = {};
      res.data.forEach((t) => {
        mapping[t.id] = t.superMentorId || "";
      });
      setTeamAssignments(mapping);
    } catch (err) {
      console.error("Error fetching teams for PBL:", err);
    }
  };

  const handleAutoDistribute = async () => {
    if (selectedSuperMentorIds.length === 0) {
      alert("Please select at least one Faculty member to act as Super Mentor.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to equally distribute all ${teams.length} teams across ${selectedSuperMentorIds.length} selected Super Mentor(s)?`
      )
    ) {
      return;
    }

    try {
      setSavingAllocation(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const res = await axios.post(
        "/api/admin/super-mentor/assign",
        {
          pblId: selectedPblId,
          facultyIds: selectedSuperMentorIds,
          autoDistribute: true,
        },
        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      );

      alert(res.data.message || "Super Mentors distributed successfully!");
      fetchPblTeams(selectedPblId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to auto-distribute Super Mentors");
    } finally {
      setSavingAllocation(false);
    }
  };

  const handleSaveIndividualAssignments = async () => {
    try {
      setSavingAllocation(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const assignments = Object.keys(teamAssignments).map((teamId) => ({
        teamId,
        facultyId: teamAssignments[teamId] || null,
      }));

      const res = await axios.post(
        "/api/admin/super-mentor/assign",
        { assignments },
        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      );

      alert(res.data.message || "Super Mentor assignments updated!");
      fetchPblTeams(selectedPblId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update assignments");
    } finally {
      setSavingAllocation(false);
    }
  };

  const handleOpenOverride = (team) => {
    setOverrideTeam(team);
    setOverrideStatus(team.superMentorStatus || "APPROVED");
    setOverrideFeedback(team.superMentorFeedback || "");
  };

  const handleSubmitOverride = async (e) => {
    e.preventDefault();
    try {
      setOverrideLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const res = await axios.post(
        `/api/admin/super-mentor/override/${overrideTeam.id}`,
        {
          status: overrideStatus,
          feedback: overrideFeedback.trim(),
        },
        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      );

      alert(res.data.message || "Team status overridden!");
      setOverrideTeam(null);
      fetchPblTeams(selectedPblId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to override review");
    } finally {
      setOverrideLoading(false);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const status = t.superMentorStatus || "PENDING";
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && status === "PENDING") ||
      (statusFilter === "APPROVED" && status === "APPROVED") ||
      (statusFilter === "REJECTED" && status === "REJECTED");

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      t.teamIdFormatted?.toLowerCase().includes(query) ||
      t.leader?.user?.name?.toLowerCase().includes(query) ||
      t.projectTitle?.toLowerCase().includes(query) ||
      t.mentor?.user?.name?.toLowerCase().includes(query) ||
      t.superMentor?.user?.name?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const totalTeams = teams.length;
  const approvedCount = teams.filter((t) => t.superMentorStatus === "APPROVED").length;
  const rejectedCount = teams.filter((t) => t.superMentorStatus === "REJECTED").length;
  const pendingCount = totalTeams - approvedCount - rejectedCount;

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        Loading Super Mentor Management Module...
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Super Mentor Quality Gate Management
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Allocate Super Mentors, monitor validation metrics, and manage quality reviews.
              </p>
            </div>
          </div>
        </div>

        {/* PBL Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Select PBL:
          </label>
          <select
            value={selectedPblId}
            onChange={(e) => setSelectedPblId(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          >
            {pbls.map((p) => (
              <option key={p.id} value={p.id}>
                {p.subject} (Sem {p.semester})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Teams</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalTeams}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{pendingCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{approvedCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{rejectedCount}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("monitor")}
          className={`py-3 px-6 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "monitor"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Quality Gate Monitor ({totalTeams})
        </button>

        <button
          onClick={() => setActiveTab("allocation")}
          className={`py-3 px-6 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "allocation"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Allocation & Auto-Distribution
        </button>
      </div>

      {/* Tab 1: Live Monitor */}
      {activeTab === "monitor" && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase">Status:</span>
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === st
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team, leader, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-72 pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Teams Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Team ID</th>
                    <th className="p-4">Project Title & Repo</th>
                    <th className="p-4">Leader & Members</th>
                    <th className="p-4">Regular Mentor</th>
                    <th className="p-4">Super Mentor</th>
                    <th className="p-4">Validation Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        No teams match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => {
                      const status = team.superMentorStatus || "PENDING";
                      const isApproved = status === "APPROVED";
                      const isRejected = status === "REJECTED";

                      return (
                        <tr key={team.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                            {team.teamIdFormatted}
                          </td>
                          <td className="p-4 max-w-xs">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {team.projectTitle || <span className="text-gray-400 font-normal italic">Not submitted</span>}
                            </p>
                            {team.githubUrl && (
                              <a
                                href={team.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-0.5 font-medium"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Repository
                              </a>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {team.leader?.user?.name || "N/A"}
                            </p>
                            <p className="text-gray-400 text-[11px]">{team.members.length} members</p>
                          </td>
                          <td className="p-4 text-gray-700 dark:text-gray-300">
                            {team.mentor?.user?.name || <span className="text-gray-400 italic">Unassigned</span>}
                          </td>
                          <td className="p-4 font-medium text-gray-900 dark:text-white">
                            {team.superMentor?.user?.name ? (
                              <span className="inline-flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {team.superMentor.user.name}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-normal italic">Not allocated</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
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
                              {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                            </span>
                            {team.superMentorFeedback && (
                              <p className="text-[10px] text-gray-500 mt-1 truncate italic">
                                "{team.superMentorFeedback}"
                              </p>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleOpenOverride(team)}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold text-xs transition-colors"
                            >
                              Override
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Allocation & Auto-Distribution */}
      {activeTab === "allocation" && (
        <div className="space-y-6">
          {/* Auto-Distribution Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Equal Auto-Distribution (Round Robin)
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select the faculty members who will serve as Super Mentors for this PBL. The system will evenly divide all {teams.length} teams among the selected faculty.
            </p>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Select Super Mentor Faculty ({selectedSuperMentorIds.length} of {facultyList.length} selected):
                </label>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  Showing faculties assigned to this PBL
                </span>
              </div>

              {facultyList.length === 0 ? (
                <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-center">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <p className="font-semibold text-amber-900 dark:text-amber-300 text-sm">
                    No faculty members are assigned to this PBL yet.
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Please go to the <strong className="font-semibold">Faculty & Allocation</strong> tab to assign faculty members to this PBL first before allocating Super Mentors.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700">
                  {facultyList.map((faculty) => {
                    const isSelected = selectedSuperMentorIds.includes(faculty.id);
                    return (
                      <label
                        key={faculty.id}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuperMentorIds([...selectedSuperMentorIds, faculty.id]);
                            } else {
                              setSelectedSuperMentorIds(
                                selectedSuperMentorIds.filter((id) => id !== faculty.id)
                              );
                            }
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                        <div className="truncate">
                          <p className="truncate font-semibold">{faculty.user?.name || faculty.designation || "Faculty"}</p>
                          {faculty.department && (
                            <p className="text-[10px] text-gray-400 truncate">{faculty.department}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAutoDistribute}
                disabled={savingAllocation || selectedSuperMentorIds.length === 0 || teams.length === 0}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${savingAllocation ? "animate-spin" : ""}`} />
                Auto-Distribute {teams.length} Teams
              </button>
              <button
                onClick={() =>
                  setSelectedSuperMentorIds(facultyList.map((f) => f.id))
                }
                disabled={facultyList.length === 0}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-xs hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Select All ({facultyList.length})
              </button>
              <button
                onClick={() => setSelectedSuperMentorIds([])}
                disabled={selectedSuperMentorIds.length === 0}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-xs hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Manual Assignment Table */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Manual Team Allocation
                </h3>
                <p className="text-xs text-gray-500">Fine-tune individual Super Mentor mappings per team.</p>
              </div>

              <button
                onClick={handleSaveIndividualAssignments}
                disabled={savingAllocation}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors"
              >
                {savingAllocation ? "Saving..." : "Save Manual Assignments"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Team ID</th>
                    <th className="p-3">Project Title</th>
                    <th className="p-3">Regular Mentor</th>
                    <th className="p-3">Assign Super Mentor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                        {team.teamIdFormatted}
                      </td>
                      <td className="p-3 max-w-xs font-medium text-gray-800 dark:text-white truncate">
                        {team.projectTitle || <span className="text-gray-400 italic">Untitled</span>}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        {team.mentor?.user?.name || "Unassigned"}
                      </td>
                      <td className="p-3">
                        <select
                          value={teamAssignments[team.id] || ""}
                          onChange={(e) =>
                            setTeamAssignments({
                              ...teamAssignments,
                              [team.id]: e.target.value,
                            })
                          }
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option value="">-- No Super Mentor --</option>
                          {facultyList.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.user?.name || "Faculty"} ({f.department || "Dept"})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Override Modal */}
      {overrideTeam && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Admin Override: {overrideTeam.teamIdFormatted}
              </h3>
              <button
                onClick={() => setOverrideTeam(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Override Status
                </label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="APPROVED">APPROVED (Unlock Mentor Grading)</option>
                  <option value="REJECTED">REJECTED (Require Student Revision)</option>
                  <option value="PENDING">PENDING (Reset to Awaiting Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Admin Remarks / Notes
                </label>
                <textarea
                  rows="3"
                  value={overrideFeedback}
                  onChange={(e) => setOverrideFeedback(e.target.value)}
                  placeholder="Optional admin justification..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideTeam(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-xs hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors"
                >
                  {overrideLoading ? "Saving..." : "Apply Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSuperMentor;
