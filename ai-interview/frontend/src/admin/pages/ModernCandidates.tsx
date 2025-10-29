import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Users,
  TrendingUp,
  Award,
  Clock,
  ChevronDown,
  X,
  FileText,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  skills: string[];
  status: 'pending' | 'interviewed' | 'shortlisted' | 'rejected' | 'hired';
  rating: number;
  appliedDate: string;
  avatar?: string;
}

const ModernCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  

  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    experience_years: 0,
    skills: '',
    resume_text: ''
  });

  // Load candidates from backend
  useEffect(() => {
    loadCandidates();
  }, []);

  // Debug modal state
  useEffect(() => {
    console.log('showAddModal state changed:', showAddModal);
  }, [showAddModal]);



  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading candidates...');
      const response = await apiClient.getCandidates();
      console.log('Candidates response:', response);
      setCandidates(response.candidates || response || []);
    } catch (err: any) {
      console.error('Failed to load candidates:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!formData.name || !formData.email || !formData.resume_text) {
      alert('Name, Email, and Resume Content are required fields');
      return;
    }
    
    try {
      // Format the data properly for the API
      const apiData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
      };
      console.log('Creating candidate with data:', apiData);
      const result = await apiClient.createCandidate(apiData);
      console.log('Candidate created successfully:', result);
      
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', location: '', experience_years: 0, skills: '', resume_text: '' });
      await loadCandidates();
      alert('Candidate added successfully!');
    } catch (err: any) {
      console.error('Failed to add candidate:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to add candidate. Please check your input and try again.';
      alert(errorMessage);
    }
  };

  const handleEditCandidate = async () => {
    if (!formData.name || !formData.email) {
      alert('Name and Email are required fields');
      return;
    }
    
    try {
      if (!selectedCandidate) return;
      // Format the data properly for the API
      const apiData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
      };
      console.log('Updating candidate with data:', apiData);
      const result = await apiClient.updateCandidate(selectedCandidate.id, apiData);
      console.log('Candidate updated successfully:', result);
      
      setShowEditModal(false);
      setSelectedCandidate(null);
      setFormData({ name: '', email: '', phone: '', location: '', experience_years: 0, skills: '', resume_text: '' });
      await loadCandidates();
      alert('Candidate updated successfully!');
    } catch (err: any) {
      console.error('Failed to update candidate:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update candidate. Please check your input and try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteCandidate = async () => {
    try {
      if (!selectedCandidate) return;
      console.log('Deleting candidate:', selectedCandidate.id);
      const result = await apiClient.deleteCandidate(selectedCandidate.id);
      console.log('Candidate deleted successfully:', result);
      
      setShowDeleteModal(false);
      setSelectedCandidate(null);
      await loadCandidates();
      alert('Candidate deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete candidate:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete candidate';
      alert(errorMessage);
    }
  };

  const openEditModal = (candidate: any) => {
    setSelectedCandidate(candidate);
    setFormData({
      name: candidate.name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      location: candidate.location || '',
      experience_years: candidate.experience_years || 0,
      skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : (candidate.skills || ''),
      resume_text: candidate.resume_text || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowViewModal(true);
  };

  const openDeleteModal = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowDeleteModal(true);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Phone,Location,Experience,Skills\n" +
      candidates.map(c => `${c.name},${c.email},${c.phone || ''},${c.location || ''},${c.experience_years || 0},"${c.skills || ''}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "candidates.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length >= 2) {
          const candidateData = {
            name: values[0]?.replace(/"/g, '') || '',
            email: values[1]?.replace(/"/g, '') || '',
            phone: values[2]?.replace(/"/g, '') || '',
            location: values[3]?.replace(/"/g, '') || '',
            experience_years: parseInt(values[4]?.replace(/"/g, '')) || 0,
            skills: values[5]?.replace(/"/g, '') || ''
          };

          try {
            await apiClient.createCandidate(candidateData);
          } catch (err) {
            console.error('Failed to import candidate:', candidateData.name, err);
          }
        }
      }
      
      alert('Import completed! Refreshing candidate list...');
      await loadCandidates();
    };
    
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'interviewed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'shortlisted': return 'bg-green-100 text-green-800 border-green-200';
      case 'hired': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'interviewed': return <Eye size={14} />;
      case 'shortlisted': return <Star size={14} />;
      case 'hired': return <Award size={14} />;
      case 'rejected': return <X size={14} />;
      default: return null;
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email?.toLowerCase().includes(searchTerm.toLowerCase());
    // Backend candidates might not have status/position fields yet
    return matchesSearch;
  });

  const stats = [
    {
      label: 'Total Candidates',
      value: candidates.length,
      icon: Users,
      color: '#BB6C43',
      bgColor: 'bg-gray-50'
    },
    {
      label: 'Active',
      value: candidates.length,
      icon: Star,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'This Month',
      value: candidates.filter(c => {
        if (!c.created_at) return false;
        const candidateDate = new Date(c.created_at);
        const now = new Date();
        return candidateDate.getMonth() === now.getMonth() && candidateDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Recent',
      value: candidates.filter(c => {
        if (!c.created_at) return false;
        const candidateDate = new Date(c.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return candidateDate > weekAgo;
      }).length,
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{borderColor: '#CCB499', borderTopColor: '#BB6C43'}}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Candidates</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadCandidates}
            className="px-4 py-2 rounded-lg text-white"
            style={{backgroundColor: '#BB6C43'}}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>
              Candidate Management
            </h1>
            <p style={{ color: '#6b7280' }} className="mt-1">Manage and track all candidate applications</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="btn btn-secondary"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload size={16} />
              <span>Import</span>
            </button>
            <input 
              id="file-input" 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }} 
              onChange={handleImport}
            />
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} />
              <span>Export</span>
            </button>

            <button 
              className="btn btn-primary"
              onClick={() => {
                console.log('Add Candidate button clicked');
                setShowAddModal(true);
              }}
            >
              <Plus size={16} />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8" style={{color: stat.color}} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 rounded-lg px-4 py-2" style={{backgroundColor: '#EBEFFE'}}>
              <Search className="text-[#BB6C43] flex-shrink-0" size={20} />
              <input
                type="text"
                placeholder="Search candidates by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-0 outline-0 bg-transparent text-[#4A413C] placeholder-gray-500"
                style={{
                  backgroundColor: 'transparent',
                  color: '#4A413C',
                  border: 'none',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="interviewed">Interviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
          >
            <option value="">Experience Level</option>
            <option value="0-2">0-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5+">5+ years</option>
          </select>

          <select
            className="px-3 py-2 rounded-lg min-w-0 flex-shrink-0"
            style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}
          >
            <option value="">Rating</option>
            <option value="4+">4+ Stars</option>
            <option value="3+">3+ Stars</option>
            <option value="2+">2+ Stars</option>
          </select>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold" style={{backgroundColor: '#BB6C43'}}>
                  {candidate.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{candidate.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-600">Candidate</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" style={{color: '#C8906D'}} />
                <span className="text-xs font-medium text-gray-700">
                  {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} />
                <span>{candidate.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={14} />
                <span>Added {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-md" style={{backgroundColor: '#EBEFFE', color: '#4A413C'}}>
                  Candidate
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-md" style={{backgroundColor: '#CCB499', color: '#4A413C'}}>
                  Active
                </span>
              </div>
            </div>

            {/* Status and Date */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1" style={{backgroundColor: '#EBEFFE', color: '#4A413C', borderColor: '#CCB499'}}>
                <Users size={12} />
                Active
              </span>
              <span className="text-xs text-gray-500">ID: #{candidate.id}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button 
                className="flex-1 btn btn-secondary text-sm py-2"
                onClick={() => openViewModal(candidate)}
              >
                <Eye size={14} />
                View
              </button>
              <button 
                className="flex-1 btn btn-primary text-sm py-2"
                onClick={() => openEditModal(candidate)}
              >
                <Edit size={14} />
                Edit
              </button>
              <button 
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => openDeleteModal(candidate)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCandidates.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
          <p className="text-gray-600 mb-6">No candidates match your current search criteria.</p>
          <button 
            className="px-4 py-2 text-white rounded-lg"
            style={{backgroundColor: '#BB6C43'}}
            onClick={() => setShowAddModal(true)}
          >
            Add New Candidate
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{borderColor: '#CCB499', borderTopColor: '#BB6C43'}}></div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Candidates</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadCandidates}
              className="px-4 py-2 rounded-lg text-white"
              style={{backgroundColor: '#BB6C43'}}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
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
            console.log('Modal overlay clicked');
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
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
              padding: '24px',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add New Candidate</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter candidate name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Years of experience"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter skills (comma-separated)"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.resume_text}
                  onChange={(e) => setFormData({...formData, resume_text: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste resume content or key qualifications here (required for AI interviews)"
                  rows={5}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This content will be used by the AI to generate personalized interview questions.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCandidate}
                className="flex-1 px-4 py-2 text-white rounded-lg"
                style={{backgroundColor: '#BB6C43'}}
              >
                Add Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {showEditModal && (
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
              setShowEditModal(false);
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
              padding: '24px',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Candidate</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume Content</label>
                <textarea
                  value={formData.resume_text}
                  onChange={(e) => setFormData({...formData, resume_text: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Resume content for AI interview questions"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditCandidate}
                className="flex-1 px-4 py-2 text-white rounded-lg"
                style={{backgroundColor: '#BB6C43'}}
              >
                Update Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Candidate Modal */}
      {showViewModal && selectedCandidate && (
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
              setShowViewModal(false);
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
              padding: '24px',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Candidate Details</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <p className="text-gray-900">{selectedCandidate.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <p className="text-gray-900">{selectedCandidate.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Phone:</span>
                <p className="text-gray-900">{selectedCandidate.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Location:</span>
                <p className="text-gray-900">{selectedCandidate.location || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Experience:</span>
                <p className="text-gray-900">{selectedCandidate.experience_years || 0} years</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Skills:</span>
                <p className="text-gray-900">{selectedCandidate.skills || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Created:</span>
                <p className="text-gray-900">{selectedCandidate.created_at ? new Date(selectedCandidate.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedCandidate);
                }}
                className="flex-1 px-4 py-2 text-white rounded-lg"
                style={{backgroundColor: '#BB6C43'}}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCandidate && (
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
              setShowDeleteModal(false);
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
              <h3 className="text-xl font-bold text-gray-900">Delete Candidate</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedCandidate.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteCandidate}
                className="flex-1 px-4 py-2 bg-red-500 text-black rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCandidates;