import React, { useState, useMemo, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { Feedback, SubQuestion } from '../types';
import { MathJax } from 'better-react-mathjax';

const FeedbackButton: React.FC<{
    feedback: Feedback;
    currentFeedback: Feedback | undefined;
    onClick: (feedback: Feedback) => void;
}> = ({ feedback, currentFeedback, onClick }) => {
    const isSelected = feedback === currentFeedback;
    const styles: { [key in Feedback]: { base: string; selected: string } } = {
        'Réussi facilement': { base: 'border-success/50 hover:bg-success/10', selected: 'bg-success/10 border-success text-success' },
        'J\'ai réfléchi': { base: 'border-warning/50 hover:bg-warning/10', selected: 'bg-warning/10 border-warning text-warning' },
        'C\'était un défi': { base: 'border-error/50 hover:bg-error/10', selected: 'bg-error/10 border-error text-error' },
        'Non traité': { base: 'border-secondary/50 hover:bg-secondary/10', selected: 'bg-secondary/10 border-secondary text-secondary' },
    };

    return (
        <button
            onClick={() => onClick(feedback)}
            className={`font-button flex-1 px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all transform active:scale-95 ${
                isSelected ? styles[feedback].selected : styles[feedback].base
            }`}
        >
            {feedback}
        </button>
    );
};


const Exercises: React.FC = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const { currentChapterId, activities, progress } = state;

    useEffect(() => {
        const startTime = Date.now();

        return () => {
            const endTime = Date.now();
            const durationInSeconds = Math.round((endTime - startTime) / 1000);
            if (durationInSeconds > 0 && currentChapterId) {
                dispatch({ type: 'UPDATE_EXERCISES_DURATION', payload: { duration: durationInSeconds } });
            }
        };
    }, [dispatch, currentChapterId]);
    
    if (!currentChapterId) return null;
    const chapter = activities[currentChapterId];
    const exercisesFeedback = progress[currentChapterId].exercisesFeedback;

    const [expandedExId, setExpandedExId] = useState<string | null>(null);
    const [visibleHints, setVisibleHints] = useState<{ [exId: string]: Set<number> }>({});
    
    const totalExercises = chapter.exercises.length;
    
    const evaluatedExercisesCount = useMemo(() => {
        return Object.keys(exercisesFeedback).length;
    }, [exercisesFeedback]);

    const progressPercentage = totalExercises > 0 ? (evaluatedExercisesCount / totalExercises) * 100 : 0;


    const handleToggleExercise = (exId: string) => {
        setExpandedExId(prevId => (prevId === exId ? null : exId));
    };

    const handleShowHint = (exId: string, hintIndex: number) => {
        setVisibleHints(prev => ({
            ...prev,
            [exId]: new Set(prev[exId] || []).add(hintIndex),
        }));
    };
    
    const handleFeedback = (exId: string, feedback: Feedback) => {
        dispatch({ type: 'UPDATE_EXERCISE_FEEDBACK', payload: { exId, feedback } });
    };

    const renderSubQuestions = (subQuestions: SubQuestion[] | undefined) => (
        <ol className="list-decimal pl-5 mt-4 space-y-2 antique-list text-text-secondary">
            {subQuestions?.map((sq, index) => (
                <li key={index}><MathJax dynamic>{sq.text}</MathJax></li>
            ))}
        </ol>
    );
    
    const renderHints = (exId: string, hints: { text: string; sub_questions?: SubQuestion[] }[] | undefined) => (
        <div className="mt-4 space-y-2">
            {hints?.map((hint, index) => {
                 const isVisible = visibleHints[exId]?.has(index);
                 return (
                    <div key={index}>
                        {!isVisible ? (
                            <button onClick={() => handleShowHint(exId, index)} className="font-button text-sm text-info font-semibold flex items-center gap-1 hover:underline">
                                <span className="material-symbols-outlined text-base">lightbulb</span> Afficher l'indice {index + 1}
                            </button>
                        ) : (
                            <div className="p-3 bg-background rounded-md border border-border">
                                <MathJax dynamic>{hint.text}</MathJax>
                                {hint.sub_questions && renderSubQuestions(hint.sub_questions)}
                            </div>
                        )}
                    </div>
                 );
            })}
        </div>
    );

    return (
        <div className="space-y-4 pb-24">
            {chapter.exercises.map(exercise => (
                <div key={exercise.id} className="bg-surface p-6 rounded-lg border border-border">
                    <h3 className="text-xl font-semibold text-text">{exercise.title}</h3>
                    <div className="mt-4 text-text-secondary">
                        <MathJax dynamic>{exercise.statement}</MathJax>
                    </div>
                    
                    {exercise.sub_questions && renderSubQuestions(exercise.sub_questions)}
                    {exercise.hint && renderHints(exercise.id, exercise.hint)}

                    <div className="mt-6 border-t border-border pt-4">
                        <p className="text-sm font-semibold text-text mb-3">Comment vous êtes-vous senti face à cet exercice ?</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                           {(['Réussi facilement', 'J\'ai réfléchi', 'C\'était un défi', 'Non traité'] as Feedback[]).map(f => (
                                <FeedbackButton 
                                    key={f} 
                                    feedback={f}
                                    currentFeedback={exercisesFeedback[exercise.id]}
                                    onClick={(fb) => handleFeedback(exercise.id, fb)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
            
            <div className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-sm border-t border-border p-4 animate-slideInUp">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center text-sm text-secondary mb-1">
                        <span className="font-semibold">Progression de l'auto-évaluation</span>
                        <span>{evaluatedExercisesCount} / {totalExercises} auto-évalués</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                                progressPercentage === 100 ? 'bg-success' : 'bg-primary'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Exercises;