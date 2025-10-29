import React from 'react';
import { Video, Plus, Search, Filter, Play, Calendar, Clock, Users, Settings } from 'lucide-react';

const Sessions: React.FC = () => {
  const mockSessions = [
    {
      id: 1,
      title: 'Frontend Developer Interview',
      candidate: 'John Smith',
      job: 'Senior Frontend Developer',
      date: '2024-10-15',
      time: '14:00',
      duration: 60,
      status: 'Scheduled',
      type: 'Technical'
    },
    {
      id: 2,
      title: 'Product Manager Behavioral',
      candidate: 'Sarah Johnson',
      job: 'Product Manager',
      date: '2024-10-14',
      time: '10:00',
      duration: 45,
      status: 'Completed',
      type: 'Behavioral'
    },
    {
      id: 3,
      title: 'UX Designer Portfolio Review',
      candidate: 'Mike Chen',
      job: 'UX Designer',
      date: '2024-10-16',
      time: '16:30',
      duration: 45,
      status: 'Scheduled',
      type: 'Portfolio'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Technical': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Behavioral': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Portfolio': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Interview Sessions
            </h1>
            <p className="text-gray-600 mt-1">Manage and monitor interview sessions</p>
          </div>
          
          <button className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">2</p>
              <p className="text-xs text-gray-600 font-medium">Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">15</p>
              <p className="text-xs text-gray-600 font-medium">This Week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">8</p>
              <p className="text-xs text-gray-600 font-medium">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">45</p>
              <p className="text-xs text-gray-600 font-medium">Avg Min</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Play size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">3</p>
              <p className="text-xs text-gray-600 font-medium">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Settings size={18} className="text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">12</p>
              <p className="text-xs text-gray-600 font-medium">Scheduled</p>
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
                placeholder="Search sessions by candidate, job title, or interviewer..."
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

      {/* Sessions List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">All Sessions</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {mockSessions.map((session) => (
            <div key={session.id} className="p-6 hover-border rounded-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-semibold">
                      <Video size={24} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{session.candidate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{session.time} ({session.duration} min)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(session.type)}`}>
                          {session.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {session.job}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {session.status === 'Scheduled' && (
                    <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 text-sm font-medium">
                      <Play size={16} />
                      Start
                    </button>
                  )}
                  
                  <button className="p-2 text-gray-400 rounded-lg">
                    <Settings size={18} />
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

export default Sessions;