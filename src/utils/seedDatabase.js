import { db } from '../lib/firebase';
import { collection, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';
import { assessmentData } from './assessmentData';
import { assessmentData2 } from './assessmentData2';
import { genEd1, genEd2, genEd3, genEd4 } from './genEdData';
import { genEd5, genEd6, genEd7, genEd8, genEd9, genEd10 } from './genEdData2';

// Helper function to seed a specific quiz
const seedQuiz = async (batch, categoryName, categoryDesc, quizTitle, quizDesc, questionsData, categoryCache) => {
  try {
    console.log(`Seeding Quiz: ${quizTitle}...`);

    // 1. Find or Create Category
    let categoryId = categoryCache[categoryName];

    if (!categoryId) {
      const catQuery = query(collection(db, "categories"), where("name", "==", categoryName));
      const catSnapshot = await getDocs(catQuery);

      if (!catSnapshot.empty) {
        categoryId = catSnapshot.docs[0].id;
      } else {
        const newCatRef = doc(collection(db, "categories"));
        batch.set(newCatRef, {
          name: categoryName,
          description: categoryDesc
        });
        categoryId = newCatRef.id;
      }
      // Cache the category ID to prevent duplicate creations in the same batch
      categoryCache[categoryName] = categoryId;
    }

    // 2. Check if Quiz already exists
    const quizQuery = query(collection(db, "quizzes"), where("title", "==", quizTitle));
    const quizSnapshot = await getDocs(quizQuery);

    if (!quizSnapshot.empty) {
      console.log(`Quiz "${quizTitle}" already exists. Skipping.`);
      return; // Skip if exists
    }

    // 3. Prepare Questions
    const formattedQuestions = questionsData.map(item => {
      // Check if it's the assessment format (q, ans, rat) or standard (text, correctAnswer, rationalization)
      if (item.q) {
        return {
          text: item.q,
          options: item.options,
          correctAnswer: item.ans,
          hint: item.hint,
          rationalization: item.rat
        };
      } else {
        return item; // Already in standard format
      }
    });

    // 4. Create Quiz
    const quizRef = doc(collection(db, "quizzes"));
    batch.set(quizRef, {
      title: quizTitle,
      description: quizDesc,
      categoryId: categoryId,
      questions: formattedQuestions
    });

    console.log(`Quiz "${quizTitle}" staged for creation.`);
  } catch (error) {
    console.error(`Error preparing quiz "${quizTitle}":`, error);
  }
};

export const seedDatabase = async () => {
  const batch = writeBatch(db);
  const categoryCache = {}; // Cache to store category IDs during this batch operation

  try {
    console.log("Starting Database Seed...");

    // --- Execute Seeding ---

    
    // 2. Seed Assessment Quizzes
    await seedQuiz(batch, "Assessment Learning", "Quizzes related to Assessment in Learning.", "Assessment in Learning 1", "Comprehensive assessment covering 150 items.", assessmentData, categoryCache);
    await seedQuiz(batch, "Assessment Learning", "Quizzes related to Assessment in Learning.", "Assessment in Learning 2", "Comprehensive assessment covering 150 items (Part 2).", assessmentData2, categoryCache);

    // 3. Seed General Education Quizzes
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "GenEd Test 1", "General Education Test 1", genEd1, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "GenEd Test 2", "General Education Test 2", genEd2, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "GenEd Test 3", "General Education Test 3", genEd3, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "Gen Ed Test 4", "General Education Test 4", genEd4, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "Gen Ed Test 5", "General Education Test 5", genEd5, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "Gen Ed Test 6", "General Education Test 6", genEd6, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "Gen Ed Test 7", "General Education Test 7", genEd7, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "Gen Ed Test 8", "General Education Test 8", genEd8, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "Gen Ed Test 9", "General Education Test 9", genEd9, categoryCache);
    await seedQuiz(batch, "General Education", "Quizzes covering various General Education topics.", "Gen Ed Test 10", "General Education Test 10", genEd10, categoryCache);

    // Commit all changes
    await batch.commit();
    console.log("Database seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
};
