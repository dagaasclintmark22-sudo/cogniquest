import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Trash2, Plus, ArrowLeft, Save, Pencil, GripVertical, Filter, Search } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminQuizzes() {
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  // Filter State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filtered Quizzes
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesCategory = selectedCategory === 'all' || quiz.categoryId === selectedCategory;
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Drag and Drop Handlers
  const handleDragStart = (e, position) => {
    dragItem.current = position;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e, position) => {
    e.preventDefault();
    dragOverItem.current = position;
    
    // Only allow reordering if not filtering
    if (selectedCategory !== 'all' || searchQuery !== '') return;

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

    // Only save order if not filtering
    if (selectedCategory !== 'all' || searchQuery !== '') return;

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Quizzes</h1>
        {view === 'list' && (
          <button
            onClick={() => {
              setEditingQuiz(null);
              setView('create');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {filteredQuizzes.length === 0 ? (
                <li className="px-6 py-12 text-center text-gray-500">
                  No quizzes found matching your filters.
                </li>
              ) : (
                filteredQuizzes.map((quiz, index) => (
                  <li 
                    key={quiz.id} 
                    className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${isDragging ? 'cursor-move' : ''}`}
                    draggable={selectedCategory === 'all' && searchQuery === ''}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center flex-1">
                      {(selectedCategory === 'all' && searchQuery === '') && (
                        <div className="mr-4 text-gray-400 cursor-move hover:text-gray-600">
                          <GripVertical className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{quiz.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {categories.find(c => c.id === quiz.categoryId)?.name || 'Unknown Category'}
                          </span>
                          <span className="text-xs text-gray-500 border-l border-gray-300 pl-2">
                            {quiz.questions?.length || 0} Questions
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingQuiz(quiz);
                          setView('create');
                        }}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(quiz.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : (
        <QuizEditor 
          categories={categories} 
          initialData={editingQuiz} 
          onCancel={() => setView('list')}
          onSave={() => {
            setView('list');
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function QuizEditor({ categories, initialData, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    questions: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Default empty state
      setFormData({
        title: '',
        description: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        questions: []
      });
    }
  }, [initialData, categories]);

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
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[oIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
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
        await updateDoc(doc(db, "quizzes", initialData.id), formData);
      } else {
        await addDoc(collection(db, "quizzes"), {
          ...formData,
          createdAt: new Date()
        });
      }
      onSave();
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 relative">
      {/* Sticky Header with Actions */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6 shadow-sm flex justify-between items-center rounded-b-lg">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onCancel}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {initialData ? 'Edit Quiz' : 'Create New Quiz'}
          </h2>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 gap-6">
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
              rows={3}
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
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Questions ({formData.questions.length})</h3>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </button>
        </div>

        {formData.questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white shadow sm:rounded-lg p-6 border border-gray-200 relative group">
            <button
              type="button"
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Question {qIndex + 1}</label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                  value={q.text}
                  onChange={e => updateQuestion(qIndex, 'text', e.target.value)}
                  placeholder="Enter question text..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Option {oIndex + 1}</label>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctAnswer === oIndex}
                        onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        required
                        className={`ml-2 block w-full rounded-md shadow-sm focus:ring-indigo-500 border p-2 text-sm ${q.correctAnswer === oIndex ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300 focus:border-indigo-500'}`}
                        value={opt}
                        onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hint (Optional)</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
                    value={q.hint}
                    onChange={e => updateQuestion(qIndex, 'hint', e.target.value)}
                    placeholder="Helpful hint for the user..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rationalization (Optional)</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
                    value={q.rationalization}
                    onChange={e => updateQuestion(qIndex, 'rationalization', e.target.value)}
                    placeholder="Explanation for the correct answer..."
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
