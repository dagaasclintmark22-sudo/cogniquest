import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X, LayoutDashboard, FolderTree, FileQuestion, Home } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import Logo from './Logo';

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

  const NavLink = ({ to, children, icon: Icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'text-indigo-600 bg-indigo-50 shadow-sm' 
            : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
        }`}
      >
        {Icon && <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`} />}
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-90 transition-opacity">
                  <Logo iconSize={8} textSize="text-xl" />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-2">
                {userRole === 'admin' ? (
                  <>
                    <NavLink to="/admin" icon={LayoutDashboard}>Dashboard</NavLink>
                    <NavLink to="/admin/categories" icon={FolderTree}>Categories</NavLink>
                    <NavLink to="/admin/quizzes" icon={FileQuestion}>Quizzes</NavLink>
                  </>
                ) : (
                  <NavLink to="/" icon={Home}>Home</NavLink>
                )}
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <button 
                  onClick={handleLogoutClick} 
                  className="flex items-center text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
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
            <div className="sm:hidden bg-white border-b border-gray-200">
              <div className="pt-2 pb-3 space-y-1 px-2">
                {userRole === 'admin' ? (
                  <>
                    <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Dashboard</Link>
                    <Link to="/admin/categories" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Categories</Link>
                    <Link to="/admin/quizzes" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Quizzes</Link>
                  </>
                ) : (
                  <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">Home</Link>
                )}
                <button onClick={handleLogoutClick} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50">
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
