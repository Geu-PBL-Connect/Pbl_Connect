import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, X, CalendarDays, Clock, MapPin, Save, ChevronDown, Users, Sparkles } from 'lucide-react';

const AdminEvaluationSchedule = () => {
  const [pblList, setPblList] = useState([]);
  const [selectedPbl, setSelectedPbl] = useState('');
  const [phases, setPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk set state
  const [showBulkSet, setShowBulkSet] = useState(false);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkTime, setBulkTime] = useState('');
  const [bulkVenue, setBulkVenue] = useState('');

  // Edits tracker
  const [edits, setEdits] = useState({}); // { tpeId: { evaluationDate, evaluationTime, evaluationVenue } }

  useEffect(() => {
    fetchPbls();
  }, []);

  useEffect(() => {
    if (selectedPbl) {
      const pbl = pblList.find(p => p.id === selectedPbl);
      if (pbl && pbl.phases) {
        setPhases(pbl.phases);
        if (pbl.phases.length > 0) {
          setSelectedPhase(pbl.phases[0].id);
        }
      }
    }
  }, [selectedPbl]);

  useEffect(() => {
    if (selectedPbl && selectedPhase) {
      fetchSchedule();
    }
  }, [selectedPhase]);

  const fetchPbls = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get('/api/admin/pbl', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setPblList(res.data);
      if (res.data.length > 0) {
        setSelectedPbl(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setEdits({});
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get(`/api/admin/evaluation-schedule/${selectedPbl}/${selectedPhase}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (tpeId, field, value) => {
    setEdits(prev => ({
      ...prev,
      [tpeId]: {
        ...(prev[tpeId] || {}),
        [field]: value,
      }
    }));
  };

  const getFieldValue = (schedule, field) => {
    if (edits[schedule.id] && edits[schedule.id][field] !== undefined) {
      return edits[schedule.id][field];
    }
    if (field === 'evaluationDate' && schedule.evaluationDate) {
      return new Date(schedule.evaluationDate).toISOString().split('T')[0];
    }
    return schedule[field] || '';
  };

  const handleBulkApply = () => {
    const newEdits = { ...edits };
    schedules.forEach(s => {
      newEdits[s.id] = {
        ...(newEdits[s.id] || {}),
        ...(bulkDate ? { evaluationDate: bulkDate } : {}),
        ...(bulkTime ? { evaluationTime: bulkTime } : {}),
        ...(bulkVenue ? { evaluationVenue: bulkVenue } : {}),
      };
    });
    setEdits(newEdits);
    setShowBulkSet(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      // Merge current schedule data with edits
      const payload = schedules.map(s => {
        const edit = edits[s.id];
        return {
          teamPhaseEvaluatorId: s.id,
          evaluationDate: edit?.evaluationDate !== undefined ? edit.evaluationDate : (s.evaluationDate ? new Date(s.evaluationDate).toISOString().split('T')[0] : null),
          evaluationTime: edit?.evaluationTime !== undefined ? edit.evaluationTime : (s.evaluationTime || null),
          evaluationVenue: edit?.evaluationVenue !== undefined ? edit.evaluationVenue : (s.evaluationVenue || null),
        };
      }).filter(s => edits[s.teamPhaseEvaluatorId]); // Only send edited rows

      if (payload.length === 0) {
        alert('No changes to save.');
        return;
      }

      await axios.put('/api/admin/evaluation-schedule', { schedules: payload }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      alert(`Schedule updated for ${payload.length} teams.`);
      setEdits({});
      fetchSchedule();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  const currentPhase = phases.find(p => p.id === selectedPhase);

  const filteredSchedules = schedules.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.team?.teamIdFormatted?.toLowerCase().includes(q) ||
      s.team?.projectTitle?.toLowerCase().includes(q) ||
      s.team?.leader?.user?.name?.toLowerCase().includes(q) ||
      s.evaluator?.user?.name?.toLowerCase().includes(q) ||
      (getFieldValue(s, 'evaluationVenue') || '').toLowerCase().includes(q)
    );
  });

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
              Evaluation Schedule Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure evaluation date, time, and venue for each team per phase.
            </p>
          </div>
        </div>

        {/* Selectors Row */}
        <div className="mt-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">PBL Subject</label>
            <select
              value={selectedPbl}
              onChange={e => setSelectedPbl(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
            >
              {pblList.map(p => (
                <option key={p.id} value={p.id}>{p.subject} ({p.subjectShort})</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Phase</label>
            <select
              value={selectedPhase}
              onChange={e => setSelectedPhase(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
            >
              {phases.map(p => (
                <option key={p.id} value={p.id}>Phase {p.phaseNumber}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      {schedules.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by team, evaluator, venue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Bulk Set Button */}
            <button
              onClick={() => setShowBulkSet(!showBulkSet)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Bulk Set
              <ChevronDown className={`w-4 h-4 transition-transform ${showBulkSet ? 'rotate-180' : ''}`} />
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!hasEdits || saving}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                hasEdits
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save Changes${hasEdits ? ` (${Object.keys(edits).length})` : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Set Panel */}
      {showBulkSet && (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-5 rounded-2xl">
          <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Apply to All Teams (Phase {currentPhase?.phaseNumber})
          </h4>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Date</label>
              <input
                type="date"
                value={bulkDate}
                onChange={e => setBulkDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Time</label>
              <input
                type="time"
                value={bulkTime}
                onChange={e => setBulkTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Venue</label>
              <input
                type="text"
                value={bulkVenue}
                onChange={e => setBulkVenue(e.target.value)}
                placeholder="e.g. Room 301, Block A"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBulkApply}
                disabled={!bulkDate && !bulkTime && !bulkVenue}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50 whitespace-nowrap"
              >
                Apply to All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <CalendarDays className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-gray-500 font-medium">Loading schedule...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">No Evaluator Assignments Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Evaluators must be assigned to teams for this phase before configuring the schedule. Use the Faculty Allocation page to assign evaluators first.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">Team</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">Project</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">Evaluator</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Date</span>
                  </th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time</span>
                  </th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Venue</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((s, idx) => {
                  const isEdited = !!edits[s.id];
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-50 dark:border-gray-700/50 transition-colors ${
                        isEdited
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                          : idx % 2 === 0
                            ? 'bg-white dark:bg-gray-800'
                            : 'bg-gray-50/50 dark:bg-gray-900/20'
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span className="font-bold text-gray-800 dark:text-white text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                          {s.team?.teamIdFormatted}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="max-w-[200px]">
                          <p className="font-semibold text-gray-800 dark:text-white text-xs truncate">
                            {s.team?.projectTitle || 'Untitled'}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Lead: {s.team?.leader?.user?.name || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                          {s.evaluator?.user?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="date"
                          value={getFieldValue(s, 'evaluationDate')}
                          onChange={e => handleFieldChange(s.id, 'evaluationDate', e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="time"
                          value={getFieldValue(s, 'evaluationTime')}
                          onChange={e => handleFieldChange(s.id, 'evaluationTime', e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          value={getFieldValue(s, 'evaluationVenue')}
                          onChange={e => handleFieldChange(s.id, 'evaluationVenue', e.target.value)}
                          placeholder="Room / Lab"
                          className="w-full px-2.5 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredSchedules.length} of {schedules.length} teams for Phase {currentPhase?.phaseNumber}
            </p>
            {hasEdits && (
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {Object.keys(edits).length} unsaved change(s)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvaluationSchedule;
