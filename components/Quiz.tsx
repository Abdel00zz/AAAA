import React, { useMemo, useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { MathJax } from 'better-react-mathjax';
import { useNotification } from '../context/NotificationContext';

const Quiz: React.FC = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const { addNotification } = useNotification();
    const { currentChapterId, activities, progress, isReviewMode } = state;
    const [timeSpent, setTimeSpent] = useState(0);

    if (!currentChapterId) return null;
    const chapter = activities[currentChapterId];
    const quizProgress = progress[currentChapterId].quiz;
    const { currentQuestionIndex, answers, isSubmitted, allAnswered, score } = quizProgress;
    const question = chapter.quiz[currentQuestionIndex];

    useEffect(() => {
        // Don't run timer in review mode or if quiz is already submitted
        if (isReviewMode || isSubmitted) return;

        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isReviewMode, isSubmitted]);

    const handleOptionChange = (answer: string) => {
        if (isSubmitted) return;
        dispatch({ type: 'UPDATE_QUIZ_ANSWER', payload: { qId: question.id, answer } });
    };

    const handleNavigate = (direction: 'next' | 'prev') => {
        const newIndex = direction === 'next' ? currentQuestionIndex + 1 : currentQuestionIndex - 1;
        if (newIndex >= 0 && newIndex < chapter.quiz.length) {
            dispatch({ type: 'NAVIGATE_QUIZ', payload: newIndex });
        }
    };

    const calculateScore = () => {
        return chapter.quiz.reduce((acc, q) => {
            const correctOption = q.options.find(opt => opt.isCorrect)?.text;
            if (answers[q.id] === correctOption) {
                return acc + 1;
            }
            return acc;
        }, 0);
    };

    const handleSubmit = () => {
        const finalScore = calculateScore();
        dispatch({ type: 'SUBMIT_QUIZ', payload: { score: finalScore, duration: timeSpent } });
    };

    const isPerfectScore = useMemo(() => score === chapter.quiz.length, [score, chapter.quiz.length]);

    if (isSubmitted || isReviewMode) {
        const userAnsw = answers[question.id];
        
        // Smartly find the explanation text
        const explanationText = question.explanation || question.options.find(opt => opt.isCorrect)?.explanation;

        return (
            <div className="bg-surface p-6 rounded-lg border border-border">
                {isSubmitted && !isReviewMode && (
                     <div className="text-center mb-8 p-6 bg-background rounded-lg">
                        <h2 className="text-2xl font-bold text-text">Quiz terminé !</h2>
                        <p className="text-secondary mt-2">Votre score est de :</p>
                        <p className={`text-4xl sm:text-5xl font-bold my-2 ${isPerfectScore ? 'text-success' : 'text-primary'}`}>
                            {score} / {chapter.quiz.length}
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row-reverse justify-center items-center gap-3">
                            <button 
                                onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: { view: 'activity', chapterId: currentChapterId, subView: 'exercises' } })}
                                className="font-button w-full sm:w-auto px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-transform transform hover:-translate-y-px active:scale-95"
                            >
                                Continuer vers les exercices
                            </button>
                            <button 
                                onClick={() => dispatch({ type: 'TOGGLE_REVIEW_MODE', payload: true })}
                                className="font-button w-full sm:w-auto px-6 py-2 font-semibold text-primary border border-primary rounded-lg hover:bg-primary-light"
                            >
                                Revoir mes réponses
                            </button>
                        </div>
                    </div>
                )}

                {(isReviewMode) && (
                    <>
                        <div className="mb-4 text-sm text-secondary">Question {currentQuestionIndex + 1} sur {chapter.quiz.length}</div>
                        <h3 className="text-xl font-semibold mb-6 text-text">
                            <MathJax dynamic>{question.question}</MathJax>
                        </h3>
                        <div className="space-y-3">
                            {question.options.map((option, index) => {
                                const isCorrect = option.isCorrect;
                                const isSelected = userAnsw === option.text;
                                let optionClass = "border-border";
                                if (isCorrect) optionClass = "border-success bg-success/10";
                                else if (isSelected && !isCorrect) optionClass = "border-error bg-error/10";
                                
                                return (
                                    <div key={index} className={`p-4 rounded-lg border-2 ${optionClass}`}>
                                        <MathJax dynamic>{option.text}</MathJax>
                                    </div>
                                );
                            })}
                        </div>
                        {explanationText && (
                            <div className="mt-6 p-4 bg-background rounded-lg border border-border">
                                <p className="font-bold text-text">Explication :</p>
                                <p className="text-secondary mt-1"><MathJax dynamic>{explanationText}</MathJax></p>
                            </div>
                        )}
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => handleNavigate('prev')} disabled={currentQuestionIndex === 0} className="font-button px-4 py-2 font-semibold text-primary rounded-lg hover:bg-primary-light disabled:opacity-50">Précédent</button>
                            <button onClick={() => handleNavigate('next')} disabled={currentQuestionIndex === chapter.quiz.length - 1} className="font-button px-4 py-2 font-semibold text-primary rounded-lg hover:bg-primary-light disabled:opacity-50">Suivant</button>
                        </div>
                     </>
                )}
            </div>
        );
    }
    
    return (
        <div className="bg-surface p-6 rounded-lg border border-border">
            <div className="mb-4 text-sm text-secondary">Question {currentQuestionIndex + 1} sur {chapter.quiz.length}</div>
            <h3 className="text-xl font-semibold mb-6 text-text">
                <MathJax dynamic>{question.question}</MathJax>
            </h3>
            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <label key={index} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${answers[question.id] === option.text ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/50'}`}>
                        <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option.text}
                            checked={answers[question.id] === option.text}
                            onChange={() => handleOptionChange(option.text)}
                            className="form-radio h-5 w-5 text-primary focus:ring-primary"
                        />
                         <MathJax dynamic>{option.text}</MathJax>
                    </label>
                ))}
            </div>
            <div className="mt-8 flex justify-between items-center">
                <button onClick={() => handleNavigate('prev')} disabled={currentQuestionIndex === 0} className="font-button px-4 py-2 font-semibold text-primary rounded-lg hover:bg-primary-light disabled:opacity-50">Précédent</button>
                {currentQuestionIndex === chapter.quiz.length - 1 ? (
                    <button onClick={handleSubmit} disabled={!allAnswered} className="font-button px-6 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover disabled:bg-primary/50">Soumettre</button>
                ) : (
                    <button onClick={() => handleNavigate('next')} disabled={!answers[question.id]} className="font-button px-4 py-2 font-semibold text-primary rounded-lg hover:bg-primary-light disabled:opacity-50">Suivant</button>
                )}
            </div>
        </div>
    );
};

export default Quiz;