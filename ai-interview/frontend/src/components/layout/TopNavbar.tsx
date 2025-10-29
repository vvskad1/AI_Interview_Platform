import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Mail,
  PlayCircle,
  BarChart3,
  User,
  ChevronDown,
  LogOut,
  HelpCircle,
  Zap,
  Menu,
  X
} from 'lucide-react';

interface TopNavbarProps {
  children: React.ReactNode;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ children }) => {
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background-color)' }}>
      {/* Top Navigation Bar */}
      <nav className="shadow-lg sticky top-0 z-50" style={{ background: 'var(--primary-gradient)' }}>
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white">
                    InterviewAI
                  </h1>
                  <p className="text-xs text-white text-opacity-80 hidden sm:block">Smart Hiring Platform</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Dashboard */}
              <NavLink
                to="/admin/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActiveRoute('/admin/dashboard')
                    ? 'bg-white bg-opacity-20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </NavLink>

              {/* Candidates */}
              <NavLink
                to="/admin/candidates"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActiveRoute('/admin/candidates')
                    ? 'bg-white bg-opacity-20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Users size={18} />
                Candidates
              </NavLink>

              {/* Jobs */}
              <NavLink
                to="/admin/jobs"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActiveRoute('/admin/jobs')
                    ? 'bg-white bg-opacity-20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Briefcase size={18} />
                Jobs
              </NavLink>

              {/* Sessions */}
              <NavLink
                to="/admin/sessions"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActiveRoute('/admin/sessions')
                    ? 'bg-white bg-opacity-20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <PlayCircle size={18} />
                Sessions
              </NavLink>

              {/* Reports */}
              <NavLink
                to="/admin/reports"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActiveRoute('/admin/reports')
                    ? 'bg-white bg-opacity-20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <BarChart3 size={18} />
                Reports
              </NavLink>
            </div>

            {/* Right Side - Profile */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-2 rounded-xl bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all shadow-lg backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  }}
                >
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <span className="font-medium hidden sm:block">Admin</span>
                  <ChevronDown size={14} className="hidden sm:block" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">Admin User</p>
                      <p className="text-sm text-gray-500">admin@example.com</p>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                      <User size={18} />
                      Profile Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                      <HelpCircle size={18} />
                      Help & Support
                    </button>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-2">
              {/* Dashboard */}
              <NavLink
                to="/admin/dashboard"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute('/admin/dashboard')
                    ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18} />
                  Dashboard
                </div>
              </NavLink>

              {/* Candidates */}
              <NavLink
                to="/admin/candidates"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute('/admin/candidates')
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  Candidates
                </div>
              </NavLink>

              {/* Jobs */}
              <NavLink
                to="/admin/jobs"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute('/admin/jobs')
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase size={18} />
                  Jobs
                </div>
              </NavLink>

              {/* Sessions */}
              <NavLink
                to="/admin/sessions"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute('/admin/sessions')
                    ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlayCircle size={18} />
                  Sessions
                </div>
              </NavLink>

              {/* Invites */}
              <NavLink
                to="/admin/invites"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute('/admin/invites')
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Mail size={18} />
                  Invites
                </div>
              </NavLink>

              {/* Reports */}
              <NavLink
                to="/admin/reports"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute('/admin/reports')
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={18} />
                  Reports
                </div>
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

export default TopNavbar;