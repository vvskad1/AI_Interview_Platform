import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Mail, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  Send,
  RefreshCw
} from 'lucide-react';

interface Invite {
  id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string;
  job_id: number;
  job_title: string;
  job_department: string;
  invite_code: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
}

interface InviteStats {
  total_invites: number;
  pending_invites: number;
  used_invites: number;
  expired_invites: number;
  expiring_soon: number;
  recent_invites: number;
  jobs_breakdown: Array<{ job_title: string; count: number }>;
}

interface Job {
  id: number;
  title: string;
  department: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface InviteFormData {
  candidate_id: number;
  job_id: number;
  expires_at: string;
  send_email: boolean;
}

const InvitesManagement: React.FC = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvites, setTotalInvites] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, invite: Invite | null}>({show: false, invite: null});
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<InviteFormData>({
    candidate_id: 0,
    job_id: 0,
    expires_at: '',
    send_email: true
  });

  useEffect(() => {
    fetchInvites();
    fetchStats();
    fetchJobsAndCandidates();
  }, [currentPage, searchTerm, filterStatus, filterJob]);

  const fetchInvites = async () => {
    try {
      const params = new URLSearchParams({
        skip: ((currentPage - 1) * itemsPerPage).toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterJob && { job_id: filterJob })
      });

      const response = await fetch(`http://localhost:8000/api/admin/invites/?${params}`);
      const data = await response.json();
      setInvites(data.invites);
      setTotalInvites(data.total);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/invites/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchJobsAndCandidates = async () => {
    try {
      // Fetch jobs
      const jobsResponse = await fetch('http://localhost:8000/api/admin/jobs/');
      const jobsData = await jobsResponse.json();
      setJobs(jobsData.jobs || []);

      // Fetch candidates
      const candidatesResponse = await fetch('http://localhost:8000/api/admin/candidates/');
      const candidatesData = await candidatesResponse.json();
      setCandidates(candidatesData.candidates || []);
    } catch (error) {
      console.error('Error fetching jobs and candidates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Set default expiration to 7 days from now if not provided
      const expirationDate = formData.expires_at || 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch('http://localhost:8000/api/admin/invites/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expires_at: expirationDate
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchInvites();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to create invite');
      }
    } catch (error) {
      console.error('Error creating invite:', error);
    }
  };

  const deleteInvite = async (invite: Invite) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/invites/${invite.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchInvites();
        await fetchStats();
        setDeleteConfirm({show: false, invite: null});
        alert('Invite deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete invite: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
      alert('Failed to delete invite');
    }
  };

  const resendEmail = async (inviteId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/invites/${inviteId}/resend-email`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Invitation email sent successfully');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const viewInviteDetails = async (inviteId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/invites/${inviteId}`);
      const inviteDetails = await response.json();
      setSelectedInvite(inviteDetails);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching invite details:', error);
    }
  };

  const handleReinvite = async (invite: Invite) => {
    if (!confirm(`Reinvite ${invite.candidate_name} for ${invite.job_title}? This will create a new invite and send a new email.`)) {
      return;
    }

    try {
      // Calculate new expiry date (7 days from now)
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      const expiresAt = newExpiry.toISOString();

      const response = await fetch(`http://localhost:8000/api/admin/invites/${invite.id}/reinvite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          expires_at: expiresAt
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Reinvite sent successfully! New invite ID: ${result.invite_id}`);
        fetchInvites(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to reinvite');
      }
    } catch (error) {
      console.error('Error reinviting:', error);
      alert('Failed to reinvite. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      candidate_id: 0,
      job_id: 0,
      expires_at: '',
      send_email: true
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'used':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'used':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return expiryDate <= tomorrow && expiryDate > new Date();
  };

  const totalPages = Math.ceil(totalInvites / itemsPerPage);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Interview Invites Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{backgroundColor: '#BB6C43', color: '#EBEFFE'}}
        >
          <Plus size={20} />
          Send New Invite
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invites</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_invites}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending_invites}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Used</p>
                <p className="text-3xl font-bold text-green-600">{stats.used_invites}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-3xl font-bold text-orange-600">{stats.expiring_soon}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
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
                placeholder="Search by candidate name, email, or job title..."
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
            <option value="pending">Pending</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={filterJob}
            onChange={(e) => setFilterJob(e.target.value)}
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id.toString()}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invites Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Invite Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invites.map((invite) => (
                <tr key={invite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{invite.candidate_name}</div>
                      <div className="text-sm text-gray-500">{invite.candidate_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{invite.job_title}</div>
                      <div className="text-sm text-gray-500">{invite.job_department}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invite.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invite.status)}`}>
                        {invite.status}
                      </span>
                      {isExpiringSoon(invite.expires_at) && invite.status === 'pending' && (
                        <>
                          <AlertCircle className="w-4 h-4 text-orange-500" aria-label="Expiring soon" />
                          <span className="sr-only">Expiring soon</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {invite.invite_code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(invite.expires_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewInviteDetails(invite.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleReinvite(invite)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Reinvite Candidate"
                      >
                        <RefreshCw size={16} />
                      </button>
                      {invite.status === 'pending' && (
                        <button
                          onClick={() => resendEmail(invite.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Resend Email"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm({show: true, invite})}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Invite"
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalInvites)} of {totalInvites} invites
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

      {/* Create Invite Modal */}
      {showCreateModal && (
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
              setShowCreateModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl" 
            style={{
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Send New Interview Invite</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate *
                  </label>
                  <select
                    required
                    value={formData.candidate_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, candidate_id: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
                  >
                    <option value={0}>Select Candidate</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name} ({candidate.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Position *
                  </label>
                  <select
                    required
                    value={formData.job_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, job_id: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
                  >
                    <option value={0}>Select Job</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} - {job.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank for 7 days from now
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={formData.send_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, send_email: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="sendEmail" className="text-sm text-gray-700">
                    Send email invitation to candidate
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invite Details Modal */}
      {showDetailsModal && selectedInvite && (
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
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Invite Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Candidate Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{selectedInvite.candidate_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{selectedInvite.candidate_email}</span>
                      </div>
                      {selectedInvite.candidate_phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span>{selectedInvite.candidate_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Job Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span>{selectedInvite.job_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span>{selectedInvite.job_department}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Invite Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Invite Code:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {selectedInvite.invite_code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedInvite.status)}`}>
                          {selectedInvite.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span>{formatDate(selectedInvite.expires_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{formatDate(selectedInvite.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Interview URL</h3>
                    <div className="bg-gray-100 p-3 rounded text-sm break-all">
                      {selectedInvite.interview_url}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                {selectedInvite.status === 'pending' && (
                  <button
                    onClick={() => {
                      resendEmail(selectedInvite.id);
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Send size={16} />
                    Resend Email
                  </button>
                )}
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
      {deleteConfirm.show && deleteConfirm.invite && (
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
              setDeleteConfirm({show: false, invite: null});
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
              <h3 className="text-lg font-semibold text-red-600">Delete Invite</h3>
              <button 
                onClick={() => setDeleteConfirm({show: false, invite: null})}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete the invite for <strong>{deleteConfirm.invite.candidate_name}</strong> to 
              <strong> {deleteConfirm.invite.job_title}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({show: false, invite: null})}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteInvite(deleteConfirm.invite!)}
                className="px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-red-700"
              >
                Delete Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitesManagement;