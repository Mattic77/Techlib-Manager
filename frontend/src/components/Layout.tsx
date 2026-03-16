import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Home, 
  Library, 
  MessageSquare, 
  BookOpen, 
  LogOut,
  User as UserIcon,
  Search,
  LayoutDashboard,
  ShieldCheck,
  History,
  Users as UsersIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserRole } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Catalog', path: '/catalog', icon: Library },
    { name: 'My Loans', path: '/loans', icon: BookOpen },
    { name: 'AI Assistant', path: '/chat', icon: MessageSquare },
  ];

  const adminItems = [
    { name: 'Command Center', path: '/admin', icon: LayoutDashboard },
    { name: 'Inventory', path: '/admin/documents', icon: ShieldCheck },
    { name: 'Active Loans', path: '/admin/loans', icon: History },
    { name: 'User Management', path: '/admin/users', icon: UsersIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Library className="w-8 h-8 text-primary-300" />
            TechLib
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
          <nav className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2">Library</p>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  location.pathname === item.path 
                    ? "bg-primary-800 text-white shadow-lg shadow-black/10" 
                    : "text-primary-300 hover:bg-primary-800/50 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {user?.role !== UserRole.READER && (
            <nav className="space-y-1">
              <p className="px-4 text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2">Administrative</p>
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    location.pathname.startsWith(item.path) && (item.path !== '/admin' || location.pathname === '/admin')
                      ? "bg-primary-800 text-white shadow-lg shadow-black/10" 
                      : "text-primary-300 hover:bg-primary-800/50 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="p-4 border-t border-primary-800">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl hover:bg-primary-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden text-sm">
              <p className="font-medium truncate group-hover:text-white">{user?.username}</p>
              <p className="text-primary-400 text-xs truncate capitalize">{user?.role}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-primary-300 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
           <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search catalog..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
           </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
