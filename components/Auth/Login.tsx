import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const successMessage = await login(username, phone);
      toast.success(successMessage);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white border border-gray-200 rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-stone-800">KAICHAT</h1>
          <p className="mt-2 text-gray-500">Connect Instantly.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-gray-100 border border-gray-300 placeholder-gray-400 text-gray-800 rounded-t-md focus:outline-none focus:ring-stone-500 focus:border-stone-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                id="phone-number"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-gray-100 border border-gray-300 placeholder-gray-400 text-gray-800 rounded-b-md focus:outline-none focus:ring-stone-500 focus:border-stone-500 focus:z-10 sm:text-sm"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-stone-800 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-stone-600 transition-all duration-300 disabled:opacity-50"
            >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="h-5 w-5 text-stone-300 group-hover:text-stone-200 transition-colors">
                        {loading ? 
                         <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div> :
                         <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        }
                    </div>
                </span>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        <p className="mt-2 text-sm text-center text-gray-500">
          No account?{' '}
          <Link to="/signup" className="font-medium text-stone-600 hover:text-stone-800">
            Sign up
          </Link>
        </p>
         <p className="mt-1 text-xs text-center text-gray-400">
          <Link to="/admin" className="hover:text-gray-600">
            Admin Panel
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;