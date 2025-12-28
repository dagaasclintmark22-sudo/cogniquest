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
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-8 border-b border-gray-200/50 shadow-sm transition-all duration-300">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-4">
            <button 
              onClick={handleBackClick}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{quiz.title}</h1>
              <p className="text-xs text-gray-500 hidden sm:block truncate">{quiz.description}</p>
            </div>
            
            {quizFinished && (
              <button
                onClick={handleRetry}
                className="ml-2 sm:ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <RotateCcw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            )}

            <div className="text-right ml-4 flex-shrink-0 bg-indigo-50 px-4 py-2 rounded-xl">
              <div className="text-xl font-bold text-indigo-600 leading-none">
                {score} <span className="text-indigo-300 text-sm">/ {totalQuestions}</span>
              </div>
              <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mt-1">Score</div>
            </div>
          </div>
          
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-gray-100">
              <div 
                style={{ width: `${progress}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 max-w-3xl mx-auto px-4 sm:px-0">
        {questions.map((q, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-medium text-gray-900 leading-relaxed">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  {q.text}
                </h3>
                {q.hint && (
                  <button
                    onClick={() => toggleHint(index)}
                    className="text-yellow-400 hover:text-yellow-500 transition-colors p-1"
                    title="Show Hint"
                  >
                    <HelpCircle className="w-6 h-6" />
                  </button>
                )}
              </div>

              {showHint[index] && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-xl text-sm flex items-start animate-fadeIn">
                  <HelpCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block mb-1">Hint</strong>
                    {q.hint}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {q.options.map((option, optIndex) => {
                  const isSelected = answers[index] === optIndex;
                  const isCorrect = q.correctAnswer === optIndex;
                  const showResult = answers[index] !== undefined;

                  let optionClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center group ";
                  
                  if (showResult) {
                    if (isCorrect) {
                      optionClass += "bg-green-50 border-green-500 text-green-900 shadow-sm";
                    } else if (isSelected) {
                      optionClass += "bg-red-50 border-red-500 text-red-900 shadow-sm";
                    } else {
                      optionClass += "bg-gray-50 border-transparent text-gray-400 opacity-60";
                    }
                  } else {
                    optionClass += "bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm text-gray-700";
                  }

                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleAnswerSelect(index, optIndex)}
                      disabled={showResult}
                      className={optionClass}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors ${
                        showResult 
                          ? (isCorrect ? 'border-green-500 bg-green-500 text-white' : (isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300'))
                          : 'border-gray-300 group-hover:border-indigo-400'
                      }`}>
                        {showResult && isCorrect && <CheckCircle className="w-4 h-4" />}
                        {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4" />}
                        {!showResult && <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-400">{String.fromCharCode(65 + optIndex)}</span>}
                      </div>
                      <span className="flex-grow font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>

              {showRationalization[index] && (
                <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-xl animate-fadeIn">
                  <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center">
                    <div className="w-1 h-4 bg-blue-500 rounded-full mr-2"></div>
                    Rationalization
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">{q.rationalization}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
