import { Profile, Chapter, ChapterProgress, Feedback, Question, AppState, Option } from './types';
import { CLASS_OPTIONS } from '../constants';

export const getChapterId = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

export const downloadJSON = (data: object, filename: string): void => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const generateStudentReport = (state: AppState) => {
    const { profile, activities, progress, chapterOrder } = state;
    if (!profile) return null;

    const classInfo = CLASS_OPTIONS.find(c => c.value === profile.classId);

    const results = chapterOrder
        .map(chapterId => {
            const chapter = activities[chapterId];
            const prog = progress[chapterId];
            
            if (!chapter || !prog || (Object.keys(prog.quiz.answers).length === 0 && Object.keys(prog.exercisesFeedback).length === 0)) {
                return null;
            }

            const quizScorePercentage = chapter.quiz.length > 0 
                ? (prog.quiz.score / chapter.quiz.length) * 100 
                : (prog.quiz.isSubmitted ? 100 : 0);

            // Find the index of the selected answer for each question
            const quizAnswersWithIndices: { [qId: string]: number } = {};
            Object.keys(prog.quiz.answers).forEach(qId => {
                const question = chapter.quiz.find(q => q.id === qId);
                if (question) {
                    const answerIndex = question.options.findIndex(opt => opt.text === prog.quiz.answers[qId]);
                    if (answerIndex !== -1) {
                        quizAnswersWithIndices[qId] = answerIndex;
                    }
                }
            });

            return {
                chapter: chapter.chapter,
                quiz: {
                    isSubmitted: prog.quiz.isSubmitted,
                    score: parseFloat(quizScorePercentage.toFixed(2)),
                    answers: quizAnswersWithIndices,
                },
                exercisesFeedback: prog.exercisesFeedback,
                durationSeconds: (prog.quiz.duration || 0) + (prog.exercisesDuration || 0),
            };
        })
        .filter((result): result is NonNullable<typeof result> => result !== null);

    return {
        studentName: profile.name,
        studentLevel: classInfo ? classInfo.value : profile.classId, // Use class value '1bsm' as per example
        timestamp: Date.now(),
        results,
    };
};

export const generateStudentProgressSubmission = (
    profile: Profile,
    className: string,
    chapter: Chapter,
    chapterProgress: ChapterProgress
) => {
    const quizResults = {
        score: chapterProgress.quiz.score,
        totalQuestions: chapter.quiz.length,
        percentage: chapter.quiz.length > 0 ? (chapterProgress.quiz.score / chapter.quiz.length) * 100 : 0,
        durationInSeconds: chapterProgress.quiz.duration || 0,
        answers: Object.entries(chapterProgress.quiz.answers).map(([qId, userAnswer]) => {
            const question = chapter.quiz.find(q => q.id === qId);
            const correctAnswer = question?.options.find(opt => opt.isCorrect)?.text;
            return {
                questionId: qId,
                questionText: question?.question || 'N/A',
                userAnswer: userAnswer,
                correctAnswer: correctAnswer || 'N/A',
                isCorrect: userAnswer === correctAnswer,
            };
        }),
    };
    
    const exercisesSelfAssessment = {
        completionPercentage: chapter.exercises.length > 0 ? (Object.keys(chapterProgress.exercisesFeedback).length / chapter.exercises.length) * 100 : 0,
        totalExercises: chapter.exercises.length,
        durationInSeconds: chapterProgress.exercisesDuration || 0,
        feedback: Object.entries(chapterProgress.exercisesFeedback).map(([exId, studentFeedback]) => {
            const exercise = chapter.exercises.find(ex => ex.id === exId);
            return {
                exerciseId: exId,
                exerciseTitle: exercise?.title || 'N/A',
                studentFeedback: studentFeedback,
            }
        }),
    };

    return {
      submissionDate: new Date().toISOString(),
      studentProfile: {
        name: profile.name,
        classId: profile.classId,
        className: className,
      },
      chapterDetails: {
        id: chapter.id,
        title: chapter.chapter,
      },
      quizResults,
      exercisesSelfAssessment,
    };
};