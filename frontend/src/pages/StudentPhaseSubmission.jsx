import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { openPrivateFile } from "../utils/fileViewer";
import { 
  ShieldCheck, ShieldAlert, Shield, Clock, CheckCircle2, 
  AlertTriangle, FileText, Lock, ExternalLink, RefreshCw, 
  Edit, Users, GitBranch, Sparkles, Layers 
} from "lucide-react";

const StudentPhaseSubmission = () => {
  const { phaseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("teamId");
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);

  // Form states
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [technologyStack, setTechnologyStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const isPhase1 = parseInt(phaseId) === 1;

  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = countWords(projectDescription);

  useEffect(() => {
    fetchTeamAndSubmission();
  }, [phaseId]);

  const fetchTeamAndSubmission = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const teamRes = await axios.get("/api/student/team/my-team", {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });

      const teamsArray = teamRes.data;
      const currentTeam = teamId
        ? teamsArray.find((t) => t.id === teamId)
        : teamsArray[0];

      if (currentTeam) {
        setTeam(currentTeam);
        setProjectTitle(currentTeam.projectTitle || "");
        setProjectDescription(currentTeam.projectDescription || "");
        setTechnologyStack(currentTeam.technologyStack || "");
        setGithubUrl(currentTeam.githubUrl || "");

        const subRes = await axios.get(
          `/api/student/team/${currentTeam.id}/phase/${phaseId}`,
          {
            headers: { Authorization: `Bearer ${userInfo?.token}` },
          },
        );
        if (subRes.data) {
          setSubmission(subRes.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPhase1) {
      if (!projectTitle.trim()) {
        alert("Project Title is required for Phase 1.");
        return;
      }
      if (!projectDescription.trim()) {
        alert("Project Description is required for Phase 1.");
        return;
      }
      if (wordCount > 250) {
        alert(`Project description exceeds the maximum limit of 250 words (current: ${wordCount}). Please summarize it.`);
        return;
      }
      if (!technologyStack.trim()) {
        alert("Technology Stack is required for Phase 1.");
        return;
      }
      if (!githubUrl.trim()) {
        alert("GitHub Repository Link is required for Phase 1.");
        return;
      }
    }

    setSubmitLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      const formData = new FormData();
      formData.append("teamId", team.id);
      formData.append("phaseNumber", phaseId);
      formData.append("projectTitle", projectTitle.trim());
      formData.append("projectDescription", projectDescription.trim());
      formData.append("technologyStack", technologyStack.trim());
      formData.append("githubUrl", githubUrl.trim());

      if (fileUrl) {
        formData.append(
          "fileUrls",
          JSON.stringify({ additionalLink: fileUrl }),
        );
      }
      if (reportFile) {
        formData.append("report", reportFile);
      }

      const res = await axios.post("/api/student/phase", formData, {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSubmission(res.data.submission);
      setIsResubmitting(false);
      alert("Phase submitted successfully!");
      fetchTeamAndSubmission();
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading Phase Data...</div>
    );

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 text-gray-600 dark:text-gray-300"
        >
          ←
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Phase {phaseId} Submission
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {team ? `Team: ${team.name} (${team.teamIdFormatted || team.id})` : ""}
          </p>
        </div>
      </div>

      {!team && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
          You must be part of a team to submit a phase.
        </div>
      )}

      {team &&
        (() => {
          const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
          const isLeader = team.leaderId === userInfo?.studentProfileId;
          const superMentorStatus = team.superMentorStatus || "PENDING";
          const isSuperMentorApproved = superMentorStatus === "APPROVED";
          const isSuperMentorRejected = superMentorStatus === "REJECTED";
          const isAwaitingSuperMentor = submission?.status === "AWAITING_SUPER_MENTOR";
          const isPendingMentor = submission?.status === "PENDING";

          return (
            <>
              {/* Quality & Validation Gate Card */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isSuperMentorApproved
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                        : isSuperMentorRejected
                        ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                        : isAwaitingSuperMentor
                        ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                        : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                    }`}>
                      {isSuperMentorApproved ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      ) : isSuperMentorRejected ? (
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                      ) : isAwaitingSuperMentor ? (
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Shield className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        Project Evaluation & Validation Gate
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mentor Grading &bull; Super Mentor Quality Verification &bull; LMS Sync
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isSuperMentorApproved
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                        : isSuperMentorRejected
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700"
                        : isAwaitingSuperMentor
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                    }`}
                  >
                    {isSuperMentorApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isSuperMentorRejected && <ShieldAlert className="w-3.5 h-3.5" />}
                    {isAwaitingSuperMentor && <Clock className="w-3.5 h-3.5" />}
                    {!isSuperMentorApproved && !isSuperMentorRejected && !isAwaitingSuperMentor && <Clock className="w-3.5 h-3.5" />}
                    
                    {isSuperMentorApproved && "APPROVED (LMS GRADE: 1)"}
                    {isSuperMentorRejected && "REJECTED (LMS GRADE: 0)"}
                    {isAwaitingSuperMentor && "MENTOR APPROVED &bull; AWAITING SUPER MENTOR"}
                    {!isSuperMentorApproved && !isSuperMentorRejected && !isAwaitingSuperMentor && "PENDING MENTOR REVIEW"}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">
                        Assigned Mentor:
                      </span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                        {team.mentor ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            {team.mentor.user?.name || "Assigned"}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not allocated yet</span>
                        )}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">
                        Assigned Super Mentor:
                      </span>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                        {team.superMentor ? (
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            {team.superMentor.user?.name || "Assigned"}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not allocated yet</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {team.projectTitle && (
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium">
                        Current Project Title:
                      </span>
                      <p className="font-bold text-gray-800 dark:text-white mt-0.5">
                        {team.projectTitle}
                      </p>
                      {team.projectDescription && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">
                          {team.projectDescription}
                        </p>
                      )}
                      {team.technologyStack && (
                        <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Tech Stack:</span>
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                            {team.technologyStack}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection Notice & New Idea Submission Prompt */}
                  {isSuperMentorRejected && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">
                            Phase Submission Needs Revision
                          </h4>
                          <p className="text-xs mt-1 leading-relaxed bg-white/70 dark:bg-gray-800/70 p-2.5 rounded-lg border border-red-100 dark:border-red-900">
                            <strong>Feedback:</strong> {team.superMentorFeedback || "Project scope or details were not approved. Please revise and resubmit."}
                          </p>
                          {isLeader && !isResubmitting && (
                            <button
                              onClick={() => setIsResubmitting(true)}
                              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Submit Revised Idea/Files
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mentor Grading & Status Card */}
                  {submission?.mentorGrades && submission.mentorGrades.length > 0 && (() => {
                    const mg = submission.mentorGrades[0];
                    const isApprovedByMentor = mg.grade > 0;

                    return (
                      <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="font-bold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                              Mentor Phase Assessment
                            </span>
                          </div>
                          {isApprovedByMentor ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                              Status: Approved
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                              Status: Changes Requested
                            </span>
                          )}
                        </div>

                        {(mg.cleanRemarks || mg.remarks) && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                            <strong>Mentor Remarks:</strong> &ldquo;{mg.cleanRemarks || mg.remarks}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {isSuperMentorApproved && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Quality Gate Passed & LMS Synced!</strong> Your project has been approved by your Mentor and validated by Academic Quality Review.
                      </span>
                    </div>
                  )}

                  {isAwaitingSuperMentor && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        <strong>Awaiting Academic Quality Verification.</strong> Final approval is pending academic review.
                      </span>
                    </div>
                  )}

                  {!isSuperMentorApproved && !isSuperMentorRejected && !isAwaitingSuperMentor && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Awaiting Mentor Evaluation:</strong> Your submission is queued for review by your assigned Mentor.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  Instructions & Guidelines
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {isLeader
                    ? "As the Team Leader, you are responsible for submitting your team's Project Title, Description (Max 250 words), GitHub Repository Link, and Synopsis/Report in PDF format (Max 10MB)."
                    : "Note: Only the Team Leader is authorized to submit or resubmit Phase details. As a team member, you can monitor the status, inspect documents, and track mentor evaluations."}
                </p>
              </div>

              {/* Submission & Grade Status */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                  Submission & Grade Status
                </h3>

                {submission && !isResubmitting ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Document Status
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            submission.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : submission.status === "GRADED"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {submission.status}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500 block mb-1">
                            Synopsis / Report Document:
                          </span>
                          <button
                            onClick={() => openPrivateFile(submission.id)}
                            className="text-blue-600 hover:underline break-all font-semibold inline-flex items-center gap-1.5"
                          >
                            <FileText className="w-4 h-4" /> View Submitted Synopsis/Report
                          </button>
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Stored securely on AWS S3
                          </div>
                        </div>

                        {team.githubUrl && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-500 block mb-1">
                              GitHub Repository:
                            </span>
                            <a
                              href={team.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all font-semibold inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> {team.githubUrl}
                            </a>
                          </div>
                        )}

                        {submission.fileUrls?.additionalLink && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-500 block mb-1">
                              Additional Project Link:
                            </span>
                            <a
                              href={submission.fileUrls.additionalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all font-semibold inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> {submission.fileUrls.additionalLink}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {submission.mentorGrades && submission.mentorGrades.length > 0 && (
                      <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-blue-900 dark:text-blue-300 text-base">
                            Mentor Evaluation & Marks
                          </h4>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              submission.mentorGrades[0].grade === 1
                                ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                                : "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100"
                            }`}
                          >
                            {submission.mentorGrades[0].grade === 1
                              ? "APPROVED (Grade: 1)"
                              : "REJECTED / NEEDS REVISION (Grade: 0)"}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4 mt-2 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                          <strong>Mentor Remarks:</strong>{" "}
                          {submission.mentorGrades[0].remarks || "No remarks provided."}
                        </p>
                        {submission.mentorGrades[0].grade === 0 &&
                          (isLeader ? (
                            <button
                              onClick={() => setIsResubmitting(true)}
                              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-4 h-4" /> Resubmit Synopsis / Phase Report
                            </button>
                          ) : (
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-bold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> This phase requires revision. Awaiting resubmission by your Team Leader.
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : !isLeader ? (
                  <div className="p-10 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                    <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-xl text-gray-800 dark:text-white mb-2">
                      Awaiting Team Leader Submission
                    </h4>
                    <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-4">
                      The Synopsis and Phase {phaseId} Report have not been uploaded yet. As a Team Member, you have view-only access.
                    </p>
                    <div className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800">
                      Once your Team Leader uploads the report, you can view the document, status, and mentor grades here.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Project Title */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Project Title {isPhase1 && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        required={isPhase1}
                        placeholder="e.g. AI-Powered Smart Parking and Surveillance System"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      />
                    </div>

                    {/* Project Description (Max 250 words) */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Project Description / Abstract {isPhase1 && <span className="text-red-500">*</span>}
                        </label>
                        <span
                          className={`text-xs font-bold ${
                            wordCount > 250 ? "text-red-500" : wordCount > 200 ? "text-amber-500" : "text-gray-400"
                          }`}
                        >
                          {wordCount}/250 words {wordCount > 250 && "(Limit exceeded!)"}
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        required={isPhase1}
                        placeholder="Provide a detailed project abstract including problem statement, methodology, key technologies, and proposed outcome (max 250 words)..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 outline-none text-sm leading-relaxed ${
                          wordCount > 250
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                        }`}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Super Mentor will evaluate project standard based on this description. Keep it clear, professional, and within 250 words.
                      </p>
                    </div>

                    {/* Technology Stack */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Technology Stack {isPhase1 && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Layers className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required={isPhase1}
                          placeholder="e.g. React.js, Node.js, Express, PostgreSQL, TailwindCSS, Docker"
                          value={technologyStack}
                          onChange={(e) => setTechnologyStack(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        List the primary technologies, frameworks, and database tools used.
                      </p>
                    </div>

                    {/* GitHub URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        GitHub Repository URL {isPhase1 && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <GitBranch className="w-4 h-4" />
                        </span>
                        <input
                          type="url"
                          required={isPhase1}
                          placeholder="https://github.com/organization/repo-name"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Mandatory repository link for code and document tracking.
                      </p>
                    </div>

                    {/* Synopsis PDF Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Upload Synopsis / Phase Report (PDF){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="application/pdf"
                        required={!submission}
                        onChange={(e) => setReportFile(e.target.files[0])}
                        className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Please upload a valid PDF document (Max 10MB).
                      </p>
                    </div>

                    {/* Additional Link */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Additional Link (Live Demo / Video / Presentation)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                      <button
                        type="submit"
                        disabled={submitLoading || (isPhase1 && wordCount > 250)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold disabled:opacity-50 transition-colors"
                      >
                        {submitLoading ? "Submitting..." : isResubmitting ? "Resubmit Project Details" : "Submit Phase & Synopsis"}
                      </button>
                      {isResubmitting && (
                        <button
                          type="button"
                          onClick={() => setIsResubmitting(false)}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </>
          );
        })()}
    </div>
  );
};

export default StudentPhaseSubmission;
