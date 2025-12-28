import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const { login, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  // Redirect when user is logged in
  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, userRole, navigate]);

  // Check for lockout
  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        if (Date.now() > lockoutTime) {
          setLockoutTime(null);
          setAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Too many failed attempts. Please try again in ${remaining} seconds.`);
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Navigation is handled by the useEffect above
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        const lockoutDuration = 30 * 1000; // 30 seconds
        setLockoutTime(Date.now() + lockoutDuration);
        setError(`Too many failed attempts. Please try again in 30 seconds.`);
      } else {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('Invalid email or password.');
        } else {
          setError('Failed to log in: ' + err.message);
        }
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight pb-2">
              CogniQuest
            </h1>
            <p className="mt-2 text-gray-500 text-lg">Unlock your potential</p>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!lockoutTime || loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!!lockoutTime || loading}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={!!lockoutTime || loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                lockoutTime || loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? 'Signing in...' : (lockoutTime ? 'Locked Out' : 'Sign in')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
