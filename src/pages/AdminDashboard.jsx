import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Users, BookOpen, Layers, Database, Lock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { seedDatabase, seedConfig } from '../utils/seedDatabase';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    quizzes: 0,
    categories: 0
  });
  const [loading, setLoading] = useState(true);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null); // 'success' | 'error'
  
  // Change Password State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersColl = collection(db, "users");
        const quizzesColl = collection(db, "quizzes");
        const categoriesColl = collection(db, "categories");

        const [usersSnapshot, quizzesSnapshot, categoriesSnapshot] = await Promise.all([
          getCountFromServer(usersColl),
          getCountFromServer(quizzesColl),
          getCountFromServer(categoriesColl)
        ]);

        setStats({
          users: usersSnapshot.data().count,
          quizzes: quizzesSnapshot.data().count,
          categories: categoriesSnapshot.data().count
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleSeedDatabase = async () => {
    setIsSeedModalOpen(false);
    setIsSeeding(true);
    setSeedResult(null);
    try {
      await seedDatabase();
      setSeedResult('success');
    } catch (error) {
      console.error(error);
      setSeedResult('error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      return setPasswordError("Passwords do not match");
    }
    if (newPassword.length < 6) {
      return setPasswordError("Password must be at least 6 characters");
    }

    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        setPasswordSuccess("Password updated successfully");
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setIsPasswordModalOpen(false), 2000);
      }
    } catch (error) {
      setPasswordError("Failed to update password: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-200 rounded-md p-3 w-12 h-12"></div>
                <div className="ml-5 w-full">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Seed Database Modal */}
      <ConfirmationModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onConfirm={handleSeedDatabase}
        title="Seed Database"
        message={
          <div className="text-left">
            <p className="mb-2">Are you sure you want to seed the database? The following quizzes will be imported:</p>
            <ul className="list-disc pl-5 space-y-1 max-h-60 overflow-y-auto text-left">
              {seedConfig.map((config, index) => (
                <li key={index}>
                  <span className="font-semibold">{config.categoryName}</span>: {config.quizTitle}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-400">Note: Existing quizzes with the same title will be skipped.</p>
          </div>
        }
        confirmText="Seed Database"
        isDangerous={false}
      />

      {/* Seeding Loading/Result Modal */}
      {(isSeeding || seedResult) && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start justify-center">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 text-center" id="modal-title">
                      {isSeeding ? 'Seeding Database...' : (seedResult === 'success' ? 'Success!' : 'Error')}
                    </h3>
                    <div className="mt-4 flex justify-center">
                      {isSeeding && <Loader className="w-12 h-12 text-indigo-600 animate-spin" />}
                      {!isSeeding && seedResult === 'success' && <CheckCircle className="w-12 h-12 text-green-600" />}
                      {!isSeeding && seedResult === 'error' && <XCircle className="w-12 h-12 text-red-600" />}
                    </div>
                    <p className="mt-4 text-sm text-gray-500 text-center">
                      {isSeeding ? 'Please wait while we populate the database with quizzes.' : 
                       (seedResult === 'success' ? 'Database seeded successfully! New quizzes have been added.' : 'An error occurred while seeding the database.')}
                    </p>
                  </div>
                </div>
              </div>
              {!isSeeding && (
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setSeedResult(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsPasswordModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Admin Password</h3>
                {passwordError && <div className="mb-4 text-sm text-red-600">{passwordError}</div>}
                {passwordSuccess && <div className="mb-4 text-sm text-green-600">{passwordSuccess}</div>}
                <form onSubmit={handleChangePassword}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:col-start-2 sm:text-sm"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                      onClick={() => setIsPasswordModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </button>
          <button 
            onClick={() => setIsSeedModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            <Database className="w-4 h-4 mr-2" />
            Seed Database
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.users}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Quizzes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.quizzes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Layers className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Categories</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.categories}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/admin/categories" className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Manage Categories</h3>
          <p className="mt-1 text-sm text-gray-500">Create, edit, and delete quiz categories.</p>
        </Link>
        <Link to="/admin/quizzes" className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Manage Quizzes</h3>
          <p className="mt-1 text-sm text-gray-500">Create new quizzes, add questions, and manage existing ones.</p>
        </Link>
      </div>
    </div>
  );
}
