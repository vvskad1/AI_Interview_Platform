import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  MoreHorizontal, 
  Filter,
  FileText,
  Clock,
  TrendingUp,
  Award,
  Target,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Star
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience_years: number;
  skills: string;
  status: string;
  created_at: string;
  rating?: number;
}

interface NewCandidate {
  name: string;
  email: string;
  phone: string;
  location?: string;
  experience_years?: number;
  skills?: string;
  resume?: File;
  resume_text?: string;
}

const CandidatesManagement: React.FC = () => {
  // State management
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Selected items
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);
  
  // Form states
  const [newCandidate, setNewCandidate] = useState<NewCandidate>({
    name: '',
    email: '',
    phone: '',
    location: '',
    experience_years: 0,
    skills: '',
    resume_text: ''
  });
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [submitting, setSubmitting] = useState(false);
  
  // Computed states
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = searchTerm === '' || 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.skills.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === '' || candidate.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    interviewed: candidates.filter(c => c.status === 'interviewed').length,
    hired: candidates.filter(c => c.status === 'hired').length,
    averageScore: candidates.reduce((acc, c) => acc + (c.rating || 0), 0) / candidates.length || 0
  };

  // API functions
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/candidates/');
      if (!response.ok) throw new Error('Failed to fetch candidates');
      const data = await response.json();
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const candidateData = {
        name: newCandidate.name,
        email: newCandidate.email,
        phone: newCandidate.phone,
        location: newCandidate.location,
        experience_years: newCandidate.experience_years,
        skills: newCandidate.skills ? newCandidate.skills.split(',').map(s => s.trim()) : [],
        resume_text: newCandidate.resume_text
      };

      const response = await fetch('/api/admin/candidates/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create candidate');
      }

      // Reset form and close modal
      setNewCandidate({
        name: '',
        email: '',
        phone: '',
        location: '',
        experience_years: 0,
        skills: '',
        resume_text: ''
      });
      setShowAddModal(false);
      
      // Refresh the candidates list
      fetchCandidates();
    } catch (err) {
      setError('Failed to create candidate');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {/* Total Candidates */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Candidates</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">Active pipeline</span>
            </div>
          </div>
        </div>

        {/* Shortlisted */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.shortlisted}</div>
              <div className="text-sm text-gray-500">Shortlisted</div>
            </div>
          </div>
        </div>

        {/* Interviewed */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.interviewed}</div>
              <div className="text-sm text-gray-500">Interviewed</div>
            </div>
          </div>
        </div>

        {/* Hired */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.hired}</div>
              <div className="text-sm text-gray-500">Hired</div>
            </div>
          </div>
        </div>
      </div>



      {/* Candidates Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Candidate Directory
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first candidate.</p>
            <Button onClick={() => setShowAddModal(true)} icon={<UserPlus size={18} />}>
              Add First Candidate
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {candidate.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {candidate.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {candidate.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'hired' ? 'bg-green-100 text-green-700' :
                      candidate.status === 'interviewed' ? 'bg-blue-100 text-blue-700' :
                      candidate.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {candidate.status}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setShowDetailsModal(true);
                      }}
                    >
                      View
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit3 size={14} />}
                      onClick={() => {
                        setEditingCandidate(candidate);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDeletingCandidate(candidate);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header onClose={() => setShowAddModal(false)}>
          Add New Candidate
        </Modal.Header>
        <form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate(prev => ({...prev, name: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate(prev => ({...prev, email: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate(prev => ({...prev, phone: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newCandidate.location}
                    onChange={(e) => setNewCandidate(prev => ({...prev, location: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCandidate.experience_years || ''}
                    onChange={(e) => setNewCandidate(prev => ({...prev, experience_years: parseInt(e.target.value) || 0}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                  <input
                    type="text"
                    placeholder="e.g., React, Python, AWS"
                    value={newCandidate.skills}
                    onChange={(e) => setNewCandidate(prev => ({...prev, skills: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume Text *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Paste the candidate's resume text here. This is required for AI-powered interview question generation."
                  value={newCandidate.resume_text}
                  onChange={(e) => setNewCandidate(prev => ({...prev, resume_text: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 This resume text will be used by the AI system to generate personalized interview questions.
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Candidate
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <Modal.Header onClose={() => setShowDeleteConfirm(false)}>
            Delete Candidate
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete {deletingCandidate?.name}? This action cannot be undone.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => {}}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default CandidatesManagement;