import { Response } from 'express';
import { QuestionBank } from '../database/models';
import { AuthRequest } from '../types';

export async function getAllQuestions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { category, difficulty, isActive } = req.query;
    const query: any = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const questions = await QuestionBank.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
}

export async function createQuestion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { questionText, options, category, difficulty, marks } = req.body;

    if (!questionText || !options || !category) {
      res.status(400).json({ error: 'questionText, options, and category are required' });
      return;
    }

    if (!Array.isArray(options) || options.length !== 4) {
      res.status(400).json({ error: 'Exactly 4 options are required' });
      return;
    }

    const correctCount = options.filter((o: any) => o.isCorrect).length;
    if (correctCount !== 1) {
      res.status(400).json({ error: 'Exactly one option must be marked as correct' });
      return;
    }

    const question = await QuestionBank.create({
      questionText,
      options,
      category,
      difficulty: difficulty || 'medium',
      marks: marks || 10,
      createdBy: req.user!.id,
    });

    res.status(201).json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create question' });
  }
}

export async function updateQuestion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { options } = req.body;

    if (options) {
      if (!Array.isArray(options) || options.length !== 4) {
        res.status(400).json({ error: 'Exactly 4 options are required' });
        return;
      }
      const correctCount = options.filter((o: any) => o.isCorrect).length;
      if (correctCount !== 1) {
        res.status(400).json({ error: 'Exactly one option must be marked as correct' });
        return;
      }
    }

    const question = await QuestionBank.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update question' });
  }
}

export async function deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const question = await QuestionBank.findByIdAndDelete(req.params.id);
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n').map(l => l.replace(/\r$/, ''));
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  const questions: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });

    const questionText = row['questiontext'] || row['question'] || '';
    const optA = row['optiona'] || row['a'] || '';
    const optB = row['optionb'] || row['b'] || '';
    const optC = row['optionc'] || row['c'] || '';
    const optD = row['optiond'] || row['d'] || '';
    const correct = (row['correctanswer'] || row['correct'] || row['answer'] || 'A').toUpperCase();
    const category = row['category'] || 'general';
    const difficulty = row['difficulty'] || 'medium';
    const marks = parseInt(row['marks'] || row['points'] || '10', 10) || 10;

    if (!questionText) continue;

    questions.push({
      questionText,
      options: [
        { text: optA, isCorrect: correct === 'A' },
        { text: optB, isCorrect: correct === 'B' },
        { text: optC, isCorrect: correct === 'C' },
        { text: optD, isCorrect: correct === 'D' },
      ],
      category,
      difficulty,
      marks,
    });
  }

  return questions;
}

export async function bulkUploadQuestions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { questions: jsonQuestions, csv, format } = req.body;
    let questions: any[];

    if (format === 'csv' && typeof csv === 'string') {
      questions = parseCSV(csv);
      if (questions.length === 0) {
        res.status(400).json({ error: 'No valid rows found in CSV. Expected headers: questionText, optionA, optionB, optionC, optionD, correctAnswer, category, difficulty, marks' });
        return;
      }
    } else if (Array.isArray(jsonQuestions)) {
      questions = jsonQuestions;
    } else {
      res.status(400).json({ error: 'Provide either a "questions" JSON array or "csv" text with format:"csv"' });
      return;
    }

    if (questions.length === 0) {
      res.status(400).json({ error: 'No questions provided' });
      return;
    }

    let success = 0;
    let failed = 0;
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.questionText || !q.options || !q.category) {
        failed++;
        errors.push({ index: i, error: 'questionText, options, and category are required' });
        continue;
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        failed++;
        errors.push({ index: i, error: 'Exactly 4 options are required' });
        continue;
      }

      const correctCount = q.options.filter((o: any) => o.isCorrect).length;
      if (correctCount !== 1) {
        failed++;
        errors.push({ index: i, error: 'Exactly one option must be marked as correct' });
        continue;
      }

      try {
        await QuestionBank.create({
          questionText: q.questionText,
          options: q.options,
          category: q.category,
          difficulty: q.difficulty || 'medium',
          marks: q.marks || 10,
          isActive: q.isActive !== false,
          createdBy: req.user!.id,
        });
        success++;
      } catch (err: any) {
        failed++;
        errors.push({ index: i, error: err.message });
      }
    }

    res.json({ success, failed, errors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk upload questions' });
  }
}
