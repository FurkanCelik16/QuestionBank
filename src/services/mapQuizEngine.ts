import { provinces, getTurkeyDistractors, Province } from '../data/turkeyProvinces';
import { worldCountries, getWorldDistractors, Country } from '../data/worldCountries';

export interface MapQuizQuestion {
  id: number;
  targetId: string | number; // plaka veya iso code
  targetName: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
}

export type MapQuizMode = 'turkey' | 'world';

/**
 * Shuffle array in place using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function generateMapQuiz(mode: MapQuizMode, count: number): MapQuizQuestion[] {
  const questions: MapQuizQuestion[] = [];
  
  if (mode === 'turkey') {
    // Rastgele 'count' kadar il seç (tekrarsız)
    const shuffledProvinces = shuffleArray(provinces);
    const selectedProvinces = shuffledProvinces.slice(0, count);

    selectedProvinces.forEach((target, index) => {
      const distractors = getTurkeyDistractors(target.id, 3);
      const allOptions = [target.name, ...distractors.map(d => d.name)];
      const shuffledOptions = shuffleArray(allOptions);
      
      const correctIndex = shuffledOptions.indexOf(target.name);
      const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

      questions.push({
        id: index + 1,
        targetId: target.id,
        targetName: target.name,
        options: {
          A: shuffledOptions[0],
          B: shuffledOptions[1],
          C: shuffledOptions[2],
          D: shuffledOptions[3],
        },
        correct_answer: keys[correctIndex],
      });
    });
  } else {
    // Rastgele 'count' kadar ülke seç (tekrarsız)
    const shuffledCountries = shuffleArray(worldCountries);
    const selectedCountries = shuffledCountries.slice(0, count);

    selectedCountries.forEach((target, index) => {
      const distractors = getWorldDistractors(target.id, 3);
      const allOptions = [target.name, ...distractors.map(d => d.name)];
      const shuffledOptions = shuffleArray(allOptions);
      
      const correctIndex = shuffledOptions.indexOf(target.name);
      const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

      questions.push({
        id: index + 1,
        targetId: target.id,
        targetName: target.name,
        options: {
          A: shuffledOptions[0],
          B: shuffledOptions[1],
          C: shuffledOptions[2],
          D: shuffledOptions[3],
        },
        correct_answer: keys[correctIndex],
      });
    });
  }

  return questions;
}
