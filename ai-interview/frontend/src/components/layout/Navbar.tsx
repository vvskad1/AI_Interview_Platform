import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Mail,
  PlayCircle,
  BarChart3,
  Settings,
  Bell,
  Search,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      path: '/admin/dashboard'
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: <Users size={20} />,
      path: '/admin/candidates'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: <Briefcase size={20} />,
      path: '/admin/jobs'
    },
    {
      id: 'invites',
      label: 'Invites',
      icon: <Mail size={20} />,
      path: '/admin/invites'
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <PlayCircle size={20} />,
      path: '/admin/sessions'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 size={20} />,
      path: '/admin/reports'
    }
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50" style={{borderColor: '#e8ebd7'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6b7c3c 0%, #8b9467 100%)'}}>
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold" style={{background: 'linear-gradient(135deg, #6b7c3c 0%, #8b9467 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                  Interview Platform
                </h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActiveRoute(item.path)
                    ? 'shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={isActiveRoute(item.path) 
                  ? {backgroundColor: '#f4f6ed', color: '#6b7c3c'} 
                  : {}}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent w-64"
                  style={{borderColor: '#e8ebd7', '--tw-ring-color': '#6b7c3c'} as any}
                />
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative">
              <Bell size={20} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-gray-900">Admin User</div>
                  <div className="text-xs text-gray-500">admin@company.com</div>
                </div>
                <ChevronDown size={16} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">Admin User</div>
                    <div className="text-xs text-gray-500">admin@company.com</div>
                  </div>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                  isActiveRoute(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
              </NavLink>
            ))}
          </div>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 lg:hidden">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;