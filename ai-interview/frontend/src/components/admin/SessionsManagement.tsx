import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Clock, 
  User, 
  Briefcase, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Calendar
} from 'lucide-react';

interface Session {
  id: number;
  invite_id: number;
  invite_code: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  job_department: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  score: number | null;
  proctor_risk: number;
  total_turns: number;
  completed_turns: number;
  risk_events_count: number;
  is_active: boolean;
  progress_percentage: number;
}

interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  recent_sessions: number;
  avg_duration_minutes: number;
  completion_rate: number;
  avg_score: number;
  high_risk_sessions: number;
  jobs_breakdown: Array<{ job_title: string; job_department: string; session_count: number }>;
  activity_breakdown: Array<{ date: string; sessions_count: number }>;
}

interface ActiveSession {
  session_id: number;
  candidate_name: string;
  job_title: string;
  invite_code: string;
  started_at: string;
  current_duration_minutes: number;
  total_turns: number;
  completed_turns: number;
  last_activity: string | null;
  current_risk_level: number;
  recent_risk_events: number;
  is_stalled: boolean;
}

const SessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [showActiveMonitor, setShowActiveMonitor] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, session: Session | null}>({show: false, session: null});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSessions();
    fetchStats();
    if (showActiveMonitor) {
      fetchActiveSessions();
    }
  }, [currentPage, searchTerm, filterStatus, filterJob, showActiveMonitor]);

  useEffect(() => {
    let interval: number | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStats();
        if (showActiveMonitor) {
          fetchActiveSessions();
        }
      }, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, showActiveMonitor]);

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams({
        skip: ((currentPage - 1) * itemsPerPage).toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterJob && { job_id: filterJob })
      });

      const response = await fetch(`/api/admin/sessions/?${params}`);
      const data = await response.json();
      setSessions(data.sessions || []);
      setTotalSessions(data.total || 0);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/sessions/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions/active/monitor');
      const data = await response.json();
      setActiveSessions(data.active_sessions || []);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      setActiveSessions([]);
    }
  };

  const viewSessionDetails = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`);
      const sessionDetails = await response.json();
      setSelectedSession(sessionDetails);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  const updateSession = async (sessionId: number, updateData: any) => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchSessions();
        fetchStats();
        alert('Session updated successfully');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to update session');
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const deleteSession = async (session: Session) => {
    try {
      const response = await fetch(`/api/admin/sessions/${session.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSessions();
        await fetchStats();
        setDeleteConfirm({show: false, session: null});
        alert('Session deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete session: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const getStatusIcon = (status: string, isActive: boolean) => {
    if (isActive) return <Activity className="w-4 h-4 text-green-600 animate-pulse" />;
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'abandoned':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'started':
        return <Play className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) return 'bg-green-100 text-green-800 animate-pulse';
    
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      case 'started':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 0.7) return { level: 'High', color: 'text-red-600' };
    if (risk >= 0.4) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const totalPages = Math.ceil(totalSessions / itemsPerPage);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Interview Sessions Monitor</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              autoRefresh 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowActiveMonitor(!showActiveMonitor)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              showActiveMonitor 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <Activity size={20} />
            {showActiveMonitor ? 'Hide Live Monitor' : 'Live Monitor'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_sessions}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <p className="text-3xl font-bold text-green-600">{stats.active_sessions}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600 animate-pulse" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completion_rate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-purple-600">{formatDuration(stats.avg_duration_minutes)}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions Monitor */}
      {showActiveMonitor && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600 animate-pulse" />
              Live Sessions Monitor ({activeSessions.length} active)
            </h2>
          </div>
          <div className="p-6">
            {activeSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active sessions at the moment</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSessions.map((session) => (
                  <div key={session.session_id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{session.candidate_name}</h3>
                      {session.is_stalled && (
                        <div title="Session appears stalled">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{session.job_title}</p>
                    <p className="text-sm text-gray-500">Code: {session.invite_code}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{formatDuration(session.current_duration_minutes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Progress:</span>
                        <span className="font-medium">{session.completed_turns}/{session.total_turns} turns</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Events:</span>
                        <span className={`font-medium ${session.recent_risk_events > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {session.recent_risk_events}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => viewSessionDetails(session.session_id)}
                      className="w-full mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 rounded-lg px-4 py-2" style={{backgroundColor: '#EBEFFE'}}>
              <Search className="text-[#BB6C43] flex-shrink-0" size={20} />
              <input
                type="text"
                placeholder="Search by candidate name, email, job title, or invite code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-0 outline-0 bg-transparent text-[#4A413C] placeholder-gray-500"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
          >
            <option value="">All Statuses</option>
            <option value="started">Started</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('');
              setFilterJob('');
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex-shrink-0"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">#{session.id}</div>
                      <div className="text-sm text-gray-500">{session.invite_code}</div>
                      <div className="text-xs text-gray-400">{formatDate(session.started_at)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.candidate_name}</div>
                        <div className="text-sm text-gray-500">{session.candidate_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.job_title}</div>
                        <div className="text-sm text-gray-500">{session.job_department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(session.status, session.is_active)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status, session.is_active)}`}>
                        {session.is_active ? 'Live' : session.status}
                      </span>
                      {session.risk_events_count > 0 && (
                        <div title={`${session.risk_events_count} risk events`}>
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDuration(session.duration_minutes)}</div>
                    {session.ended_at && (
                      <div className="text-xs text-gray-500">Ended: {formatDate(session.ended_at)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.completed_turns}/{session.total_turns}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${session.progress_percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">{Math.round(session.progress_percentage)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {session.score !== null ? (
                      <div className="text-sm font-medium text-gray-900">{session.score.toFixed(1)}/10</div>
                    ) : (
                      <div className="text-sm text-gray-500">Pending</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewSessionDetails(session.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const status = prompt('Update status (started/completed/abandoned):', session.status);
                          if (status && ['started', 'completed', 'abandoned'].includes(status)) {
                            updateSession(session.id, { status });
                          }
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Update Status"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({show: true, session})}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex items-center">
              <p className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalSessions)} of {totalSessions} sessions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {showDetailsModal && selectedSession && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center" 
          style={{
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl" 
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Session Details - #{selectedSession.id}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Session Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          selectedSession.status === 'completed' ? 'text-green-600' :
                          selectedSession.status === 'abandoned' ? 'text-red-600' : 'text-blue-600'
                        }`}>{selectedSession.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span>{formatDate(selectedSession.started_at)}</span>
                      </div>
                      {selectedSession.ended_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ended:</span>
                          <span>{formatDate(selectedSession.ended_at)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span>{formatDuration(selectedSession.duration_minutes)}</span>
                      </div>
                      {selectedSession.score !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Final Score:</span>
                          <span className="font-medium">{selectedSession.score.toFixed(1)}/10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Candidate & Job</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{selectedSession.candidate_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{selectedSession.candidate_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Job:</span>
                        <span>{selectedSession.job_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span>{selectedSession.job_department}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Turns & Events */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Interview Turns ({selectedSession.turns?.length || 0})</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {selectedSession.turns?.length > 0 ? (
                        selectedSession.turns.map((turn: any, index: number) => (
                          <div key={turn.id} className="border rounded p-3 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">Turn {turn.idx}</span>
                              {turn.turn_score && (
                                <span className="text-sm font-medium text-blue-600">
                                  Score: {turn.turn_score.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{turn.question_text}</p>
                            {turn.transcript && (
                              <p className="text-xs text-gray-600">Answer: {turn.transcript.substring(0, 100)}...</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No turns available</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Proctor Events ({selectedSession.proctor_events?.length || 0})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {selectedSession.proctor_events?.length > 0 ? (
                        selectedSession.proctor_events.map((event: any) => (
                          <div key={event.id} className="text-sm border rounded p-2 bg-red-50">
                            <div className="flex justify-between">
                              <span className="font-medium">{event.event_type}</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(event.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{event.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No proctor events</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.session && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center" 
          style={{
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteConfirm({show: false, session: null});
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl" 
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '24px',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Session</h3>
              <button 
                onClick={() => setDeleteConfirm({show: false, session: null})}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete session <strong>#{deleteConfirm.session.id}</strong> for 
              <strong> {deleteConfirm.session.candidate_name}</strong>? 
              This action cannot be undone and will remove all interview data, recordings, and responses.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({show: false, session: null})}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSession(deleteConfirm.session!)}
                className="px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-red-700"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsManagement;