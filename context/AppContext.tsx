import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useContext, useRef } from 'react';
// Fix: Removed unused 'ChapterData' type from import to resolve error. The other types are now correctly imported from the fixed types.ts file.
import { AppState, Action, Chapter, Profile, QuizProgress, ChapterProgress, Feedback } from '../types';
import { DB_KEY } from '../constants';
import { useNotification } from './NotificationContext';

const initialState: AppState = {
    view: 'login',
    profile: null,
    activities: {},
    progress: {},
    currentChapterId: null,
    activitySubView: null,
    isReviewMode: false,
    chapterOrder: [],
};

// ... (appReducer remains the same)
const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'INIT': {
            const { profile: loadedProfile, ...restPayload } = action.payload;
            let profile: Profile | null = loadedProfile || null;

            // Validate profile from localStorage. A valid profile must have a name and a classId.
            if (profile && (typeof profile.name !== 'string' || typeof profile.classId !== 'string' || !profile.classId.trim())) {
                profile = null; // Invalid profile, force re-login.
            }
            
            const restoredView = profile ? (restPayload.view || 'dashboard') : 'login';

            return {
                ...state,
                profile,
                progress: restPayload.progress || {},
                chapterOrder: restPayload.chapterOrder || [],
                view: restoredView,
                currentChapterId: restPayload.currentChapterId || null,
                activitySubView: restPayload.activitySubView || null,
            };
        }
        case 'CHANGE_VIEW': {
            const { view, chapterId, subView, review } = action.payload;
            const newState: AppState = {
                ...state,
                view,
                currentChapterId: chapterId !== undefined ? chapterId : state.currentChapterId,
                activitySubView: subView !== undefined ? subView : state.activitySubView,
                isReviewMode: review ?? false,
            };
            
            const targetChapterId = chapterId !== undefined ? chapterId : state.currentChapterId;

            if (view === 'activity' && subView === 'quiz' && review && targetChapterId && newState.progress[targetChapterId]) {
                const progress = newState.progress[targetChapterId];
                newState.progress = {
                    ...newState.progress,
                    [targetChapterId]: {
                        ...progress,
                        quiz: { ...progress.quiz, currentQuestionIndex: 0 }
                    }
                };
            }
        
            return newState;
        }
        case 'LOGIN':
            return { ...state, profile: action.payload, view: 'dashboard' };
        case 'NAVIGATE_QUIZ': {
            if (!state.currentChapterId) return state;
            const progress = state.progress[state.currentChapterId];
            return {
                ...state,
                progress: {
                    ...state.progress,
                    [state.currentChapterId]: {
                        ...progress,
                        quiz: { ...progress.quiz, currentQuestionIndex: action.payload },
                    },
                },
            };
        }
        case 'UPDATE_QUIZ_ANSWER': {
            if (!state.currentChapterId) return state;
            const progress = state.progress[state.currentChapterId];
            const newAnswers = { ...progress.quiz.answers, [action.payload.qId]: action.payload.answer };
            const allAnswered = Object.keys(newAnswers).length === state.activities[state.currentChapterId].quiz.length;
            return {
                ...state,
                progress: {
                    ...state.progress,
                    [state.currentChapterId]: {
                        ...progress,
                        quiz: { ...progress.quiz, answers: newAnswers, allAnswered }
                    },
                },
            };
        }
        case 'SUBMIT_QUIZ': {
            if (!state.currentChapterId) return state;
            const progress = state.progress[state.currentChapterId];
            return {
                ...state,
                progress: {
                    ...state.progress,
                    [state.currentChapterId]: {
                        ...progress,
                        quiz: { 
                            ...progress.quiz, 
                            isSubmitted: true, 
                            score: action.payload.score, 
                            duration: action.payload.duration,
                            currentQuestionIndex: 0 
                        }
                    },
                },
            };
        }
        case 'TOGGLE_REVIEW_MODE': {
            if (!state.currentChapterId) return state;
            const progress = state.progress[state.currentChapterId];
            return {
                ...state,
                isReviewMode: action.payload,
                progress: {
                    ...state.progress,
                    [state.currentChapterId]: {
                        ...progress,
                        quiz: { ...progress.quiz, currentQuestionIndex: 0 },
                    },
                },
            };
        }
        case 'UPDATE_EXERCISE_FEEDBACK': {
            if (!state.currentChapterId) return state;
            const { exId, feedback } = action.payload;
            const progress = state.progress[state.currentChapterId];
            const newFeedback = { ...progress.exercisesFeedback, [exId]: feedback };
            return {
                ...state,
                progress: {
                    ...state.progress,
                    [state.currentChapterId]: { ...progress, exercisesFeedback: newFeedback }
                },
            };
        }
        case 'UPDATE_EXERCISES_DURATION': {
            if (!state.currentChapterId) return state;
            const progress = state.progress[state.currentChapterId];
            const newDuration = (progress.exercisesDuration || 0) + action.payload.duration;
            return {
                ...state,
                progress: {
                    ...state.progress,
                    [state.currentChapterId]: {
                        ...progress,
                        exercisesDuration: newDuration
                    }
                },
            };
        }
        case 'SUBMIT_WORK': {
            const { chapterId } = action.payload;
            if (!chapterId || !state.progress[chapterId]) return state;
            const progress = state.progress[chapterId];
             return {
                ...state,
                progress: {
                    ...state.progress,
                    [chapterId]: { ...progress, isWorkSubmitted: true }
                },
            };
        }
        case 'SYNC_ACTIVITIES':
            return {
                ...state,
                activities: action.payload.activities,
                progress: action.payload.progress,
                chapterOrder: action.payload.chapterOrder,
            };
        default:
            return state;
    }
};

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppProvider');
    }
    return context;
};

export const useAppDispatch = () => {
    const context = useContext(AppDispatchContext);
    if (context === undefined) {
        throw new Error('useAppDispatch must be used within an AppProvider');
    }
    return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const { addNotification } = useNotification();
    const fetchedClassRef = useRef<string | null>(null);

    // Effect 1: Load initial state from localStorage. Runs only once.
    useEffect(() => {
        let savedData: Partial<AppState> = {};
        try {
            const rawData = localStorage.getItem(DB_KEY);
            if (rawData) {
                const parsedData = JSON.parse(rawData);
                if (typeof parsedData === 'object' && parsedData !== null) {
                    savedData = parsedData;
                }
            }
        } catch (error) {
            console.error("Failed to load or parse data from localStorage, resetting.", error);
            localStorage.removeItem(DB_KEY);
        }
        dispatch({ type: 'INIT', payload: savedData });
    }, []);

    // Effect 2: Fetch and sync chapter data when profile class changes.
    useEffect(() => {
        const syncChaptersForClass = async (classId: string) => {
            if (classId === fetchedClassRef.current) return;
            fetchedClassRef.current = classId;

            try {
                const manifestRes = await fetch('/manifest.json');
                if (!manifestRes.ok) throw new Error("Manifest file not found");
                const manifest: { [id: string]: any[] } = await manifestRes.json();

                const chapterInfos = manifest[classId] || [];
                const allActivities: { [id: string]: Chapter } = {};
                const chapterOrderForClass = chapterInfos.map(info => info.id);

                if (chapterInfos.length > 0) {
                    const chapterPromises = chapterInfos.map(info => 
                        fetch(`/chapters/${info.file}`)
                            .then(res => res.ok ? res.json() : Promise.reject(`Could not load ${info.file}`))
                            .then(data => {
                                const normalizedData = { ...data };
                                // Ensure sessionDates is an array, handling old 'sessionDate' format.
                                if ('sessionDate' in normalizedData && typeof normalizedData.sessionDate === 'string') {
                                    normalizedData.sessionDates = [normalizedData.sessionDate];
                                    delete normalizedData.sessionDate;
                                } else if (!Array.isArray(normalizedData.sessionDates)) {
                                    normalizedData.sessionDates = [];
                                }
                                return { ...normalizedData, id: info.id, file: info.file, isActive: info.isActive };
                            })
                            .catch(err => { console.error(err); return null; })
                    );
                    const loadedChapters = (await Promise.all(chapterPromises)).filter(Boolean) as Chapter[];
                    loadedChapters.forEach(ch => allActivities[ch.id] = ch);
                }

                const newProgress = { ...state.progress };
                Object.values(allActivities).forEach(chapter => {
                    if (!newProgress[chapter.id]) {
                        newProgress[chapter.id] = {
                            quiz: { answers: {}, isSubmitted: false, score: 0, allAnswered: false, currentQuestionIndex: 0, duration: 0 },
                            exercisesFeedback: {},
                            isWorkSubmitted: false,
                            exercisesDuration: 0,
                        };
                    }
                });
                
                dispatch({ type: 'SYNC_ACTIVITIES', payload: { activities: allActivities, progress: newProgress, chapterOrder: chapterOrderForClass } });

            } catch (error) {
                console.error("Failed to load or sync chapter data:", error);
                addNotification("Impossible de charger les chapitres pour votre classe.", "error");
            }
        };

        if (state.profile?.classId) {
            syncChaptersForClass(state.profile.classId);
        } else {
            // No profile, so no chapters to load/show. Ensure state is clean.
             if(Object.keys(state.activities).length > 0) {
                 dispatch({ type: 'SYNC_ACTIVITIES', payload: { activities: {}, progress: state.progress, chapterOrder: [] } });
            }
            fetchedClassRef.current = null;
        }
    }, [state.profile, addNotification]);

    // Effect 3: Persist state to localStorage immediately on any state change.
    useEffect(() => {
        if (state.profile) { // Only save if logged in
            // Exclude large 'activities' object from persistence
            const { activities, isReviewMode, ...stateToSave } = state; 
            try {
                localStorage.setItem(DB_KEY, JSON.stringify(stateToSave));
            } catch (error) {
                console.error("Failed to save state to localStorage:", error);
                addNotification("Impossible de sauvegarder votre progression.", "error");
            }
        }
    }, [state, addNotification]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};