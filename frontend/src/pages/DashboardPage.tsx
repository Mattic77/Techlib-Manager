import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentApi, aiApi } from '../api';
import { useAuthStore } from '../store/authStore';
import BookCard from '../components/Dashboard/BookCard';
import { 
  BarChart3, 
  Users, 
  BookMarked, 
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { UserRole } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  
  const { data: recommendations, isLoading: recLoading } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: () => aiApi.getRecommendations(user?.id || '').then(res => res.data),
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await documentApi.list();
      const docs = res.data;
      return {
        total: docs.length,
        borrowed: docs.filter((d: any) => !d.availability).length,
      };
    },
    enabled: user?.role !== UserRole.READER,
  });

  const categories = ["Cloud Computing", "Distributed Systems", "Frontend", "Backend", "DevOps", "AI/ML"];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-primary-900 tracking-tight">
            Welcome back, {user?.username} 👋
          </h2>
          <p className="text-gray-500 mt-1">
            Discover your next favorite technical book or ask our AI assistant for help.
          </p>
        </div>
        
        <div className="flex gap-2">
          {categories.slice(0, 4).map(cat => (
            <button key={cat} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-all flex items-center gap-2 shadow-sm">
              <Filter className="w-3 h-3" />
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Librarian Overview (Only for Librarian/Admin) */}
      {user?.role !== UserRole.READER && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookMarked className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-bold text-primary-900">{stats?.total || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Loans</p>
              <p className="text-2xl font-bold text-primary-900">{stats?.borrowed || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Engagement</p>
              <p className="text-2xl font-bold text-primary-900">+12%</p>
            </div>
          </div>
        </section>
      )}

      {/* AI Recommendations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-primary-900">Recommended for You</h3>
          </div>
          <button className="text-sm font-bold text-primary-600 flex items-center gap-1 hover:text-primary-700 transition-colors">
            View All Recommendations
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {recommendations?.map((book: any) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-primary-900">Recent Library Activity</h3>
          <span className="text-xs font-medium text-primary-500 uppercase">Last 24 Hours</span>
        </div>
        <div className="divide-y divide-gray-50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <BookMarked className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-primary-900">
                  <span className="font-bold">A user</span> borrowed <span className="font-bold">Designing Data-Intensive Applications</span>
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                Loan
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
