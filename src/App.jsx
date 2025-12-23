import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CategoryQuizzes from './pages/CategoryQuizzes';
import Quiz from './pages/Quiz';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import AdminCategories from './pages/AdminCategories';
import AdminQuizzes from './pages/AdminQuizzes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            {/* User Routes */}
            <Route index element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="category/:categoryId" element={
              <ProtectedRoute>
                <CategoryQuizzes />
              </ProtectedRoute>
            } />
            <Route path="quiz/:quizId" element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/categories" element={
              <ProtectedRoute role="admin">
                <AdminCategories />
              </ProtectedRoute>
            } />
            <Route path="admin/quizzes" element={
              <ProtectedRoute role="admin">
                <AdminQuizzes />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
