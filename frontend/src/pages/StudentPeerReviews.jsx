import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, ShieldCheck, Layers, BookOpen, 
  Sparkles, Info, X, Clock, Award
} from 'lucide-react';

const StudentPeerReviews = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [marksData, setMarksData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get('/api/student/micro-mentor/tasks', {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const PEER_REVIEW_CRITERIA = [
    { field: 'Overall Project Score', maxMarks: 10 }
  ];

  const openEvaluationModal = (task) => {
    setSelectedTask(task);
    if (task.isEvaluated && task.myEvaluation) {
      setMarksData(task.myEvaluation.marksData || {});
    } else {
      // Initialize with empty marks
      const initData = {};
      PEER_REVIEW_CRITERIA.forEach(c => {
        initData[c.field] = '';
      });
      setMarksData(initData);
    }
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.post(`/api/student/micro-mentor/evaluate/${selectedTask.id}`, {
        marksData
      }, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      alert('Peer Evaluation Submitted Successfully!');
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const parseTechStack = (techStr) => {
    if (!techStr || techStr === 'Not specified') return [];
    return techStr.split(/[,/]+/).map(t => t.trim()).filter(Boolean);
  };

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Peer Reviews</h2>
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Anonymous Review
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Evaluate assigned projects objectively based solely on the provided project title, abstract, and technology stack.
            </p>
          </div>
        </div>

        {/* Anonymous Guideline Notice */}
        <div className="mt-4 p-3.5 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <span className="font-bold">Blind Review Quality Policy:</span> All team names, member identities, mentor details, and external attachments are completely hidden to prevent bias. Review the project strictly on the merit of its concept, scope, and proposed technical implementation.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Clock className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-spin" />
          <p className="text-sm font-medium">Loading your peer review assignments...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">All Caught Up!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You currently have no pending peer review tasks. Assignments will appear here once allocated by your PBL coordinator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasks.map((task) => {
            const techList = parseTechStack(task.examineeProject?.technologyStack);
            
            return (
              <div 
                key={task.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                        Phase {task.phase.phaseNumber} Review
                      </span>
                    </div>

                    {task.isEvaluated ? (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Score: {task.myEvaluation?.totalMarks ?? 'Saved'} / 10
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Pending Review
                      </span>
                    )}
                  </div>

                  {/* Project Title */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{task.examineeProject.projectTitle || 'Untitled Project'}</span>
                    </h3>
                  </div>

                  {/* Project Description */}
                  <div className="mb-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
                      Project Description & Abstract
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/80 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                      {task.examineeProject.projectDescription || 'No description provided.'}
                    </div>
                  </div>

                  {/* Technology Stack */}
                  <div className="mb-6">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" /> Technology Stack
                    </label>
                    {techList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {techList.map((tech, i) => (
                          <span 
                            key={i} 
                            className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/40 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700">
                        {task.examineeProject.technologyStack || 'Not specified'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Grade Action Button */}
                <button
                  onClick={() => openEvaluationModal(task)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    task.isEvaluated 
                      ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  {task.isEvaluated ? 'View or Update Grade' : 'Grade this Project'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Evaluation Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Evaluate Project (Phase {selectedTask.phase.phaseNumber})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Blind peer assessment based strictly on provided proposal criteria.
                </p>
              </div>
              <button 
                onClick={() => setSelectedTask(null)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reference info preview inside modal */}
            <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700/80 mb-5 space-y-2.5">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Project Title</span>
                <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">
                  {selectedTask.examineeProject.projectTitle}
                </p>
              </div>

              {selectedTask.examineeProject.technologyStack && (
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Technology Stack</span>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {selectedTask.examineeProject.technologyStack}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Description Summary</span>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-4 leading-relaxed">
                  {selectedTask.examineeProject.projectDescription}
                </p>
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={handleEvaluateSubmit} className="space-y-4">
              {PEER_REVIEW_CRITERIA.map((crit, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {crit.field}
                    </label>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      Max: {crit.maxMarks} Marks
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      required
                      min="0"
                      max={crit.maxMarks}
                      step="0.5"
                      value={marksData[crit.field] ?? ''}
                      onChange={e => setMarksData(prev => ({ ...prev, [crit.field]: e.target.value }))}
                      className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-base"
                      placeholder={`Enter score (0 - ${crit.maxMarks})`}
                    />
                    <span className="text-sm font-black text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      / {crit.maxMarks}
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                <button 
                  type="button" 
                  onClick={() => setSelectedTask(null)} 
                  className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold text-sm transition"
                >
                  Cancel
                </button>
                <button 
                  disabled={submitting} 
                  type="submit" 
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPeerReviews;
