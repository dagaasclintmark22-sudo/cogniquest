import React from 'react';
import { Trophy, CheckCircle, XCircle, Home, Eye, RotateCcw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuizResultModal({ isOpen, onClose, score, total, onReview, onRetry, onRetryMistakes, hasMistakes }) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  const percentage = Math.round((score / total) * 100);
  let message = "";
  let colorClass = "";

  if (percentage >= 80) {
    message = "Outstanding!";
    colorClass = "text-green-600";
  } else if (percentage >= 60) {
    message = "Good Job!";
    colorClass = "text-blue-600";
  } else {
    message = "Keep Practicing!";
    colorClass = "text-orange-600";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all">
        <div className="p-8 text-center">
          <div className="mx-auto mb-6 w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
          <p className={`text-xl font-semibold mb-6 ${colorClass}`}>{message}</p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Your Score</div>
            <div className="flex items-baseline justify-center">
              <span className="text-5xl font-extrabold text-gray-900">{score}</span>
              <span className="text-2xl text-gray-400 ml-1">/{total}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {percentage}% Correct
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center flex-wrap">
            <button
              onClick={onRetry}
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retry
            </button>
            
            {hasMistakes && (
              <button
                onClick={onRetryMistakes}
                className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
              >
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Retry Mistakes
              </button>
            )}

            <button
              onClick={onReview}
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <Eye className="w-5 h-5 mr-2" />
              Review
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
