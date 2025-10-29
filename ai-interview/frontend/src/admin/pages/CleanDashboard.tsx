import React from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Target,
  Activity,
  ArrowUp,
  ArrowDown,
  Plus,
  Filter,
  Download
} from 'lucide-react';

const CleanDashboard: React.FC = () => {
  const stats = [
    {
      id: 1,
      name: 'Total Candidates',
      value: '2,847',
      change: '+12.5%',
      changeType: 'increase',
      icon: Users,
      color: 'blue'
    },
    {
      id: 2,
      name: 'Active Jobs',
      value: '48',
      change: '+8.2%',
      changeType: 'increase',
      icon: Briefcase,
      color: 'blue'
    },
    {
      id: 3,
      name: 'Interviews Today',
      value: '23',
      change: '-4.1%',
      changeType: 'decrease',
      icon: Calendar,
      color: 'blue'
    },
    {
      id: 4,
      name: 'Success Rate',
      value: '87.3%',
      change: '+2.4%',
      changeType: 'increase',
      icon: Award,
      color: 'purple'
    },
    {
      id: 5,
      name: 'Avg. Time',
      value: '45 min',
      change: '-5.2%',
      changeType: 'decrease',
      icon: Clock,
      color: 'indigo'
    },
    {
      id: 6,
      name: 'Conversion',
      value: '68.4%',
      change: '+3.1%',
      changeType: 'increase',
      icon: Target,
      color: 'pink'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'interview_completed',
      message: 'Sarah Johnson completed Frontend Developer interview',
      time: '2 minutes ago',
      avatar: 'SJ'
    },
    {
      id: 2,
      type: 'candidate_applied',
      message: 'Michael Chen applied for Product Manager position',
      time: '15 minutes ago',
      avatar: 'MC'
    },
    {
      id: 3,
      type: 'interview_scheduled',
      message: 'Interview scheduled with Emma Davis for UX Designer',
      time: '1 hour ago',
      avatar: 'ED'
    },
    {
      id: 4,
      type: 'job_posted',
      message: 'New job posting: Senior Backend Engineer',
      time: '2 hours ago',
      avatar: 'SYS'
    }
  ];

  const getIconColor = (color: string) => {
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            New Interview
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="card p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${getIconColor(stat.color)}`}>
                  <Icon size={24} />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'increase' ? (
                    <ArrowUp size={16} className="mr-1" />
                  ) : (
                    <ArrowDown size={16} className="mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <button className="btn btn-secondary text-sm">
              <Filter size={16} />
              Filter
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover-border">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">
                  {activity.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <button className="w-full flex items-center p-3 text-left rounded-lg border border-gray-200 hover-border">
              <Users className="w-5 h-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900">Add Candidate</span>
            </button>
            <button className="w-full flex items-center p-3 text-left rounded-lg border border-gray-200 hover-border">
              <Briefcase className="w-5 h-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900">Post New Job</span>
            </button>
            <button className="w-full flex items-center p-3 text-left rounded-lg border border-gray-200 hover-border">
              <Calendar className="w-5 h-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900">Schedule Interview</span>
            </button>
            <button className="w-full flex items-center p-3 text-left rounded-lg border border-gray-200 hover-border">
              <TrendingUp className="w-5 h-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900">View Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Interview Performance</h2>
          <div className="flex space-x-2">
            <button className="btn btn-secondary text-sm">7 days</button>
            <button className="btn btn-secondary text-sm">30 days</button>
            <button className="btn btn-primary text-sm">90 days</button>
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Activity size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Performance chart will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanDashboard;