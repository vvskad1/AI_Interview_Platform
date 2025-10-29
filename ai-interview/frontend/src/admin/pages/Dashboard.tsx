import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Award, 
  TrendingUp, 
  Activity, 
  Clock, 
  BarChart3,
  Target,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Download,
  Settings
} from 'lucide-react';
import { apiClient, AdminStats } from '../../api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await apiClient.getAdminStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
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
      {/* Clean Header Section */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-olive-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-olive-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{getTimeOfDayGreeting()}, Admin!</h1>
                <span className="text-2xl lg:text-3xl">👋</span>
              </div>
              <p className="text-gray-600 text-lg mb-4">
                Welcome to your AI Interview Platform Dashboard
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-3 py-2">
                  <Activity className="w-4 h-4" />
                  <span>All Systems Online</span>
                </div>
                <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{backgroundColor: '#CCB499', color: '#4A413C'}}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button className="bg-olive-500 hover:bg-olive-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Clean Analytics Cards */}
      <div className="grid grid-cols-4 gap-6">
        {/* Total Candidates Card */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-olive-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-olive-600" />
            </div>
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              +8.2%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.candidates || 0}</div>
          <div className="text-sm font-medium text-gray-600 mb-3">Total Candidates</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-olive-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((stats?.candidates || 0) / 100 * 100, 100)}%` }}></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">{Math.round(Math.min((stats?.candidates || 0) / 100 * 100, 100))}% of target</div>
        </div>

        {/* Active Jobs Card */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#CCB499'}}>
              <Briefcase className="w-6 h-6" style={{color: '#BB6C43'}} />
            </div>
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.jobs || 0}</div>
          <div className="text-sm font-medium text-gray-600 mb-3">Active Jobs</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-500" style={{backgroundColor: '#BB6C43', width: `${Math.min((stats?.jobs || 0) / 20 * 100, 100)}%`}}></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">{Math.round(Math.min((stats?.jobs || 0) / 20 * 100, 100))}% capacity utilized</div>
        </div>

        {/* Scheduled Interviews Card */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              -2.1%
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.invites || 0}</div>
          <div className="text-sm font-medium text-gray-600 mb-3">Total Invites</div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs font-medium text-orange-700">Next Interview:</div>
            <div className="text-sm font-semibold text-orange-800">Today 2:00 PM</div>
          </div>
        </div>

        {/* Average Score Card */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
              <Zap className="w-3 h-3" />
              Excellent
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.active_sessions || 0}</div>
          <div className="text-sm font-medium text-gray-600 mb-3">Active Sessions</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full transition-all duration-500" style={{ backgroundColor: '#C8906D', width: `${Math.min((stats?.active_sessions || 0) / 10 * 100, 100)}%` }}></div>
            </div>
            <div className="text-xs font-semibold" style={{color: '#C8906D'}}>{stats?.active_sessions || 0}/10</div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6" style={{color: '#BB6C43'}} />
                <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
              </div>
              <button className="text-sm font-medium flex items-center gap-1 hover:opacity-80" style={{color: '#BB6C43'}}>
                View Details <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3">Recruitment Funnel</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Applications</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full w-full" style={{backgroundColor: '#BB6C43'}}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">245</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Interviewed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">148</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Hired</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">34</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3">System Health</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">API Response</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">98ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Uptime</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#BB6C43'}}></div>
                      <span className="text-sm text-gray-700">Active Users</span>
                    </div>
                    <span className="text-sm font-medium" style={{color: '#BB6C43'}}>23</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">New candidate registered</div>
                  <div className="text-xs text-gray-500 mt-1">John Smith applied for Senior Developer</div>
                  <div className="text-xs text-gray-400 mt-1">2 minutes ago</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#CCB499'}}>
                  <Calendar className="w-4 h-4" style={{color: '#BB6C43'}} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Interview completed</div>
                  <div className="text-xs text-gray-500 mt-1">Sarah Johnson - React Developer</div>
                  <div className="text-xs text-gray-400 mt-1">1 hour ago</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">High score achieved</div>
                  <div className="text-xs text-gray-500 mt-1">Mike Chen scored 9.2/10</div>
                  <div className="text-xs text-gray-400 mt-1">2 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">New job posted</div>
                  <div className="text-xs text-gray-500 mt-1">Product Manager position</div>
                  <div className="text-xs text-gray-400 mt-1">3 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;