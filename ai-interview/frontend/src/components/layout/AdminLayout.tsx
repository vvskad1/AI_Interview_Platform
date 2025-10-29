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
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import Footer from './Footer';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const navItems: NavItem[] = [
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
    <div className="min-h-screen flex" style={{backgroundColor: '#EBEFFE'}}>
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{backgroundColor: '#CCB499'}}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b" style={{borderBottomColor: '#BB6C43'}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#BB6C43'}}>
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">AI Interview</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActiveRoute(item.path)
                  ? 'shadow-sm'
                  : 'hover:bg-opacity-50'
                }
              `}
              style={isActiveRoute(item.path) 
                ? {backgroundColor: '#BB6C43', color: '#EBEFFE'} 
                : {color: '#4A413C'}
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-1 text-xs font-semibold bg-primary-light text-primary rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Settings */}
        <div className="border-t border-gray-200 p-4">
          <NavLink
            to="/admin/settings"
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActiveRoute('/admin/settings')
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="border-b shadow-sm" style={{backgroundColor: '#C8906D', borderBottomColor: '#BB6C43'}}>
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile menu button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-opacity-50"
                style={{color: '#4A413C'}}
              >
                <Menu size={20} />
              </button>

              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-80 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-opacity-50 transition-colors" style={{color: '#4A413C'}}>
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{backgroundColor: '#BB6C43'}}></span>
              </button>

              {/* Profile dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-opacity-50 transition-colors" style={{color: '#4A413C'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#BB6C43'}}>
                    <User size={16} style={{color: '#EBEFFE'}} />
                  </div>
                  <span className="hidden md:block text-sm font-medium">Admin User</span>
                </button>

                {/* Dropdown menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                      <User size={16} />
                      Profile
                    </a>
                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                      <Settings size={16} />
                      Settings
                    </a>
                    <hr className="my-2 border-gray-200" />
                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error-light">
                      <LogOut size={16} />
                      Sign out
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-12 flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;