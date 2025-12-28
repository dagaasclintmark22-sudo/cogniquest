import { db } from '../lib/firebase';
import { collection, addDoc, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';
import { assessmentData2 } from './assessmentData2';

export const seedAssessment2 = async () => {
  const batch = writeBatch(db);
  
  try {
    console.log("Starting Assessment 2 Seed...");

    // 1. Find or Create Category
    let categoryId;
    const catName = "Assessment Learning";
    const catDesc = "Quizzes related to Assessment in Learning.";

    const catQuery = query(collection(db, "categories"), where("name", "==", catName));
    const catSnapshot = await getDocs(catQuery);

    if (!catSnapshot.empty) {
      categoryId = catSnapshot.docs[0].id;
      console.log("Category found:", categoryId);
    } else {
      const newCatRef = doc(collection(db, "categories"));
      batch.set(newCatRef, {
        name: catName,
        description: catDesc
      });
      categoryId = newCatRef.id;
      console.log("New Category created:", categoryId);
    }

    // 2. Prepare Questions
    const formattedQuestions = assessmentData2.map(item => ({
      text: item.q,
      options: item.options,
      correctAnswer: item.ans,
      hint: item.hint,
      rationalization: item.rat
    }));

    // 3. Create Quiz
    const quizRef = doc(collection(db, "quizzes"));
    batch.set(quizRef, {
      title: "Assessment in Learning 2",
      description: "Comprehensive assessment covering 150 items (Part 2).",
      categoryId: categoryId,
      questions: formattedQuestions
    });

    await batch.commit();
    console.log("Assessment Quiz 2 Seeded Successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding assessment 2:", error);
    return false;
  }
};
