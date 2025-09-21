
import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Quiz from '../Quiz';
import Exercises from '../Exercises';

const ActivityView: React.FC = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const { currentChapterId, activities, activitySubView } = state;

    if (!currentChapterId || !activities[currentChapterId]) {
        return <div>Erreur: Chapitre non chargé.</div>;
    }

    const chapter = activities[currentChapterId];
    const subViewTitle = activitySubView === 'quiz' ? 'Quiz' : 'Exercices';

    return (
        <div className="max-w-4xl mx-auto animate-slideInUp">
             <header className="relative flex items-center justify-center mb-8">
                 <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: { view: 'work-plan' } })}
                    className="font-button absolute left-0 flex items-center justify-center w-10 h-10 rounded-full text-secondary bg-transparent border border-transparent hover:bg-surface hover:border-border transition-all duration-200 active:scale-95"
                    aria-label="Retour au plan de travail"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-text font-title">{subViewTitle}</h1>
                    <p className="text-secondary">{chapter.chapter}</p>
                </div>
            </header>

            {activitySubView === 'quiz' && <Quiz />}
            {activitySubView === 'exercises' && <Exercises />}
        </div>
    );
};

export default ActivityView;