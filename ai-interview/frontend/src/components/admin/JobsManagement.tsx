import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MapPin,
  DollarSign,
  Users,
  Building,
  ToggleLeft,
  ToggleRight,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '../../api';

interface Job {
  id: number;
  title: string;
  level: string;
  department: string;
  description: string;
  status: 'active' | 'inactive';
  requirements: string[];
  location: string;
  salary_range: string;
  employment_type: string;
  remote_allowed: boolean;
  invite_count?: number;
  posted_at?: string;
  salary?: string;
  invites?: any[];
  total_invites?: number;
}

interface Stats {
  total_jobs: number;
  active_jobs: number;
  inactive_jobs: number;
  recent_jobs: number;
  departments: { department: string; count: number }[];
}

type DeleteState = { show: boolean; job: Job | null };

const emptyForm: Omit<Job, 'id' | 'invite_count' | 'posted_at' | 'salary' | 'invites' | 'total_invites'> = {
  title: '',
  level: '',
  department: '',
  description: '',
  status: 'active',
  requirements: [],
  location: '',
  salary_range: '',
  employment_type: 'full-time',
  remote_allowed: false,
};

const JobsManagement: React.FC = () => {
  // ------- state -------
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // filters/search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'All'>('All');

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // selection / forms
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<typeof emptyForm>({ ...emptyForm });
  const [requirementInput, setRequirementInput] = useState('');

  // delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteState>({ show: false, job: null });

  // ------- data fetch -------
  const loadJobs = async () => {
    try {
      setLoading(true);
      const [jobsRes, statsRes] = await Promise.all([apiClient.getJobs(), apiClient.getAdminStats()]);
      const fetched: Job[] = (jobsRes || []).map((j: any) => ({
        id: j.id,
        title: j.title ?? '',
        level: j.level ?? '',
        department: j.department ?? '',
        description: j.description ?? j.jd_text ?? '',
        status: (j.status ?? 'active') as 'active' | 'inactive',
        requirements: j.requirements ?? [],
        location: j.location ?? '',
        salary_range: j.salary_range ?? '',
        employment_type: j.employment_type ?? 'full-time',
        remote_allowed: !!j.remote_allowed,
        invite_count: j.invite_count ?? 0,
        posted_at: j.posted_at,
        salary: j.salary,
        invites: j.invites ?? [],
        total_invites: j.total_invites ?? j.invite_count ?? 0,
      }));
      setJobs(fetched);
      setStats({
        total_jobs: statsRes.jobs ?? fetched.length,
        active_jobs: fetched.filter((x) => x.status === 'active').length,
        inactive_jobs: fetched.filter((x) => x.status !== 'active').length,
        recent_jobs: Math.min(5, fetched.length),
        departments: Array.from(
          fetched.reduce<Map<string, number>>((m, j) => {
            const k = j.department || 'Other';
            m.set(k, (m.get(k) || 0) + 1);
            return m;
          }, new Map()),
        ).map(([department, count]) => ({ department, count })),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // ------- derived list -------
  const filtered = useMemo(() => {
    return jobs
      .filter((j) =>
        searchTerm
          ? [j.title, j.department, j.description].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
          : true,
      )
      .filter((j) => (filterLevel !== 'All' ? j.level === filterLevel : true))
      .filter((j) => (filterDepartment !== 'All' ? j.department === filterDepartment : true))
      .filter((j) => (filterStatus !== 'All' ? j.status === filterStatus : true));
  }, [jobs, searchTerm, filterLevel, filterDepartment, filterStatus]);

  // pagination helpers
  const totalJobs = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / itemsPerPage));
  const pageSlice = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ------- helpers -------
  const resetForm = () => setFormData({ ...emptyForm });

  const addRequirement = () => {
    const v = requirementInput.trim();
    if (!v) return;
    setFormData((prev) => ({ ...prev, requirements: [...prev.requirements, v] }));
    setRequirementInput('');
  };

  const removeRequirement = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== idx),
    }));
  };

  // ------- actions -------
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.level || !formData.department || !formData.description) {
      alert('Please fill all required fields: Title, Level, Department, Description.');
      return;
    }
    try {
      await apiClient.createJob({
        title: formData.title,
        level: formData.level,
        department: formData.department,
        description: formData.description,
        location: formData.location,
        salary_range: formData.salary_range,
        employment_type: formData.employment_type,
        remote_allowed: formData.remote_allowed,
        status: formData.status,
        requirements: formData.requirements,
      });
      setShowAddModal(false);
      resetForm();
      await loadJobs();
    } catch (err) {
      console.error('Error creating job:', err);
      alert('Failed to create job. Please try again.');
    }
  };

  const editJob = (job: Job) => {
    setEditingJob(job);
    setSelectedJob(job);
    setFormData({
      title: job.title,
      level: job.level,
      department: job.department,
      description: job.description,
      status: job.status,
      requirements: job.requirements || [],
      location: job.location || '',
      salary_range: job.salary_range || '',
      employment_type: job.employment_type || 'full-time',
      remote_allowed: !!job.remote_allowed,
    });
    setShowEditModal(true);
  };

  const updateJob: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      await apiClient.updateJob(editingJob.id, {
        ...formData,
        description: formData.description,
      });
      setShowEditModal(false);
      setEditingJob(null);
      setSelectedJob(null);
      resetForm();
      await loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteJob = async (job: Job) => {
    try {
      await apiClient.deleteJob(job.id);
      setDeleteConfirm({ show: false, job: null });
      await loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleJobStatus = async (jobId: number) => {
    try {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      const next = job.status === 'active' ? 'inactive' : 'active';
      await apiClient.updateJob(jobId, { ...job, status: next });
      await loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const viewJobDetails = async (jobId: number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowViewModal(true);
    }
  };

  // ------- render -------
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-gray-900">Jobs Management</h1>
      </div>

      {/* Stats - always single row */}
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.total_jobs}</div>
                <div className="text-sm text-gray-500">Total Jobs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700">{stats.active_jobs}</div>
                <div className="text-sm text-gray-500">Active Jobs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-700">{stats.inactive_jobs}</div>
                <div className="text-sm text-gray-500">Inactive Jobs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-700">{stats.recent_jobs}</div>
                <div className="text-sm text-gray-500">Recent Jobs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Card header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-yellow-600" />
            Jobs Directory
          </h3>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#BB6C43', color: '#EBEFFE' }}
          >
            <Plus size={20} />
            Add New Job
          </button>
        </div>

  {/* Filters - always single row */}
  <div className="p-6 border-b border-gray-100 flex flex-row flex-wrap gap-4 items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3 rounded-lg px-4 py-2" style={{ backgroundColor: '#EBEFFE' }}>
              <Search className="text-[#BB6C43] flex-shrink-0" size={20} />
              <input
                type="text"
                placeholder="Search jobs by title, department, or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 border-0 outline-0 bg-transparent text-[#4A413C] placeholder-gray-500"
              />
            </div>
          </div>

          <select
            value={filterLevel}
            onChange={(e) => {
              setFilterLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{ backgroundColor: '#EBEFFE', color: '#4A413C' }}
          >
            <option value="All">All Levels</option>
            <option value="Entry">Entry</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Manager">Manager</option>
          </select>

          <select
            value={filterDepartment}
            onChange={(e) => {
              setFilterDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{ backgroundColor: '#EBEFFE', color: '#4A413C' }}
          >
            <option value="All">All Departments</option>
            {stats?.departments.map((dept) => (
              <option key={dept.department} value={dept.department}>
                {dept.department} ({dept.count})
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as 'active' | 'inactive' | 'All');
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{ backgroundColor: '#EBEFFE', color: '#4A413C' }}
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department & Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Invites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                    Loading jobs…
                  </td>
                </tr>
              )}

              {!loading && pageSlice.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                    No jobs match your filters.
                  </td>
                </tr>
              )}

              {!loading &&
                pageSlice.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">
                          {job.salary_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign size={14} />
                              {job.salary_range}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.department}</div>
                          <div className="text-sm text-gray-500">{job.level}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPin size={14} />
                          {job.location || 'Not specified'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.employment_type} {job.remote_allowed && '• Remote OK'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {job.status}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Users size={14} />
                          {job.invite_count ?? 0} invites
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewJobDetails(job.id)}
                          className="hover:opacity-70"
                          style={{ color: '#BB6C43' }}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => editJob(job)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Job"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => toggleJobStatus(job.id)}
                          className={`${
                            job.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={`${job.status === 'active' ? 'Deactivate' : 'Activate'} Job`}
                        >
                          {job.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ show: true, job })}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Job"
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalJobs)} of{' '}
                {totalJobs} jobs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Job Modal - centered popup */}
      {showViewModal && selectedJob && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 9999, position: 'fixed', padding: '20px' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowViewModal(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Job Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={28} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedJob.title}</h3>
                <p className="text-gray-600 mb-1">
                  Department: <span className="font-medium">{selectedJob.department}</span>
                </p>
                <p className="text-gray-600 mb-1">
                  Level: <span className="font-medium">{selectedJob.level}</span>
                </p>
                <p className="text-gray-600 mb-1">
                  Employment Type: <span className="font-medium">{selectedJob.employment_type}</span>
                </p>
                <p className="text-gray-600 mb-1">
                  Location: <span className="font-medium">{selectedJob.location || 'Not specified'}</span>
                </p>
                <p className="text-gray-600 mb-1">
                  Salary Range: <span className="font-medium">{selectedJob.salary_range || 'N/A'}</span>
                </p>
                <p className="text-gray-600 mb-1">
                  Remote Allowed: <span className="font-medium">{selectedJob.remote_allowed ? 'Yes' : 'No'}</span>
                </p>
                <p className="text-gray-600 mb-1">
                  Status:{' '}
                  <span
                    className={`font-medium px-2 py-1 rounded ${
                      selectedJob.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedJob.status}
                  </span>
                </p>
                <p className="text-gray-600 mb-1">
                  Invites: <span className="font-medium">{selectedJob.invite_count ?? 0}</span>
                </p>
                <p className="text-gray-600 mb-1">
                  Posted At:{' '}
                  <span className="font-medium">
                    {selectedJob.posted_at ? new Date(selectedJob.posted_at).toLocaleDateString() : 'N/A'}
                  </span>
                </p>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-line">{selectedJob.description}</p>
              </div>
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Requirements</h4>
                  <ul className="list-disc pl-6 text-gray-700">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 9999, position: 'fixed', padding: '20px' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl"
            style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Job</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                    <select
                      required
                      value={formData.level}
                      onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Level</option>
                      <option value="Entry">Entry</option>
                      <option value="Mid">Mid</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Engineering, Marketing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, employment_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., New York, NY"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                    <input
                      type="text"
                      value={formData.salary_range}
                      onChange={(e) => setFormData((prev) => ({ ...prev, salary_range: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., $80,000 - $120,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the role, responsibilities, and qualifications..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addRequirement();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a requirement and press Enter"
                    />
                    <button
                      type="button"
                      onClick={addRequirement}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded">
                        <span className="text-sm">{req}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.remote_allowed}
                      onChange={(e) => setFormData((prev) => ({ ...prev, remote_allowed: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Remote work allowed</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#BB6C43', color: '#EBEFFE' }}
                  >
                    Create Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 9999, position: 'fixed', padding: '20px' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setSelectedJob(null);
              resetForm();
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
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Job</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedJob(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={updateJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Level</option>
                    <option value="Entry">Entry</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={formData.salary_range}
                    onChange={(e) => setFormData((prev) => ({ ...prev, salary_range: e.target.value }))}
                    placeholder="e.g., $80,000 - $120,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employment_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.remote_allowed}
                      onChange={(e) => setFormData((prev) => ({ ...prev, remote_allowed: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote Allowed</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingJob(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#BB6C43', color: '#EBEFFE' }}
                >
                  Update Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.job && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 9999, position: 'fixed', padding: '20px' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm({ show: false, job: null });
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl"
            style={{ maxWidth: '400px', width: '100%', padding: '24px', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Job</h3>
              <button
                onClick={() => setDeleteConfirm({ show: false, job: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.job.title}</strong>? This action cannot be undone
              and will remove all associated invites and interviews.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, job: null })}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJob(deleteConfirm.job!)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsManagement;
