import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Filter, Calendar, BarChart3, 
  Users, Clock, AlertTriangle, CheckCircle, XCircle,
  Search, SortAsc, SortDesc, RefreshCw, Archive,
  FileDown, Table as TableIcon, PieChart, TrendingUp,
  Eye, Trash2, Package
} from 'lucide-react';

interface ReportSummary {
  id: number;
  session_id: number;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  department: string;
  session_status: string;
  overall_score?: number;
  risk_score?: number;
  risk_level: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  total_questions: number;
  answered_questions: number;
  completion_rate: number;
}

interface ReportAnalytics {
  total_reports: number;
  avg_completion_rate: number;
  avg_overall_score: number;
  avg_risk_score: number;
  reports_by_status: Record<string, number>;
  reports_by_department: Record<string, number>;
  reports_by_risk_level: Record<string, number>;
  score_distribution: Record<string, number>;
  completion_trends: Array<{ period: string; count: number }>;
}

interface BulkExportRequest {
  session_ids: number[];
  format: 'pdf' | 'csv' | 'excel';
  include_analytics: boolean;
}

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('started_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    jobId: '',
    department: '',
    status: '',
    minScore: '',
    maxScore: '',
    riskLevel: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, report: ReportSummary | null}>({show: false, report: null});
  
  const reportsPerPage = 20;

  useEffect(() => {
    fetchReports();
  }, [currentPage, sortBy, sortOrder, filters, searchTerm]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * reportsPerPage;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: reportsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.jobId) params.append('job_id', filters.jobId);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);
      if (filters.minScore) params.append('min_score', filters.minScore);
      if (filters.maxScore) params.append('max_score', filters.maxScore);
      if (filters.riskLevel) params.append('risk_level', filters.riskLevel);

      const response = await fetch(`http://localhost:8000/api/admin/reports/?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.department) params.append('department', filters.department);

      const response = await fetch(`http://localhost:8000/api/admin/reports/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSelectReport = (reportId: number) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.session_id));
    }
  };

  const downloadReport = async (sessionId: number, format: 'pdf' | 'json') => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/reports/${sessionId}/download?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview_report_${sessionId}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const bulkExport = async (format: 'pdf' | 'csv') => {
    if (selectedReports.length === 0) {
      alert('Please select reports to export');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/admin/reports/bulk-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_ids: selectedReports,
          format,
          include_analytics: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`Successfully exported ${selectedReports.length} reports`);
          setSelectedReports([]);
        } else {
          alert(`Export failed: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to bulk export:', error);
      alert('Export failed');
    }
  };

  const deleteReport = async (report: ReportSummary) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/reports/${report.session_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReports(prev => prev.filter(r => r.session_id !== report.session_id));
        setDeleteConfirm({show: false, report: null});
        alert('Report deleted successfully');
      } else {
        const error = await response.json();
        alert(`Failed to delete report: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': case 'abandoned': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button 
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left"
    >
      <span>{children}</span>
      {sortBy === field && (
        sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Reports</h1>
          <p className="text-gray-600">Manage and analyze interview reports</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowAnalytics(!showAnalytics);
              if (!showAnalytics && !analytics) {
                fetchAnalytics();
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{showAnalytics ? 'Hide' : 'Show'} Analytics</span>
          </button>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
            <button
              onClick={fetchAnalytics}
              disabled={analyticsLoading}
              className="text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {analytics ? (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Total Reports</p>
                    <p className="text-2xl font-semibold text-blue-900">{analytics.total_reports}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Avg Completion</p>
                    <p className="text-2xl font-semibold text-green-900">{analytics.avg_completion_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-900">Avg Score</p>
                    <p className="text-2xl font-semibold text-purple-900">{analytics.avg_overall_score.toFixed(1)}/10</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-900">Avg Risk Score</p>
                    <p className="text-2xl font-semibold text-red-900">{analytics.avg_risk_score.toFixed(1)}/100</p>
                  </div>
                </div>
              </div>
            </div>
          ) : analyticsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : null}
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
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-0 outline-0 bg-transparent text-[#4A413C] placeholder-gray-500"
              />
            </div>
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="abandoned">Abandoned</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
          >
            <option value="">Report Type</option>
            <option value="interview">Interview Reports</option>
            <option value="performance">Performance Reports</option>
            <option value="analytics">Analytics Reports</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedReports.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
            <span className="text-blue-700 font-medium">
              {selectedReports.length} report{selectedReports.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => bulkExport('pdf')}
                className="flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                <FileDown className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => bulkExport('csv')}
                className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                <TableIcon className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setSelectedReports([])}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                <XCircle className="h-4 w-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReports.length === reports.length && reports.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="session_id">Session</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="candidate_name">Candidate</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="job_title">Position</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="overall_score">Score</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="started_at">Date</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-500">Loading reports...</p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.session_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.session_id)}
                        onChange={() => handleSelectReport(report.session_id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{report.session_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.candidate_name}</div>
                        <div className="text-sm text-gray-500">{report.candidate_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.job_title}</div>
                        <div className="text-sm text-gray-500">{report.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(report.session_status)}
                        <span className="ml-2 text-sm capitalize">{report.session_status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.overall_score ? `${report.overall_score.toFixed(1)}/10` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(report.risk_level)}`}>
                        {report.risk_level} ({report.risk_score?.toFixed(1) || 0})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.started_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadReport(report.session_id, 'pdf')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadReport(report.session_id, 'json')}
                          className="text-green-600 hover:text-green-900"
                          title="Download JSON"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({show: true, report})}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {reports.length >= reportsPerPage && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={reports.length < reportsPerPage}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.report && (
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
              setDeleteConfirm({show: false, report: null});
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
              <h3 className="text-lg font-semibold text-red-600">Delete Report</h3>
              <button 
                onClick={() => setDeleteConfirm({show: false, report: null})}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete the report for <strong>{deleteConfirm.report.candidate_name}</strong>? 
              This action cannot be undone and will permanently remove the interview report and all associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({show: false, report: null})}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteReport(deleteConfirm.report!)}
                className="px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-red-700"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;