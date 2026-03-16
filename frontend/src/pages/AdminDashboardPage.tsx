import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentApi, loanApi, authApi } from '../api';
import { 
  BookMarked, 
  Users, 
  Clock, 
  AlertTriangle,
  LayoutDashboard,
  Library,
  UserCog,
  History,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => documentApi.getStats().then(res => res.data),
  });

  const { data: recentLoans, isLoading: loansLoading } = useQuery({
    queryKey: ['all-loans'],
    queryFn: () => loanApi.list().then(res => res.data),
  });

  const dashboardCards = [
    { 
      label: 'Total Documents', 
      value: stats?.total_documents || 0, 
      icon: BookMarked, 
      color: 'blue', 
      path: '/admin/documents' 
    },
    { 
      label: 'Active Loans', 
      value: stats?.active_loans || 0, 
      icon: Clock, 
      color: 'orange', 
      path: '/admin/loans' 
    },
    { 
      label: 'Registered Users', 
      value: stats?.total_users || 0, 
      icon: Users, 
      color: 'green', 
      path: '/admin/users' 
    },
    { 
      label: 'Overdue Books', 
      value: stats?.overdue_loans || 0, 
      icon: AlertTriangle, 
      color: 'red', 
      path: '/admin/loans' 
    },
  ];

  const quickActions = [
    { label: 'Add New Book', icon: PlusCircle, path: '/admin/documents/new', color: 'primary' },
    { label: 'Manage Inventory', icon: Library, path: '/admin/documents', color: 'gray' },
    { label: 'User Permissions', icon: UserCog, path: '/admin/users', color: 'gray' },
    { label: 'Export Reports', icon: FileText, path: '#', color: 'gray' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary-600" />
            Librarian Command Center
          </h1>
          <p className="text-gray-500 mt-1">Real-time overview of library operations and inventory.</p>
        </div>
        <div className="flex gap-3">
           <Link 
            to="/admin/documents/new"
            className="px-6 py-3 bg-primary-900 text-white font-bold rounded-xl shadow-lg shadow-primary-900/20 hover:bg-primary-800 transition-all flex items-center gap-2"
           >
             <PlusCircle className="w-5 h-5" />
             Register New Document
           </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card) => (
          <Link 
            key={card.label} 
            to={card.path}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-primary-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                card.color === 'blue' && "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                card.color === 'orange' && "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
                card.color === 'green' && "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white",
                card.color === 'red' && "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white"
              )}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-2xl font-black text-primary-900">{statsLoading ? '...' : card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-primary-900 flex items-center gap-2">
                <History className="w-5 h-5 text-primary-500" />
                Live Loan Monitoring
              </h3>
              <Link to="/admin/loans" className="text-xs font-bold text-primary-600 hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loansLoading ? (
                <div className="p-8 text-center text-gray-400">Loading activity...</div>
              ) : recentLoans?.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No active loans found.</div>
              ) : (
                recentLoans?.slice(0, 5).map((loan: any) => (
                  <div key={loan.id} className="px-8 py-5 flex items-center gap-4 hover:bg-gray-50/30 transition-colors">
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      loan.status === 'active' ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-500"
                    )}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary-900 truncate">
                        <span className="font-bold">User {loan.user_id.slice(0,5)}</span> borrowed <span className="font-bold">{loan.document?.title}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {loan.status === 'active' ? `Due on ${new Date(loan.due_date).toLocaleDateString()}` : `Returned on ${new Date(loan.return_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <span className={clsx(
                      "px-2 py-1 text-[9px] font-bold rounded-lg uppercase border",
                      loan.status === 'active' ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-green-50 text-green-700 border-green-100"
                    )}>
                      {loan.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <section className="bg-primary-900 rounded-3xl p-8 text-white shadow-xl shadow-primary-900/30 relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
               <p className="text-primary-300 text-sm mb-6">Common library management tasks.</p>
               <div className="space-y-3">
                 {quickActions.map(action => (
                   <Link 
                    key={action.label} 
                    to={action.path}
                    className="flex items-center gap-3 p-4 bg-primary-800/50 rounded-2xl hover:bg-primary-800 transition-all border border-primary-700/50 group"
                   >
                     <action.icon className="w-5 h-5 text-primary-300 group-hover:text-white" />
                     <span className="text-sm font-bold">{action.label}</span>
                   </Link>
                 ))}
               </div>
             </div>
             <div className="absolute -bottom-6 -right-6 opacity-10">
                <Library className="w-32 h-32" />
             </div>
           </section>

           <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
             <h3 className="font-bold text-primary-900 mb-4">Inventory Status</h3>
             <div className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold">
                     <span className="text-gray-500 uppercase tracking-widest">Available</span>
                     <span className="text-primary-900">84%</span>
                   </div>
                   <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="w-[84%] h-full bg-green-500" />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold">
                     <span className="text-gray-500 uppercase tracking-widest">Digital Content</span>
                     <span className="text-primary-900">62%</span>
                   </div>
                   <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="w-[62%] h-full bg-blue-500" />
                   </div>
                </div>
             </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
