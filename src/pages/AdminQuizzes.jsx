import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Trash2, Plus, ArrowLeft, Save, Pencil, GripVertical } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminQuizzes() {
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState(null);

  // Drag and Drop State
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quizzesSnap, categoriesSnap] = await Promise.all([
        getDocs(collection(db, "quizzes")),
        getDocs(collection(db, "categories"))
      ]);
      
      const quizList = quizzesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by order if available, else by title
      quizList.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.title.localeCompare(b.title);
      });

      setQuizzes(quizList);
      setCategories(categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, position) => {
    dragItem.current = position;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e, position) => {
    e.preventDefault();
    dragOverItem.current = position;
    
    if (dragItem.current !== null && dragItem.current !== position) {
      const newQuizzes = [...quizzes];
      const draggedItemContent = newQuizzes[dragItem.current];
      newQuizzes.splice(dragItem.current, 1);
      newQuizzes.splice(position, 0, draggedItemContent);
      
      dragItem.current = position;
      setQuizzes(newQuizzes);
    }
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    dragItem.current = null;
    dragOverItem.current = null;

    // Save new order to Firestore
    try {
      const batch = writeBatch(db);
      quizzes.forEach((quiz, index) => {
        const ref = doc(db, "quizzes", quiz.id);
        batch.update(ref, { order: index });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error saving order:", err);
    }
  };

  const confirmDelete = (id) => {
    setQuizToDelete(id);
    setIsModalOpen(true);
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    try {
      await deleteDoc(doc(db, "quizzes", quizToDelete));
      setQuizzes(quizzes.filter(q => q.id !== quizToDelete));
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteQuiz}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
        confirmText="Delete"
        isDangerous={true}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Quizzes</h1>
        {view === 'list' && (
          <button
            onClick={() => {
              setEditingQuiz(null);
              setView('create');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {quizzes.map((quiz, index) => (
              <li 
                key={quiz.id} 
                className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 ${isDragging ? 'cursor-move' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="flex items-center flex-1">
                  <div className="mr-4 text-gray-400 cursor-move">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">{quiz.description}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {categories.find(c => c.id === quiz.categoryId)?.name || 'Unknown Category'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">{quiz.questions?.length || 0} Questions</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingQuiz(quiz);
                      setView('create');
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => confirmDelete(quiz.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
            {quizzes.length === 0 && (
              <li className="px-6 py-4 text-center text-gray-500">No quizzes found.</li>
            )}
          </ul>
        </div>
      ) : (
        <QuizForm 
          categories={categories} 
          initialData={editingQuiz}
          onCancel={() => {
            setEditingQuiz(null);
            setView('list');
          }} 
          onSuccess={() => {
            setEditingQuiz(null);
            setView('list');
            fetchData();
          }} 
        />
      )}
    </div>
  );
}

function QuizForm({ categories, initialData, onCancel, onSuccess }) {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    categoryId: categories[0]?.id || '',
    questions: []
  });

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          text: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          hint: '',
          rationalization: ''
        }
      ]
    });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData) {
        // Update existing quiz
        const quizRef = doc(db, "quizzes", initialData.id);
        await updateDoc(quizRef, formData);
      } else {
        // Create new quiz
        await addDoc(collection(db, "quizzes"), formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quiz Title</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            value={formData.categoryId}
            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Questions</h3>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Question
          </button>
        </div>

        {formData.questions.map((q, qIndex) => (
          <div key={qIndex} className="border rounded-md p-4 bg-gray-50 relative">
            <button
              type="button"
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">Question Text</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                  value={q.text}
                  onChange={e => updateQuestion(qIndex, 'text', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex}>
                    <label className="block text-xs font-medium text-gray-500">Option {oIndex + 1}</label>
                    <div className="flex items-center mt-1">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctAnswer === oIndex}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <input
                        type="text"
                        required
                        className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
                        value={opt}
                        onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Hint</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                    value={q.hint}
                    onChange={e => updateQuestion(qIndex, 'hint', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Rationalization</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                    value={q.rationalization}
                    onChange={e => updateQuestion(qIndex, 'rationalization', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Quiz
        </button>
      </div>
    </form>
  );
}
