import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Video,
  Mail,
  BarChart3,
  Settings,
  User,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface CleanNavbarProps {
  children: React.ReactNode;
}

const CleanNavbar: React.FC<CleanNavbarProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Candidates', href: '/admin/candidates', icon: Users },
    { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
    { name: 'Sessions', href: '/admin/sessions', icon: Video },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">InterviewAI</span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive(item.href)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600'
                      }`}
                    >
                      <Icon size={16} className="mr-2" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all"
                  />
                </div>
              </div>

              {/* Notifications */}
              <button className="p-2 text-gray-400 rounded-lg">
                <Bell size={20} />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 text-sm rounded-lg"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-600" />
                  </div>
                  <span className="hidden md:block font-medium text-gray-700">Admin</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700">
                      <User size={16} className="mr-3" />
                      Profile
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700">
                      <Settings size={16} className="mr-3" />
                      Settings
                    </a>
                    <hr className="my-1 border-gray-200" />
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-red-600">
                      <LogOut size={16} className="mr-3" />
                      Sign out
                    </a>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 rounded-lg"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.href)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default CleanNavbar;