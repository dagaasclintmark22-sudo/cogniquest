import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Trash2, Plus, Pencil, X, GripVertical } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Drag and Drop State
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const cats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by order if it exists, otherwise by name
      cats.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.name.localeCompare(b.name);
      });
      setCategories(cats);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, position) => {
    dragItem.current = position;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image transparent or styled if needed
  };

  const handleDragEnter = (e, position) => {
    e.preventDefault();
    dragOverItem.current = position;
    
    if (dragItem.current !== null && dragItem.current !== position) {
      const newCategories = [...categories];
      const draggedItemContent = newCategories[dragItem.current];
      newCategories.splice(dragItem.current, 1);
      newCategories.splice(position, 0, draggedItemContent);
      
      dragItem.current = position;
      setCategories(newCategories);
    }
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    dragItem.current = null;
    dragOverItem.current = null;

    // Save new order to Firestore
    try {
      const batch = writeBatch(db);
      categories.forEach((cat, index) => {
        const ref = doc(db, "categories", cat.id);
        batch.update(ref, { order: index });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error saving order:", err);
      setError("Failed to save new order");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.description) return;

    try {
      if (editingCategory) {
        // Update existing category
        const categoryRef = doc(db, "categories", editingCategory.id);
        await updateDoc(categoryRef, {
          name: newCategory.name,
          description: newCategory.description
        });
        setEditingCategory(null);
      } else {
        // Add new category
        await addDoc(collection(db, "categories"), newCategory);
      }
      
      setNewCategory({ name: '', description: '' });
      fetchCategories(); // Refresh list
    } catch (err) {
      setError('Failed to save category');
      console.error(err);
    }
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name, description: category.description });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
  };

  const confirmDelete = (id) => {
    setCategoryToDelete(id);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteDoc(doc(db, "categories", categoryToDelete));
      setCategories(categories.filter(cat => cat.id !== categoryToDelete));
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-4 h-10 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <li key={i} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Categories</h1>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone. Note: Quizzes inside this category will not be deleted but may become unlinked."
        confirmText="Delete"
        isDangerous={true}
      />

      {/* Add/Edit Category Form */}
      <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              placeholder="e.g., Mathematics"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              placeholder="Category description..."
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              {editingCategory ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingCategory ? 'Update Category' : 'Add Category'}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {categories.map((category, index) => (
            <li 
              key={category.id} 
              className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 ${isDragging ? 'cursor-grabbing' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex items-center">
                <div className="mr-4 cursor-grab text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditClick(category)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => confirmDelete(category.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
          {categories.length === 0 && (
            <li className="px-6 py-4 text-center text-gray-500">No categories found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
