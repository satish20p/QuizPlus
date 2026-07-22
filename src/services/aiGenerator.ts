import { GoogleGenAI, Type } from '@google/genai';
import { Quiz, Question } from '../types/quiz';

export async function generateQuizWithAI(
  topic: string,
  numQuestions: number = 5,
  authorId: string,
  authorName: string
): Promise<Quiz> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY || '';
  
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set GEMINI_API_KEY in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Create a high-quality multiple choice question (MCQ) quiz about the topic: "${topic}".
Generate exactly ${numQuestions} questions.
Each question MUST have:
1. questionText: clear, engaging question statement.
2. options: exactly 4 options with text and unique option ids ("opt-a", "opt-b", "opt-c", "opt-d").
3. correctOptionId: the id of the correct option ("opt-a", "opt-b", "opt-c", or "opt-d").
4. explanation: a concise 1-2 sentence explanation of why the answer is correct.
5. timeLimitSeconds: appropriate time limit between 10 and 220 seconds based on difficulty.
6. points: 1000 base points.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionText: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ['id', 'text']
                  }
                },
                correctOptionId: { type: Type.STRING },
                explanation: { type: Type.STRING },
                timeLimitSeconds: { type: Type.NUMBER },
                points: { type: Type.NUMBER }
              },
              required: ['questionText', 'options', 'correctOptionId', 'explanation', 'timeLimitSeconds', 'points']
            }
          }
        },
        required: ['title', 'description', 'category', 'questions']
      }
    }
  });

  const parsed = JSON.parse(response.text || '{}');

  const questions: Question[] = (parsed.questions || []).map((q: any, idx: number) => ({
    id: `q-ai-${Date.now()}-${idx}`,
    questionText: q.questionText || `Question ${idx + 1}`,
    options: q.options || [
      { id: 'opt-a', text: 'Option A' },
      { id: 'opt-b', text: 'Option B' },
      { id: 'opt-c', text: 'Option C' },
      { id: 'opt-d', text: 'Option D' }
    ],
    correctOptionId: q.correctOptionId || 'opt-a',
    explanation: q.explanation || 'No explanation provided.',
    timeLimitSeconds: Math.min(Math.max(q.timeLimitSeconds || 30, 10), 220),
    points: q.points || 1000
  }));

  const quiz: Quiz = {
    id: `quiz-ai-${Date.now()}`,
    title: parsed.title || `${topic} Quiz`,
    description: parsed.description || `AI-generated quiz covering ${topic}.`,
    category: parsed.category || 'General Knowledge',
    authorId,
    authorName,
    questions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: true,
    timesHosted: 0
  };

  return quiz;
}
