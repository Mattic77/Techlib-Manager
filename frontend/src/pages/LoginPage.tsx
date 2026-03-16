import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';
import { Library, Lock, Mail, Loader2, Sparkles, User as UserIcon } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // OAuth2 Password Request Form expects URL encoded data
        const params = new URLSearchParams();
        params.append('username', username); // This can be username or email now
        params.append('password', password);
        
        const loginRes = await authApi.login(params);
        const { access_token } = loginRes.data;
        
        // Save token immediately so following API calls work
        // We set only token first, then fetch user data
        useAuthStore.setState({ token: access_token });

        // Get user info using the centralized API client (which now has the token)
        const userRes = await authApi.getMe();
        const userData = userRes.data;
        
        setAuth(userData, access_token);
        navigate('/');
      } else {
        await authApi.register({ username, email, password });
        setIsLogin(true);
        alert('Registration successful! Please sign in with your new account.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string' 
          ? detail 
          : 'Invalid credentials or server error. Please try again.'
      );
      // Clean up partial state on error
      useAuthStore.getState().logout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-800 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600 rounded-full translate-x-1/2 translate-y-1/2 opacity-10 blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-2xl mb-6 transform -rotate-6">
            <Library className="w-10 h-10 text-primary-900" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">TechLib</h1>
          <p className="text-primary-300 font-medium">The Intelligent Technical Library</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-white/10 backdrop-blur-sm">
          <div className="flex gap-4 mb-8 bg-gray-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-500 hover:text-primary-600'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-500 hover:text-primary-600'}`}
            >
              Join
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-primary-900 uppercase tracking-widest mb-2 ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm focus:bg-white focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-primary-900 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    required={!isLogin}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm focus:bg-white focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-primary-900 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm focus:bg-white focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-900 hover:bg-primary-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In to Library' : 'Create Account'}
                  <Sparkles className="w-5 h-5 text-primary-300 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-8">
            Technical Library Management System v1.0 MVP
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
