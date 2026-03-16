import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api';
import { User, UserRole } from '../types';
import { 
  Users, 
  UserCog, 
  Mail, 
  Shield, 
  Clock,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../store/authStore';

const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authApi.listUsers().then(res => res.data as User[]),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string, role: string }) => 
      authApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('User role updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to update role');
    }
  });

  const filteredUsers = users?.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight flex items-center gap-3">
          <UserCog className="w-8 h-8 text-primary-600" />
          User Management
        </h1>
        <p className="text-gray-500 mt-1">Manage library staff roles and reader permissions.</p>
      </header>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registered</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary-900">{user.username}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        user.role === UserRole.ADMIN && "bg-purple-100 text-purple-700",
                        user.role === UserRole.LIBRARIAN && "bg-blue-100 text-blue-700",
                        user.role === UserRole.READER && "bg-gray-100 text-gray-600"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {currentUser?.role === UserRole.ADMIN && currentUser.id !== user.id ? (
                         <select 
                           value={user.role}
                           onChange={(e) => roleMutation.mutate({ userId: user.id, role: e.target.value })}
                           className="bg-gray-100 border-none rounded-lg text-xs font-bold text-primary-900 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                         >
                           <option value={UserRole.READER}>Reader</option>
                           <option value={UserRole.LIBRARIAN}>Librarian</option>
                           <option value={UserRole.ADMIN}>Admin</option>
                         </select>
                       ) : (
                         <span className="text-[10px] font-bold text-gray-400 uppercase italic">Immutable</span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
