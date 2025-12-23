import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

export default function Layout() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsLogoutModalOpen(false);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (!currentUser) return <Outlet />;

  const isQuizPage = location.pathname.startsWith('/quiz/');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        isDangerous={true}
      />

      {!isQuizPage && (
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link to="/" className="text-xl font-bold text-indigo-600">CogniQuest</Link>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                {userRole === 'admin' ? (
                  <>
                    <Link to="/admin" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                    <Link to="/admin/categories" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Categories</Link>
                    <Link to="/admin/quizzes" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Quizzes</Link>
                  </>
                ) : (
                  <Link to="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                )}
                <button onClick={handleLogoutClick} className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {isMenuOpen && (
            <div className="sm:hidden">
              <div className="pt-2 pb-3 space-y-1">
                {userRole === 'admin' ? (
                  <>
                    <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Dashboard</Link>
                    <Link to="/admin/categories" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Categories</Link>
                    <Link to="/admin/quizzes" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Quizzes</Link>
                  </>
                ) : (
                  <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Home</Link>
                )}
                <button onClick={handleLogoutClick} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50">
                  Logout
                </button>
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
