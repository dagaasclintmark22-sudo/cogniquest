import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function CategoryQuizzes() {
  const { categoryId } = useParams();
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryProgress, setCategoryProgress] = useState(0);
  const [categoryTitle, setCategoryTitle] = useState('');

  useEffect(() => {
    const fetchQuizzesAndProgress = async () => {
      // Fetch Category Title
      const categoryDoc = await getDoc(doc(db, "categories", categoryId));
      if (categoryDoc.exists()) {
        setCategoryTitle(categoryDoc.data().name);
      }

      // Fetch Quizzes
      const q = query(collection(db, "quizzes"), where("categoryId", "==", categoryId));
      const querySnapshot = await getDocs(q);
      const quizList = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return a.title.localeCompare(b.title);
        });
      
      // Fetch User Progress for these quizzes
      if (currentUser) {
        let totalPercentage = 0;
        const quizzesWithProgress = await Promise.all(quizList.map(async (quiz) => {
          const progressRef = doc(db, "users", currentUser.uid, "quizProgress", quiz.id);
          const progressDoc = await getDoc(progressRef);
          let bestPercentage = 0;
          if (progressDoc.exists()) {
            bestPercentage = progressDoc.data().bestPercentage || 0;
          }
          totalPercentage += bestPercentage;
          return { ...quiz, bestPercentage };
        }));
        
        setQuizzes(quizzesWithProgress);
        setCategoryProgress(quizList.length > 0 ? Math.round(totalPercentage / quizList.length) : 0);
      } else {
        setQuizzes(quizList);
      }
      
      setLoading(false);
    };

    fetchQuizzesAndProgress();
  }, [categoryId, currentUser]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm flex items-center space-x-3">
              <div className="flex-1 min-w-0">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center">
        <Link to="/" className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Back to Dashboard">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{categoryTitle} Quizzes</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition-all hover:shadow-md">
            <div className="flex-1 min-w-0">
              <Link to={`/quiz/${quiz.id}`} className="focus:outline-none block">
                <span className="absolute inset-0" aria-hidden="true" />
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-lg font-medium text-gray-900 truncate">{quiz.title}</p>
                    <p className="text-sm text-gray-500 truncate">{quiz.description}</p>
                  </div>
                  {quiz.bestPercentage !== undefined && (
                    <div className={`flex-shrink-0 flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      quiz.bestPercentage >= 80 ? 'bg-green-100 text-green-800' :
                      quiz.bestPercentage >= 60 ? 'bg-blue-100 text-blue-800' :
                      quiz.bestPercentage > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <Trophy className="w-3 h-3 mr-1" />
                      {quiz.bestPercentage}%
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
