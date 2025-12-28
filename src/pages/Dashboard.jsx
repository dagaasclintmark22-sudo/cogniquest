import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Trophy, ArrowRight, Star } from 'lucide-react';

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
      <div className="animate-pulse space-y-8">
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-64 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back!</h1>
          <p className="text-gray-500 mt-1">Select a category to start your learning journey.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map(category => (
          <Link 
            key={category.id} 
            to={`/category/${category.id}`}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full transform hover:-translate-y-1"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                {category.progress > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-100">
                    <Trophy className="w-3 h-3" />
                    {category.progress}%
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {category.name}
              </h3>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                {category.description}
              </p>
              
              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs font-medium text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{category.completedQuizzes} / {category.totalQuizzes} Quizzes</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.max(5, category.progress)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-indigo-50/30 transition-colors">
              <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">Explore Quizzes</span>
              <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
