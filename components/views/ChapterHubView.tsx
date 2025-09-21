import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { CLASS_OPTIONS } from '../../constants';
import { generateStudentProgressSubmission } from '../../utils/utils';
import ConfirmationModal from '../ConfirmationModal';
import { useNotification } from '../../context/NotificationContext';

type BadgeStatus = 'completed' | 'in-progress' | 'todo' | 'ready' | 'locked';

const ChapterHubView: React.FC = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const { addNotification } = useNotification();
    const { currentChapterId, activities, progress, profile } = state;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);

    const chapter = useMemo(() => {
        if (!currentChapterId) return null;
        return activities[currentChapterId];
    }, [currentChapterId, activities]);

    const chapterProgress = useMemo(() => {
        if (!currentChapterId) return null;
        return progress[currentChapterId];
    }, [currentChapterId, progress]);
    
    const className = useMemo(() => {
        if (!profile) return '';
        return CLASS_OPTIONS.find(c => c.value === profile.classId)?.label || profile.classId;
    }, [profile]);

    if (!chapter || !chapterProgress || !profile) {
        return (
            <div className="text-center p-12">
                <h2 className="text-xl font-semibold">Chargement du plan de travail...</h2>
                <p className="text-secondary mt-2">Veuillez patienter un instant.</p>
            </div>
        );
    }

    const { quiz } = chapterProgress;
    const totalExercises = chapter.exercises.length;
    const evaluatedExercisesCount = Object.keys(chapterProgress.exercisesFeedback).length;

    const quizProgressPercent = useMemo(() => {
        if (quiz.isSubmitted) return 100;
        if (chapter.quiz.length === 0) return 0;
        return (Object.keys(quiz.answers).length / chapter.quiz.length) * 100;
    }, [quiz.answers, quiz.isSubmitted, chapter.quiz.length]);
    
    const exercisesProgressPercent = useMemo(() => {
        if (totalExercises === 0) return 100;
        return (evaluatedExercisesCount / totalExercises) * 100;
    }, [evaluatedExercisesCount, totalExercises]);

    const isQuizCompleted = quiz.isSubmitted;
    const areExercisesEvaluated = evaluatedExercisesCount === totalExercises;
    const canSubmitWork = isQuizCompleted && areExercisesEvaluated && !chapterProgress.isWorkSubmitted;

    const handleStartQuiz = () => {
        dispatch({ type: 'CHANGE_VIEW', payload: { view: 'activity', chapterId: chapter.id, subView: 'quiz' } });
    };

    const handleReviewQuiz = () => {
        dispatch({ type: 'CHANGE_VIEW', payload: { view: 'activity', chapterId: chapter.id, subView: 'quiz', review: true } });
    };

    const handleStartExercises = () => {
        dispatch({ type: 'CHANGE_VIEW', payload: { view: 'activity', chapterId: chapter.id, subView: 'exercises' } });
    };
    
    const handleSubmitWork = async () => {
        if (!canSubmitWork) {
            addNotification('Veuillez terminer toutes les étapes avant de soumettre.', 'warning');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const submissionData = generateStudentProgressSubmission(profile, className, chapter, chapterProgress);
            
            const emailBody = formatEmailBody(submissionData);
            
            const formData = new FormData();
            
            // Subject for the email, used by the serverless function
            formData.append('_subject', `✅ Travail soumis: ${profile.name} - ${chapter.chapter}`);
            
            // Body of the email
            formData.append('message', emailBody);
            
            // JSON file attachment
            const submissionJson = JSON.stringify(submissionData, null, 2);
            const blob = new Blob([submissionJson], { type: 'application/json' });
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `${profile.name.replace(/\s+/g, '_')}_${chapter.id}_${timestamp}.json`;
            formData.append('attachment', blob, filename);

            // Send to our new serverless function endpoint
            const response = await fetch('/api/submit-work', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // Mark work as submitted on success
                dispatch({ type: 'SUBMIT_WORK', payload: { chapterId: chapter.id } });
                
                // Success notification
                addNotification('✅ Votre travail a été envoyé avec succès !', 'success');
                
                // Save a local backup (optional but good practice)
                saveLocalBackup(submissionData, filename);
            } else {
                const result = await response.json().catch(() => ({ message: 'Erreur de communication avec le serveur.' }));
                throw new Error(result.message || 'Erreur lors de la soumission');
            }

        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
            addNotification(
                `❌ Une erreur est survenue lors de l'envoi. Veuillez réessayer. (${errorMessage})`,
                'error'
            );
        } finally {
            setIsSubmitting(false);
            setConfirmationModalOpen(false);
        }
    };
    
    // Function to format the email body
    const formatEmailBody = (data: any): string => {
        const { studentProfile, chapterDetails, quizResults, exercisesSelfAssessment } = data;
        
        const feedbackToScore: { [key: string]: number } = {
            'Réussi facilement': 5,
            'J\'ai réfléchi': 4,
            'C\'était un défi': 3,
            'Non traité': 0
        };

        const totalScore = exercisesSelfAssessment.feedback.reduce((acc: number, ex: any) => {
             return acc + (feedbackToScore[ex.studentFeedback] || 0);
        }, 0);
        
        const evaluatedCount = exercisesSelfAssessment.feedback.length;
        const averageExerciseScore = evaluatedCount > 0 ? (totalScore / evaluatedCount).toFixed(2) : 'N/A';

        const totalDuration = (quizResults.durationInSeconds || 0) + (exercisesSelfAssessment.durationInSeconds || 0);
        const timeSpent = totalDuration > 0 ? `${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s` : 'Non disponible';
        
        return `
📚 NOUVEAU TRAVAIL SOUMIS
========================

👤 ÉTUDIANT
-----------
Nom: ${studentProfile.name}
Classe: ${studentProfile.className}
Date de soumission: ${new Date(data.submissionDate).toLocaleString('fr-FR')}

📖 CHAPITRE
-----------
${chapterDetails.title}
ID: ${chapterDetails.id}

📊 RÉSULTATS
------------
Quiz: ${quizResults.score}/${quizResults.totalQuestions} (${quizResults.percentage.toFixed(2)}%)
Exercices évalués: ${evaluatedCount}/${exercisesSelfAssessment.totalExercises}
Note moyenne des exercices: ${averageExerciseScore}/5

🎯 DÉTAILS DU QUIZ
------------------
Questions réussies: ${quizResults.answers.filter((a: any) => a.isCorrect).length}
Questions échouées: ${quizResults.answers.filter((a: any) => !a.isCorrect).length}
Temps passé: ${timeSpent}

💪 AUTO-ÉVALUATION DES EXERCICES
---------------------------------
${exercisesSelfAssessment.feedback.map((ex: any) => {
    const score = feedbackToScore[ex.studentFeedback] || 0;
    return `• ${ex.exerciseTitle}: ${score}/5 - ${ex.studentFeedback || 'Pas de commentaire'}`
}).join('\n')}

📎 Voir le fichier JSON joint pour plus de détails.
        `.trim();
    };
    
    // Function to save a local backup (optional)
    const saveLocalBackup = (data: any, filename: string) => {
        try {
            const backupKey = `submission_backup_${chapter.id}_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify({
                filename,
                data,
                timestamp: new Date().toISOString()
            }));
            
            cleanOldBackups();
        } catch (error) {
            console.warn('Impossible de sauvegarder localement:', error);
        }
    };
    
    const cleanOldBackups = () => {
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('submission_backup_'))
            .sort()
            .reverse();
        
        backupKeys.slice(5).forEach(key => {
            localStorage.removeItem(key);
        });
    };
    
    const getQuizStatus = (): { text: string; status: BadgeStatus } => {
        if (quiz.isSubmitted) return { text: 'Terminé', status: 'completed' };
        if (Object.keys(quiz.answers).length > 0) return { text: 'En cours', status: 'in-progress' };
        return { text: 'À commencer', status: 'todo' };
    };

    const getExercisesStatus = (): { text: string; status: BadgeStatus } => {
        if (areExercisesEvaluated) return { text: 'Terminé', status: 'completed' };
        if (evaluatedExercisesCount > 0) return { text: 'En cours', status: 'in-progress' };
        return { text: 'À commencer', status: 'todo' };
    };

    const getSubmissionStatus = (): { text: string; status: BadgeStatus } => {
        if (chapterProgress.isWorkSubmitted) return { text: 'Travail soumis', status: 'completed' };
        if (canSubmitWork) return { text: 'Prêt à être soumis', status: 'ready' };
        return { text: 'Verrouillé', status: 'locked' };
    };

    const quizStatus = getQuizStatus();
    const exercisesStatus = getExercisesStatus();
    const submissionStatus = getSubmissionStatus();
    const isSubmissionUnlocked = canSubmitWork || chapterProgress.isWorkSubmitted;
    
    const getStatusBadge = (status: BadgeStatus, text: string) => {
        const styles: Record<BadgeStatus, string> = {
            completed: 'bg-success/10 text-success',
            'in-progress': 'bg-warning/10 text-warning',
            todo: 'bg-secondary/10 text-secondary',
            ready: 'bg-info/10 text-info',
            locked: 'bg-secondary/10 text-secondary',
        };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{text}</span>;
    };

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <header className="relative flex items-center justify-center mb-8">
                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: { view: 'dashboard' } })}
                    className="font-button absolute left-0 flex items-center justify-center w-10 h-10 rounded-full text-secondary bg-transparent border border-transparent hover:bg-surface hover:border-border transition-all duration-200 active:scale-95"
                    aria-label="Retour au tableau de bord"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-text font-title">Plan de travail</h1>
                    <p className="text-secondary">{chapter.chapter}</p>
                </div>
            </header>
            
            <div className="space-y-6">
                {/* Étape 1: Quiz */}
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="flex-grow">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center justify-center w-10 h-10 bg-primary-light text-primary rounded-full font-bold text-xl shrink-0">
                                    <span className="material-symbols-outlined">lock_open</span>
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-text">Étape 1 : Le Quiz</h2>
                                </div>
                            </div>
                            <p className="text-secondary mt-3 pl-14 text-sm max-w-md">
                                {isQuizCompleted ? 'Quiz terminé. Vous pouvez maintenant passer aux exercices.' : 'Vérifiez votre compréhension des concepts clés du chapitre.'}
                            </p>
                        </div>
                        <div className="w-full sm:w-auto sm:max-w-[240px] flex-shrink-0 flex flex-col gap-3 self-stretch">
                            <div className="flex-grow flex flex-col justify-center w-full">
                                <div className="flex items-baseline justify-between w-full mb-1">
                                    <span className="text-sm font-semibold text-text-secondary">{isQuizCompleted ? 'Score' : 'Progression'}</span>
                                    {isQuizCompleted 
                                        ? <span className="font-bold text-lg text-primary">{quiz.score}/{chapter.quiz.length}</span> 
                                        : getStatusBadge(quizStatus.status, quizStatus.text)}
                                </div>
                                <div className="w-full bg-border/50 rounded-full h-3">
                                    <div className={`h-3 rounded-full transition-all duration-500 ${isQuizCompleted ? 'bg-success' : 'bg-primary'}`} style={{ width: `${quizProgressPercent}%` }} />
                                </div>
                            </div>
                             <div className="w-full sm:w-auto">
                                {isQuizCompleted ? (
                                    <button onClick={handleReviewQuiz} className="font-button w-full px-6 py-2 font-semibold text-primary bg-primary-light border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">
                                        Revoir le Quiz
                                    </button>
                                ) : (
                                    <button onClick={handleStartQuiz} className="font-button w-full px-6 py-2 font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-transform transform hover:-translate-y-px active:scale-95">
                                        {Object.keys(quiz.answers).length > 0 ? 'Continuer le Quiz' : 'Commencer le Quiz'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Étape 2: Exercices */}
                <div className={`bg-surface p-5 rounded-xl border border-border shadow-sm transition-opacity ${!isQuizCompleted && 'opacity-60'}`}>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="flex-grow">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center justify-center w-10 h-10 bg-primary-light text-primary rounded-full font-bold text-xl shrink-0">
                                    <span className="material-symbols-outlined">{isQuizCompleted ? 'lock_open' : 'lock'}</span>
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-text">Étape 2 : Les Exercices</h2>
                                </div>
                            </div>
                             <p className="text-secondary mt-3 pl-14 text-sm max-w-md">
                                {areExercisesEvaluated ? 'Tous les exercices ont été auto-évalués.' : 'Mettez en pratique vos connaissances et évaluez votre maîtrise.'}
                            </p>
                        </div>
                        <div className="w-full sm:w-auto sm:max-w-[240px] flex-shrink-0 flex flex-col gap-3 self-stretch">
                            <div className="flex-grow flex flex-col justify-center w-full">
                                <div className="flex items-baseline justify-between w-full mb-1">
                                    <span className="text-sm font-semibold text-text-secondary">Progression</span>
                                    {getStatusBadge(exercisesStatus.status, `${evaluatedExercisesCount}/${totalExercises}`)}
                                </div>
                                <div className="w-full bg-border/50 rounded-full h-3">
                                    <div className={`h-3 rounded-full transition-all duration-500 ${areExercisesEvaluated ? 'bg-success' : 'bg-primary'}`} style={{ width: `${exercisesProgressPercent}%` }} />
                                </div>
                            </div>
                             <div className="w-full sm:w-auto">
                                <button 
                                    onClick={handleStartExercises} 
                                    disabled={!isQuizCompleted || chapterProgress.isWorkSubmitted} 
                                    className="font-button w-full px-6 py-2 font-semibold text-primary bg-primary-light border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-light"
                                >
                                    {evaluatedExercisesCount > 0 ? 'Continuer les exercices' : 'Commencer les exercices'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Étape 3: Soumission */}
                <div className={`bg-surface p-5 rounded-xl border border-border shadow-sm transition-opacity ${!isSubmissionUnlocked && 'opacity-60'}`}>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="flex-grow">
                            <div className="flex items-center gap-4">
                               <span className="flex items-center justify-center w-10 h-10 bg-primary-light text-primary rounded-full font-bold text-xl shrink-0">
                                    <span className="material-symbols-outlined">{isSubmissionUnlocked ? 'lock_open' : 'lock'}</span>
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-text">Étape 3 : Soumission</h2>
                                </div>
                            </div>
                             <p className="text-secondary mt-3 pl-14 text-sm max-w-md">
                                {chapterProgress.isWorkSubmitted ? 'Excellent travail ! Votre progression a été enregistrée et envoyée.' : 'Une fois les étapes 1 et 2 terminées, vous pourrez envoyer votre travail.'}
                             </p>
                        </div>
                        <div className="w-full sm:w-auto sm:max-w-[240px] flex-shrink-0 flex flex-col items-end gap-3 self-stretch">
                            <div className="flex-grow flex flex-col items-end justify-center w-full">
                               <div className="flex items-center justify-between w-full">
                                    <span className="text-sm font-semibold text-text-secondary">Statut</span>
                                    {getStatusBadge(submissionStatus.status, submissionStatus.text)}
                                </div>
                            </div>
                             <div className="w-full sm:w-auto">
                                {chapterProgress.isWorkSubmitted ? (
                                    <div className="flex items-center justify-center gap-2 w-full px-6 py-2 rounded-lg font-semibold bg-success/10 text-success">
                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                        <span>Travail Envoyé</span>
                                    </div>
                                ) : (
                                    <div className="relative group w-full">
                                        <button
                                            onClick={() => setConfirmationModalOpen(true)}
                                            disabled={!canSubmitWork || isSubmitting}
                                            className="font-button w-full px-8 py-3 font-bold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:bg-secondary/50 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="animate-spin">⏳</span>
                                                    Envoi en cours...
                                                </span>
                                            ) : (
                                                'Envoyer le travail'
                                            )}
                                        </button>
                                        {(!canSubmitWork && !chapterProgress.isWorkSubmitted) && (
                                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 bg-text text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <ul className="list-none text-left space-y-1">
                                                    {!isQuizCompleted && <li>✓ Terminez le quiz</li>}
                                                    {!areExercisesEvaluated && <li>✓ Évaluez tous les exercices</li>}
                                                </ul>
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-text"></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={() => !isSubmitting && setConfirmationModalOpen(false)}
                onSubmit={handleSubmitWork}
                isSubmitting={isSubmitting}
                chapterTitle={chapter.chapter}
            />
        </div>
    );
};

export default ChapterHubView;