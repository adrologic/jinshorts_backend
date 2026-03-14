import { Request, Response } from 'express';
import { Quiz, QuizParticipation, QuestionBank, User } from '../database/models';
import { AuthRequest } from '../types';
import { sendPushToAll } from '../utils/firebase';

// ---- Admin endpoints ----

export async function getAllQuizzes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
}

export async function createQuiz(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quiz = await Quiz.create({
      ...req.body,
      createdBy: req.user!.id,
    });
    res.status(201).json(quiz);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create quiz' });
  }
}

export async function updateQuiz(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) { res.status(404).json({ error: 'Quiz not found' }); return; }
    if (quiz.status === 'live' || quiz.status === 'completed') {
      res.status(400).json({ error: 'Cannot edit a live or completed quiz' });
      return;
    }
    Object.assign(quiz, req.body);
    await quiz.save();
    res.json(quiz);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update quiz' });
  }
}

export async function deleteQuiz(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) { res.status(404).json({ error: 'Quiz not found' }); return; }
    if (quiz.status === 'live') {
      res.status(400).json({ error: 'Cannot delete a live quiz' });
      return;
    }
    await Quiz.findByIdAndDelete(req.params.id);
    await QuizParticipation.deleteMany({ quizId: req.params.id });
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
}

export async function publishQuiz(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) { res.status(404).json({ error: 'Quiz not found' }); return; }

    if (!quiz.questionCount || quiz.questionCount <= 0) {
      res.status(400).json({ error: 'Quiz must have questionCount > 0' });
      return;
    }

    // Check if enough questions exist in the bank matching the quiz filters
    const questionFilter: any = { isActive: true };
    if (quiz.questionCategories.length > 0) {
      questionFilter.category = { $in: quiz.questionCategories };
    }
    if (quiz.questionDifficulty.length > 0) {
      questionFilter.difficulty = { $in: quiz.questionDifficulty };
    }

    const availableCount = await QuestionBank.countDocuments(questionFilter);
    if (availableCount < quiz.questionCount) {
      res.status(400).json({
        error: `Not enough questions in the bank. Need ${quiz.questionCount}, found ${availableCount}.`,
      });
      return;
    }

    const now = new Date();
    if (quiz.scheduledAt && new Date(quiz.scheduledAt) > now) {
      quiz.status = 'scheduled';
    } else {
      quiz.status = 'live';
      quiz.startedAt = now;
      quiz.endedAt = new Date(now.getTime() + (quiz.duration + 600) * 1000);
    }
    await quiz.save();

    // Send push notification when quiz goes live
    if (quiz.status === 'live') {
      sendPushToAll({
        title: 'New Quiz is Live!',
        body: quiz.title,
        data: { type: 'quiz', quizId: quiz._id.toString() },
        channelId: 'quiz',
      }).catch(() => {});
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish quiz' });
  }
}

export async function getQuizResults(req: AuthRequest, res: Response): Promise<void> {
  try {
    const participations = await QuizParticipation.find({ quizId: req.params.id })
      .populate('userId', 'name email avatarUrl')
      .populate('questionOrder', 'questionText options marks')
      .sort({ score: -1, timeTaken: 1 })
      .lean();

    const ranked = participations.map((p, i) => ({ ...p, rank: i + 1, user: p.userId }));
    const quiz = await Quiz.findById(req.params.id).lean();
    res.json({ quiz, participations: ranked, totalParticipants: ranked.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
}

// ---- Public/User endpoints ----

export async function getActiveQuizzes(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();

    // Atomically transition scheduled quizzes to live and send notifications
    const goingLive = await Quiz.find({ status: 'scheduled', scheduledAt: { $lte: now } }).lean();
    for (const quiz of goingLive) {
      // Atomically set status only if still 'scheduled' (prevents duplicate notifications from concurrent requests)
      const updated = await Quiz.findOneAndUpdate(
        { _id: quiz._id, status: 'scheduled' },
        { $set: { status: 'live', startedAt: now, endedAt: new Date(now.getTime() + (quiz.duration + 600) * 1000) } },
        { new: true }
      );
      if (updated) {
        sendPushToAll({
          title: 'New Quiz is Live!',
          body: quiz.title,
          data: { type: 'quiz', quizId: quiz._id.toString() },
          channelId: 'quiz',
        }).catch(() => {});
      }
    }

    await Quiz.updateMany(
      { status: 'live', endedAt: { $lte: now } },
      { $set: { status: 'completed' } }
    );

    const quizzes = await Quiz.find({ status: { $in: ['live', 'scheduled'] }, isActive: true })
      .sort({ scheduledAt: 1, createdAt: -1 })
      .lean();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active quizzes' });
  }
}

export async function getQuizById(req: Request, res: Response): Promise<void> {
  try {
    const quiz = await Quiz.findById(req.params.id).lean();
    if (!quiz) { res.status(404).json({ error: 'Quiz not found' }); return; }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
}

export async function startQuiz(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) { res.status(404).json({ error: 'Quiz not found' }); return; }
    if (quiz.status !== 'live') {
      res.status(400).json({ error: 'Quiz is not currently live' });
      return;
    }

    // Check for existing participation (resume)
    const existing = await QuizParticipation.findOne({ quizId: quiz._id, userId: req.user!.id });
    if (existing) {
      if (existing.completedAt) {
        res.status(400).json({ error: 'You have already completed this quiz' });
        return;
      }
      // Resume: return the same questions from questionOrder
      const questions = await QuestionBank.find({ _id: { $in: existing.questionOrder } }).lean();
      // Maintain the original order
      const orderedQuestions = existing.questionOrder.map(id =>
        questions.find(q => q._id.toString() === id.toString())
      ).filter(Boolean);

      const safeQuestions = orderedQuestions.map((q: any) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options.map((o: any) => ({ text: o.text })),
        marks: q.marks,
        timeLimit: q.timeLimit || quiz.perQuestionTime || 30,
        language: q.language || 'en',
      }));
      res.json({ participation: existing, questions: safeQuestions, perQuestionTime: quiz.perQuestionTime || 30, duration: quiz.duration });
      return;
    }

    // New participation: randomly select questions from the bank
    const questionFilter: any = { isActive: true };
    if (quiz.questionCategories.length > 0) {
      questionFilter.category = { $in: quiz.questionCategories };
    }
    if (quiz.questionDifficulty.length > 0) {
      questionFilter.difficulty = { $in: quiz.questionDifficulty };
    }

    const randomQuestions = await QuestionBank.aggregate([
      { $match: questionFilter },
      { $sample: { size: quiz.questionCount } },
    ]);

    if (randomQuestions.length < quiz.questionCount) {
      res.status(400).json({ error: 'Not enough questions available for this quiz' });
      return;
    }

    const questionOrder = randomQuestions.map(q => q._id);

    const participation = await QuizParticipation.create({
      quizId: quiz._id,
      userId: req.user!.id,
      questionOrder,
      startedAt: new Date(),
      totalQuestions: quiz.questionCount,
      answers: [],
    });

    await Quiz.findByIdAndUpdate(quiz._id, { $inc: { totalParticipants: 1 } });

    const safeQuestions = randomQuestions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options.map((o: any) => ({ text: o.text })),
      marks: q.marks,
      timeLimit: q.timeLimit || quiz.perQuestionTime || 30,
      language: q.language || 'en',
    }));

    res.status(201).json({ participation, questions: safeQuestions, perQuestionTime: quiz.perQuestionTime || 30, duration: quiz.duration });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'You have already started this quiz' });
      return;
    }
    res.status(500).json({ error: 'Failed to start quiz' });
  }
}

export async function submitQuiz(req: AuthRequest, res: Response): Promise<void> {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) { res.status(404).json({ error: 'Quiz not found' }); return; }
    if (quiz.status !== 'live' && quiz.status !== 'completed') {
      res.status(400).json({ error: 'Quiz is not available for submission' });
      return;
    }

    const participation = await QuizParticipation.findOne({ quizId: quiz._id, userId: req.user!.id });
    if (!participation) { res.status(400).json({ error: 'You have not started this quiz' }); return; }
    if (participation.completedAt) { res.status(400).json({ error: 'Quiz already submitted' }); return; }

    const now = new Date();
    const elapsed = (now.getTime() - participation.startedAt.getTime()) / 1000;
    if (elapsed > quiz.duration + 5) {
      participation.completedAt = now;
      participation.timeTaken = Math.round(elapsed);
      await participation.save();
      res.status(400).json({ error: 'Time expired', score: participation.score });
      return;
    }

    // Fetch the questions that were assigned to this participation
    const questions = await QuestionBank.find({ _id: { $in: participation.questionOrder } }).lean();
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    const { answers } = req.body;
    let score = 0;
    let correctAnswers = 0;
    let bonusPoints = 0;
    const perQTime = quiz.perQuestionTime || 30;

    const gradedAnswers = (answers || []).map((a: any) => {
      const question = questionMap.get(a.questionId?.toString());
      if (!question) return { questionId: a.questionId, selectedOptionIndex: a.selectedOptionIndex, isCorrect: false, timeTakenMs: a.timeTakenMs || 0, answeredAt: now };
      const optIndex = typeof a.selectedOptionIndex === 'number' ? a.selectedOptionIndex : -1;
      if (optIndex < 0 || optIndex >= question.options.length) {
        return { questionId: a.questionId, selectedOptionIndex: optIndex, isCorrect: false, timeTakenMs: a.timeTakenMs || 0, answeredAt: now };
      }
      const isCorrect = question.options[a.selectedOptionIndex]?.isCorrect === true;
      if (isCorrect) {
        score += question.marks;
        correctAnswers++;
        // Bonus points for fast answers: if answered in less than half the time limit
        const answerTimeSec = (a.timeTakenMs || 0) / 1000;
        const questionTimeLimit = question.timeLimit || perQTime;
        if (answerTimeSec > 0 && answerTimeSec < questionTimeLimit * 0.5) {
          const bonus = Math.round(question.marks * 0.5 * (1 - answerTimeSec / questionTimeLimit));
          bonusPoints += bonus;
        }
      }
      return { questionId: a.questionId, selectedOptionIndex: a.selectedOptionIndex, isCorrect, timeTakenMs: a.timeTakenMs || 0, answeredAt: now };
    });

    const totalScore = score + bonusPoints;

    participation.answers = gradedAnswers;
    participation.score = totalScore;
    participation.bonusPoints = bonusPoints;
    participation.correctAnswers = correctAnswers;
    participation.completedAt = now;
    participation.timeTaken = Math.round(elapsed);
    await participation.save();

    // Update user streak and points
    try {
      const user = await User.findById(req.user!.id);
      if (user) {
        user.quizPoints = (user.quizPoints || 0) + totalScore;
        user.quizzesCompleted = (user.quizzesCompleted || 0) + 1;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const lastDate = user.lastQuizDate ? new Date(user.lastQuizDate) : null;
        if (lastDate) {
          lastDate.setHours(0, 0, 0, 0);
          const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (86400000));
          if (diffDays === 1) {
            user.quizStreak = (user.quizStreak || 0) + 1;
          } else if (diffDays > 1) {
            user.quizStreak = 1;
          }
        } else {
          user.quizStreak = 1;
        }
        user.lastQuizDate = now;
        await user.save();
      }
    } catch (_) { /* streak update failure should not block response */ }

    // Build results with correct answers and explanations
    const results = participation.questionOrder.map(qId => {
      const question = questionMap.get(qId.toString());
      if (!question) return null;
      const userAnswer = gradedAnswers.find((a: any) => a.questionId?.toString() === qId.toString());
      return {
        _id: question._id,
        questionText: question.questionText,
        options: question.options,
        marks: question.marks,
        explanation: (question as any).explanation || null,
        userAnswer: userAnswer?.selectedOptionIndex ?? -1,
        timeTakenMs: userAnswer?.timeTakenMs ?? 0,
      };
    }).filter(Boolean);

    res.json({ score: totalScore, bonusPoints, correctAnswers, totalQuestions: quiz.questionCount, timeTaken: participation.timeTaken, results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const participations = await QuizParticipation.find({
      quizId: req.params.id,
      completedAt: { $exists: true },
    })
      .populate('userId', 'name avatarUrl')
      .sort({ score: -1, timeTaken: 1 })
      .limit(50)
      .lean();

    const leaderboard = participations.map((p, i) => ({
      rank: i + 1,
      user: p.userId,
      score: p.score,
      correctAnswers: p.correctAnswers,
      totalQuestions: p.totalQuestions,
      timeTaken: p.timeTaken,
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}

export async function getMyQuizHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const participations = await QuizParticipation.find({ userId: req.user!.id })
      .populate('quizId', 'title status duration totalParticipants questionCount language')
      .sort({ createdAt: -1 })
      .lean();
    res.json(participations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
}

export async function getMyQuizStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id).select('quizPoints quizStreak lastQuizDate quizzesCompleted').lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    // Check if streak is still valid (last quiz was today or yesterday)
    let streak = user.quizStreak || 0;
    if (user.lastQuizDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const lastDate = new Date(user.lastQuizDate); lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / 86400000);
      if (diffDays > 1) streak = 0;
    }

    res.json({
      quizPoints: user.quizPoints || 0,
      quizStreak: streak,
      quizzesCompleted: user.quizzesCompleted || 0,
      lastQuizDate: user.lastQuizDate || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz stats' });
  }
}
