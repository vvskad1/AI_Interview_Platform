import React from 'react';
import { Briefcase, Plus, Search, Filter, Eye, Edit, Trash2, MapPin, Calendar, Clock } from 'lucide-react';

const Jobs: React.FC = () => {
  const mockJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      applicants: 45,
      status: 'Active',
      postedDate: '2024-10-08'
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      location: 'New York, NY',
      type: 'Full-time',
      applicants: 32,
      status: 'Active',
      postedDate: '2024-10-07'
    },
    {
      id: 3,
      title: 'UX Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Contract',
      applicants: 28,
      status: 'Draft',
      postedDate: '2024-10-06'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Closed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Job Management
            </h1>
            <p className="text-gray-600 mt-1">Create and manage job postings</p>
          </div>
          
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">3</p>
              <p className="text-xs text-gray-600 font-medium">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">105</p>
              <p className="text-xs text-gray-600 font-medium">Applicants</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">1</p>
              <p className="text-xs text-gray-600 font-medium">This Week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">2</p>
              <p className="text-xs text-gray-600 font-medium">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <MapPin size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">5</p>
              <p className="text-xs text-gray-600 font-medium">Locations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Briefcase size={18} className="text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">8</p>
              <p className="text-xs text-gray-600 font-medium">Departments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs by title, department, or location..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl placeholder:text-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <button className="btn btn-secondary flex items-center gap-2">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">All Jobs</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {mockJobs.map((job) => (
            <div key={job.id} className="p-6 hover-border rounded-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center text-white font-semibold">
                      {job.title.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Briefcase size={14} />
                          <span>{job.department}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          {job.applicants} applicants
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 rounded-lg">
                    <Eye size={18} />
                  </button>
                  <button className="p-2 text-gray-400 rounded-lg">
                    <Edit size={18} />
                  </button>
                  <button className="p-2 text-gray-400 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Jobs;