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
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  HelpCircle,
  Zap
} from 'lucide-react';

interface ModernSidebarProps {
  children: React.ReactNode;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileDropdownOpen(false);
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      path: '/admin/dashboard',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: <Users size={20} />,
      path: '/admin/candidates',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: <Briefcase size={20} />,
      path: '/admin/jobs',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'invites',
      label: 'Invites',
      icon: <Mail size={20} />,
      path: '/admin/invites',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <PlayCircle size={20} />,
      path: '/admin/sessions',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 size={20} />,
      path: '/admin/reports',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-white shadow-2xl transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:shadow-xl
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-72'}
        w-72
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    InterviewAI
                  </h1>
                  <p className="text-xs text-gray-500">Smart Hiring Platform</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  group flex items-center gap-3 p-4 rounded-xl transition-all duration-200 relative
                  ${isActiveRoute(item.path)
                    ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${isSidebarCollapsed ? 'justify-center' : ''}
                `}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isActiveRoute(item.path)
                    ? 'bg-white/20'
                    : 'bg-gray-100 group-hover:bg-gray-200'
                  }
                `}>
                  {item.icon}
                </div>
                {!isSidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Settings & Profile */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <NavLink
              to="/admin/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 p-4 rounded-xl transition-all duration-200
                ${isActiveRoute('/admin/settings')
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
              title={isSidebarCollapsed ? 'Settings' : ''}
            >
              <div className={`
                p-2 rounded-lg transition-colors
                ${isActiveRoute('/admin/settings')
                  ? 'bg-white/20'
                  : 'bg-gray-100 hover:bg-gray-200'
                }
              `}>
                <Settings size={20} />
              </div>
              {!isSidebarCollapsed && (
                <span className="font-medium">Settings</span>
              )}
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            {/* Mobile Menu Button - Only show on mobile/tablet */}
            <button
              className="md:hidden p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop Sidebar Toggle - Show on larger screens */}
            <div className="hidden md:flex items-center gap-4">
              <button
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <Menu size={20} />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">
                {location.pathname.split('/').pop()?.charAt(0).toUpperCase() + location.pathname.split('/').pop()?.slice(1) || 'Dashboard'}
              </h2>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  }}
                >
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <span className="font-medium hidden md:block">Admin</span>
                  <ChevronDown size={16} className="hidden md:block" />
                </button>

                {/* Dropdown Menu */}
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
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Menu Close Button */}
      {isMobileMenuOpen && (
        <button
          className="fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={24} />
        </button>
      )}
    </div>
  );
};

export default ModernSidebar;