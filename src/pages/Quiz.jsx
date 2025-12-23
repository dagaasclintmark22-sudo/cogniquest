import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { HelpCircle, CheckCircle, XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import QuizResultModal from '../components/QuizResultModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';

export default function Quiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [showRationalization, setShowRationalization] = useState({});
  const [showHint, setShowHint] = useState({});
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isRetryMistakesMode, setIsRetryMistakesMode] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      const quizDoc = await getDoc(doc(db, "quizzes", quizId));
      if (quizDoc.exists()) {
        const quizData = quizDoc.data();
        setQuiz(quizData);
        const qList = quizData.questions || [];
        setQuestions(qList);
        setOriginalQuestions(qList);
      }
      setLoading(false);
    };

    fetchQuiz();
  }, [quizId]);

  const saveProgress = async (currentScore, total) => {
    if (!currentUser) return;

    const percentage = Math.round((currentScore / total) * 100);
    const progressRef = doc(db, "users", currentUser.uid, "quizProgress", quizId);
    
    try {
      const progressDoc = await getDoc(progressRef);
      if (progressDoc.exists()) {
        const data = progressDoc.data();
        if (percentage > (data.bestPercentage || 0)) {
          await setDoc(progressRef, {
            bestScore: currentScore,
            bestPercentage: percentage,
            lastAttemptAt: serverTimestamp(),
            totalQuestions: total
          }, { merge: true });
        } else {
           await setDoc(progressRef, {
            lastAttemptAt: serverTimestamp()
          }, { merge: true });
        }
      } else {
        await setDoc(progressRef, {
          bestScore: currentScore,
          bestPercentage: percentage,
          lastAttemptAt: serverTimestamp(),
          totalQuestions: total
        });
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    if (answers[questionId] !== undefined) return; // Prevent changing answer
    
    const newAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(newAnswers);
    setShowRationalization(prev => ({ ...prev, [questionId]: true }));

    // Check if this was the last question
    if (Object.keys(newAnswers).length === questions.length) {
      // Calculate score immediately to save
      const currentScore = Object.keys(newAnswers).reduce((acc, key) => {
        const qIndex = parseInt(key);
        return questions[qIndex].correctAnswer === newAnswers[qIndex] ? acc + 1 : acc;
      }, 0);
      
      saveProgress(currentScore, questions.length);

      setTimeout(() => {
        setIsResultModalOpen(true);
        setQuizFinished(true);
      }, 1000); // 1 second delay to let user see the result of the last question
    }
  };

  const toggleHint = (questionId) => {
    setShowHint(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleRetry = () => {
    setIsRetryModalOpen(true);
  };

  const confirmRetry = () => {
    setAnswers({});
    setShowRationalization({});
    setShowHint({});
    setIsResultModalOpen(false);
    setIsRetryModalOpen(false);
    setQuizFinished(false);
    setIsRetryMistakesMode(false);
    setQuestions(originalQuestions);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetryMistakes = () => {
    const wrongQuestionIndices = questions.map((q, index) => {
      return answers[index] !== q.correctAnswer ? index : -1;
    }).filter(index => index !== -1);

    const wrongQuestions = wrongQuestionIndices.map(index => questions[index]);
    
    setQuestions(wrongQuestions);
    setAnswers({});
    setShowRationalization({});
    setShowHint({});
    setIsResultModalOpen(false);
    setQuizFinished(false);
    setIsRetryMistakesMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackClick = () => {
    if (Object.keys(answers).length > 0 && Object.keys(answers).length < questions.length) {
      setIsExitModalOpen(true);
    } else {
      const backPath = quiz?.categoryId ? `/category/${quiz.categoryId}` : '/';
      navigate(backPath);
    }
  };

  const confirmExit = () => {
    setIsExitModalOpen(false);
    const backPath = quiz?.categoryId ? `/category/${quiz.categoryId}` : '/';
    navigate(backPath);
  };

  if (loading) return <div>Loading...</div>;
  if (!quiz) return <div>Quiz not found</div>;

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const score = Object.keys(answers).reduce((acc, key) => {
    const qIndex = parseInt(key);
    return questions[qIndex].correctAnswer === answers[qIndex] ? acc + 1 : acc;
  }, 0);
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const hasMistakes = score < totalQuestions;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <QuizResultModal 
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        score={score}
        total={totalQuestions}
        onReview={() => setIsResultModalOpen(false)}
        onRetry={handleRetry}
        onRetryMistakes={handleRetryMistakes}
        hasMistakes={hasMistakes && !isRetryMistakesMode}
      />

      <ConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirm={confirmExit}
        title="Exit Quiz?"
        message="Are you sure you want to leave? Your progress will be lost."
        confirmText="Leave Quiz"
        cancelText="Stay"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isRetryModalOpen}
        onClose={() => setIsRetryModalOpen(false)}
        onConfirm={confirmRetry}
        title="Retake Quiz?"
        message="Are you sure you want to retake the quiz? Your current answers will be cleared."
        confirmText="Retake"
        cancelText="Cancel"
        isDangerous={false}
      />

      {/* Sticky Header for Progress and Score */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-4 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6 border-b border-gray-200 shadow-sm">
        <div className="flex items-center mb-4">
          <button 
            onClick={handleBackClick}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{quiz.title}</h1>
            <p className="text-sm text-gray-500 hidden sm:block truncate">{quiz.description}</p>
          </div>
          
          {quizFinished && (
            <button
              onClick={handleRetry}
              className="ml-2 sm:ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
            >
              <RotateCcw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Retry</span>
            </button>
          )}

          <div className="text-right ml-4 flex-shrink-0">
            <div className="text-2xl font-bold text-indigo-600">
              {score} <span className="text-gray-400 text-lg">/ {totalQuestions}</span>
            </div>
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Current Score</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Progress: {Math.round(progress)}%</span>
          <span>{answeredCount} of {totalQuestions} answered</span>
        </div>
      </div>

      <div className="space-y-12">
        {questions.map((q, index) => (
          <div key={index} className="bg-white shadow sm:rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                <span className="mr-2 text-gray-500">{index + 1}.</span>
                {q.text}
              </h3>
              {q.hint && (
                <button
                  onClick={() => toggleHint(index)}
                  className="text-yellow-500 hover:text-yellow-600"
                  title="Show Hint"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {showHint[index] && (
              <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                <strong>Hint:</strong> {q.hint}
              </div>
            )}

            <div className="space-y-3">
              {q.options.map((option, optIndex) => {
                const isSelected = answers[index] === optIndex;
                const isCorrect = q.correctAnswer === optIndex;
                const showResult = answers[index] !== undefined;

                let optionClass = "w-full text-left p-3 rounded-md border transition-colors ";
                if (showResult) {
                  if (isCorrect) {
                    optionClass += "bg-green-50 border-green-200 text-green-800";
                  } else if (isSelected) {
                    optionClass += "bg-red-50 border-red-200 text-red-800";
                  } else {
                    optionClass += "bg-gray-50 border-gray-200 text-gray-500";
                  }
                } else {
                  optionClass += "hover:bg-gray-50 border-gray-200";
                }

                return (
                  <button
                    key={optIndex}
                    onClick={() => handleAnswerSelect(index, optIndex)}
                    disabled={showResult}
                    className={optionClass}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">{option}</span>
                      {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-600 ml-2" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 ml-2" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {showRationalization[index] && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Rationalization:</h4>
                <p className="text-sm text-blue-700">{q.rationalization}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
