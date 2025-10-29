import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  Award,
  Activity,
  Clock,
  Target,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  Filter,
  MoreHorizontal,
  Star,
  Zap,
  ChevronRight
} from 'lucide-react';

const ModernDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      id: 1,
      title: 'Total Candidates',
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 2,
      title: 'Active Jobs',
      value: '48',
      change: '+8.2%',
      trend: 'up',
      icon: Briefcase,
      color: 'from-emerald-500 to-teal-400',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      id: 3,
      title: 'Interviews Today',
      value: '23',
      change: '-4.1%',
      trend: 'down',
      icon: Calendar,
      color: 'from-orange-500 to-amber-400',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      id: 4,
      title: 'Success Rate',
      value: '87.3%',
      change: '+2.4%',
      trend: 'up',
      icon: Award,
      color: 'from-purple-500 to-pink-400',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'Sarah Johnson',
      action: 'Completed interview for Senior Developer position',
      time: '2 minutes ago',
      avatar: 'SJ',
      color: 'bg-blue-500'
    },
    {
      id: 2,
      user: 'Michael Chen',
      action: 'Applied for Product Manager role',
      time: '15 minutes ago',
      avatar: 'MC',
      color: 'bg-emerald-500'
    },
    {
      id: 3,
      user: 'Emily Rodriguez',
      action: 'Scheduled interview for tomorrow',
      time: '1 hour ago',
      avatar: 'ER',
      color: 'bg-purple-500'
    },
    {
      id: 4,
      user: 'David Wilson',
      action: 'Updated profile information',
      time: '3 hours ago',
      avatar: 'DW',
      color: 'bg-orange-500'
    }
  ];

  const upcomingInterviews = [
    {
      id: 1,
      candidate: 'Alex Thompson',
      position: 'Frontend Developer',
      time: '10:00 AM',
      type: 'Technical',
      avatar: 'AT'
    },
    {
      id: 2,
      candidate: 'Maria Garcia',
      position: 'UX Designer',
      time: '2:30 PM',
      type: 'Portfolio Review',
      avatar: 'MG'
    },
    {
      id: 3,
      candidate: 'James Brown',
      position: 'Full Stack Engineer',
      time: '4:00 PM',
      type: 'System Design',
      avatar: 'JB'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-blue-600/90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Good morning, Admin! ☀️</h1>
              <p className="text-white/90 text-lg mb-6">
                Ready to manage your interview pipeline? You have 5 interviews scheduled today.
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                  <Clock size={16} />
                  <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/30 rounded-full px-4 py-2">
                  <Activity size={16} />
                  <span>All Systems Online</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-500/30 rounded-full px-4 py-2">
                  <Zap size={16} />
                  <span>AI Analysis Ready</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 flex gap-3">
              <button className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300">
                <Download size={18} />
                <span>Export Data</span>
              </button>
              <button className="bg-white text-purple-600 hover:bg-gray-50 px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 font-semibold">
                <Eye size={18} />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} className={stat.textColor} />
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {stat.trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {stat.change}
              </div>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
            <p className="text-gray-600 font-medium">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activities</h2>
            <button className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center text-white font-semibold text-sm`}>
                  {activity.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{activity.user}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-sm">{activity.time}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{activity.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Today's Interviews</h2>
            <Calendar size={20} className="text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {upcomingInterviews.map((interview) => (
              <div key={interview.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                    {interview.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{interview.candidate}</p>
                    <p className="text-sm text-gray-600">{interview.position}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600 font-medium">{interview.time}</span>
                  <span className="bg-white px-2 py-1 rounded-md text-gray-700">{interview.type}</span>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all">
            View Full Schedule
          </button>
        </div>
      </div>

      {/* Performance Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group">
              <Users size={24} className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-gray-900">Add Candidate</p>
              <p className="text-sm text-gray-600">Import new profiles</p>
            </button>
            
            <button className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-emerald-200 transition-all group">
              <Briefcase size={24} className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-gray-900">Post Job</p>
              <p className="text-sm text-gray-600">Create new opening</p>
            </button>
            
            <button className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all group">
              <Calendar size={24} className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-gray-900">Schedule</p>
              <p className="text-sm text-gray-600">Book interview</p>
            </button>
            
            <button className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all group">
              <Target size={24} className="text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-gray-900">Analytics</p>
              <p className="text-sm text-gray-600">View insights</p>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">System Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-900">AI Interview Engine</span>
              </div>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-900">Video Platform</span>
              </div>
              <span className="text-green-600 font-medium">Online</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-900">Email Service</span>
              </div>
              <span className="text-blue-600 font-medium">Syncing</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-900">Database</span>
              </div>
              <span className="text-green-600 font-medium">Healthy</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">99.9% Uptime</span>
            </div>
            <p className="text-sm text-gray-600">All systems running smoothly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;