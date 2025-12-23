import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Categories
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const cats = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort categories by order
        cats.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return a.name.localeCompare(b.name);
        });

        // 2. Fetch All Quizzes
        const quizzesSnapshot = await getDocs(collection(db, "quizzes"));
        const allQuizzes = quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Fetch User Progress (if logged in)
        let userProgressMap = {};
        if (currentUser) {
          const progressSnapshot = await getDocs(collection(db, "users", currentUser.uid, "quizProgress"));
          progressSnapshot.docs.forEach(doc => {
            userProgressMap[doc.id] = doc.data();
          });
        }

        // 4. Calculate Progress per Category
        const categoriesWithProgress = cats.map(category => {
          const categoryQuizzes = allQuizzes.filter(q => q.categoryId === category.id);
          
          if (categoryQuizzes.length === 0) {
            return { ...category, progress: 0, totalQuizzes: 0, completedQuizzes: 0 };
          }

          let totalPercentage = 0;
          let completedCount = 0;

          categoryQuizzes.forEach(quiz => {
            const progress = userProgressMap[quiz.id];
            if (progress) {
              totalPercentage += (progress.bestPercentage || 0);
              if (progress.bestPercentage > 0) completedCount++;
            }
          });

          const avgProgress = Math.round(totalPercentage / categoryQuizzes.length);
          
          return { 
            ...category, 
            progress: avgProgress,
            totalQuizzes: categoryQuizzes.length,
            completedQuizzes: completedCount
          };
        });

        setCategories(categoriesWithProgress);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg h-48">
              <div className="px-4 py-5 sm:p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Available Categories</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg flex flex-col">
            <div className="px-4 py-5 sm:p-6 flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{category.name}</h3>
                {category.progress > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {category.progress}% Mastery
                  </span>
                )}
              </div>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>{category.description}</p>
              </div>
              
              {/* Minimal Progress */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{category.completedQuizzes}/{category.totalQuizzes}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1">
                  <div 
                    className="bg-indigo-500 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${category.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link
                to={`/category/${category.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              >
                View Quizzes
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
