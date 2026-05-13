// ========================================
// Gemini API Service
// Quiz generation via Gemini 3 Flash Preview
// ========================================

import { Quiz, QuizQuestion, DifficultyLevel } from '../types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const TIMEOUT_MS = 90000; // 90 seconds

const DIFFICULTY_PROMPTS: Record<DifficultyLevel, string> = {
  easy: 'KOLAY seviye: Temel bilgi gerektiren, doğrudan hatırlama ve tanıma düzeyinde sorular sor. Şıklar arasında belirgin farklar olsun.',
  medium: 'ORTA seviye: KPSS sınavına uygun standart zorlukta, analiz ve yorumlama gerektiren sorular sor.',
  hard: 'ZOR seviye: Derinlemesine bilgi, çıkarım ve sentez gerektiren sorular sor. Şıklar birbirine yakın olsun, dikkatli okuma gereksin.',
  extreme: 'UZMAN seviye: Çok detaylı bilgi, karmaşık analiz ve çoklu kavram bağlantısı gerektiren ileri düzey sorular sor. Yanıltıcı şıklar içersin.',
};

/**
 * Generates a quiz using Gemini API based on selected topics, question count, and difficulty.
 */
export async function generateQuiz(
  topics: string[],
  questionCount: number,
  apiKey: string,
  difficulty: DifficultyLevel = 'medium'
): Promise<Quiz> {
  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı. Lütfen Ayarlar ekranından API anahtarınızı girin.');
  }

  if (topics.length === 0) {
    throw new Error('En az bir konu seçmelisiniz.');
  }

  const topicsString = topics.join(', ');
  const difficultyInstruction = DIFFICULTY_PROMPTS[difficulty];

  const systemPrompt = `KPSS uzmanısın. ${difficultyInstruction} Sadece JSON döndür.`;

  const userPrompt = `[${topicsString}] konularından ${questionCount} KPSS sorusu üret. Her soruda 5 şık (A-E), doğru cevap ve açıklama olsun.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: difficulty === 'easy' ? 0.6 : difficulty === 'extreme' ? 0.9 : 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          test_id: { type: 'STRING' },
          questions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'INTEGER' },
                type: { type: 'STRING' },
                question_text: { type: 'STRING' },
                options: {
                  type: 'OBJECT',
                  properties: {
                    A: { type: 'STRING' },
                    B: { type: 'STRING' },
                    C: { type: 'STRING' },
                    D: { type: 'STRING' },
                    E: { type: 'STRING' },
                  },
                  required: ['A', 'B', 'C', 'D', 'E'],
                },
                correct_answer: { type: 'STRING' },
                rational_explanation: { type: 'STRING' },
              },
              required: ['id', 'type', 'question_text', 'options', 'correct_answer', 'rational_explanation'],
            },
          },
        },
        required: ['test_id', 'questions'],
      },
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (response.status === 429 && retries < maxRetries) {
        retries++;
        const waitTime = Math.pow(3, retries) * 1000; // 3s, 9s, 27s
        console.log(`429 Too Many Requests. Retrying in ${waitTime/1000}s... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      break;
    }

    clearTimeout(timeoutId);

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response?.status}`;

      if (response?.status === 400) {
        throw new Error(`Geçersiz istek: ${errorMessage}`);
      } else if (response?.status === 401 || response?.status === 403) {
        throw new Error('API anahtarı geçersiz veya yetkisiz. Lütfen anahtarınızı kontrol edin.');
      } else if (response?.status === 429) {
        throw new Error('Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.');
      } else if (response?.status && response.status >= 500) {
        throw new Error('Gemini sunucusunda bir hata oluştu. Lütfen tekrar deneyin.');
      } else {
        throw new Error(`API Hatası: ${errorMessage}`);
      }
    }

    const data = await response.json();

    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Gemini API boş yanıt döndü. Lütfen tekrar deneyin.');
    }

    // Parse JSON from response - clean any markdown artifacts
    let cleanedText = textContent.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    let quiz: Quiz;
    try {
      quiz = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse hatası:', cleanedText.substring(0, 200));
      throw new Error('API yanıtı geçerli bir JSON formatında değil. Lütfen tekrar deneyin.');
    }

    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error('API yanıtında sorular bulunamadı. Lütfen tekrar deneyin.');
    }

    // Validate each question
    quiz.questions = quiz.questions.map((q: any, index: number) => {
      const question: QuizQuestion = {
        id: q.id || index + 1,
        type: q.type || 'Çoktan Seçmeli',
        question_text: q.question_text || '',
        options: {
          A: q.options?.A || '',
          B: q.options?.B || '',
          C: q.options?.C || '',
          D: q.options?.D || '',
          E: q.options?.E || '',
        },
        correct_answer: q.correct_answer || 'A',
        rational_explanation: q.rational_explanation || 'Açıklama mevcut değil.',
      };

      if (!question.question_text) {
        throw new Error(`Soru ${index + 1} metni boş.`);
      }

      if (!['A', 'B', 'C', 'D', 'E'].includes(question.correct_answer)) {
        question.correct_answer = 'A';
      }

      return question;
    });

    // Ensure unique IDs
    quiz.questions = quiz.questions.map((q, index) => ({
      ...q,
      id: index + 1,
    }));

    if (!quiz.test_id) {
      quiz.test_id = `test_${Date.now()}`;
    }

    return quiz;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
    }

    if (error.message && !error.message.includes('fetch')) {
      throw error;
    }

    throw new Error('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
  }
}
