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
  User,
  LogOut
} from 'lucide-react';

interface WarmNavbarProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

const WarmNavbar: React.FC<WarmNavbarProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      path: '/admin/dashboard'
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: <Users size={18} />,
      path: '/admin/candidates'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: <Briefcase size={18} />,
      path: '/admin/jobs'
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <PlayCircle size={18} />,
      path: '/admin/sessions'
    },
    {
      id: 'invites',
      label: 'Invites',
      icon: <Mail size={18} />,
      path: '/admin/invites'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 size={18} />,
      path: '/admin/reports'
    }
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#EBEFFE'}}>
      {/* Top Navigation Bar */}
      <nav className="shadow-sm border-b" style={{backgroundColor: '#C8906D', borderBottomColor: '#BB6C43'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: '#BB6C43'}}>
                <span className="text-lg font-bold" style={{color: '#EBEFFE'}}>A</span>
              </div>
              <span className="text-xl font-bold" style={{color: '#4A413C'}}>Exatech Admin Panel</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActiveRoute(item.path)
                      ? 'shadow-sm'
                      : 'hover:bg-opacity-50'
                    }
                  `}
                  style={isActiveRoute(item.path) 
                    ? {backgroundColor: '#BB6C43', color: '#EBEFFE'} 
                    : {color: '#4A413C'}
                  }
                  onMouseEnter={(e) => {
                    if (!isActiveRoute(item.path)) {
                      e.currentTarget.style.backgroundColor = 'rgba(74, 65, 60, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveRoute(item.path)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item.icon}
                  <span className="hidden lg:block">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-1 text-xs font-semibold rounded-full" 
                          style={{backgroundColor: '#CCB499', color: '#4A413C'}}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Profile dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-opacity-50 transition-colors" 
                        style={{color: '#4A413C'}}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 65, 60, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#BB6C43'}}>
                    <User size={16} style={{color: '#EBEFFE'}} />
                  </div>
                  <span className="hidden lg:block text-sm font-medium">Admin</span>
                </button>

                {/* Dropdown menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                     style={{borderColor: '#CCB499'}}>
                  <div className="py-1">
                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" 
                       style={{color: '#4A413C'}}>
                      <Settings size={16} />
                      Settings
                    </a>
                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" 
                       style={{color: '#4A413C'}}>
                      <LogOut size={16} />
                      Logout
                    </a>
                  </div>
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-opacity-50 transition-colors"
                style={{color: '#4A413C'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 65, 60, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{borderTopColor: '#BB6C43', backgroundColor: '#CCB499'}}>
            <div className="px-2 pt-2 pb-3 space-y-1">
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
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-1 text-xs font-semibold rounded-full"
                          style={{backgroundColor: '#BB6C43', color: '#EBEFFE'}}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default WarmNavbar;