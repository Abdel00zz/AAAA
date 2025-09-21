import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Chapter, ChapterProgress } from '../../types';
import HelpModal from '../HelpModal';
import OrientationModal from '../OrientationModal';
import { CLASS_OPTIONS, DB_KEY } from '../../constants';
import { useNotification } from '../../context/NotificationContext';

// Types pour une meilleure type-safety
interface ChapterCardProps {
    chapter: Chapter;
    progress: ChapterProgress;
    onSelect: (chapterId: string) => void;
}

interface SessionStatusProps {
    dates: string[];
}

interface StatusInfo {
    text: string;
    icon: string;
    iconClasses: string;
    textClasses: string;
    disabled: boolean;
}

interface CategorizedActivities {
    inProgress: Chapter[];
    completed: Chapter[];
    upcoming: Chapter[];
}

// Constantes pour éviter les recalculs
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 heures
const UPDATE_INTERVAL_MS = 60000; // 1 minute
const HELP_RESET_DELAY_MS = 1500;
const HELP_CLICKS_TO_RESET = 5;

// Styles personnalisés optimisés
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap');
  
  :root {
    --transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .claude-card {
    background-color: #FFFFFF;
    border: 1px solid #E2E8F0; /* border */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    transition: all 0.3s var(--transition-smooth);
    position: relative;
    overflow: hidden;
  }
  
  .claude-card:hover:not(:disabled) {
    border-color: #CBD5E1; /* border-hover */
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.05);
    transform: translateY(-3px);
  }

  .antique-title {
    font-family: 'Crimson Text', serif;
    letter-spacing: 0.03em;
    font-weight: 600;
  }
  
  .serif-text {
    font-family: 'EB Garamond', serif;
    font-feature-settings: 'liga' 1, 'calt' 1;
  }
  
  .pulse-dot {
    animation: pulse 2s var(--transition-smooth) infinite;
  }
  
  @keyframes pulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
  }
  
  .ornament:hover {
    opacity: 1;
  }
  
  .fade-in {
    animation: fadeIn 0.6s ease-out;
  }
  
  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translateY(10px);
    }
    to { 
      opacity: 1; 
      transform: translateY(0);
    }
  }
  
  .tooltip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    padding: 6px 12px;
    background: rgba(30, 41, 59, 0.95); /* text color with opacity */
    color: white;
    font-size: 12px;
    font-weight: 500;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    backdrop-filter: blur(4px);
  }
  
  .tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-bottom-color: rgba(30, 41, 59, 0.95);
  }
  
  .group:hover .tooltip {
    opacity: 1;
  }

  @keyframes futuristicReveal {
    from {
      opacity: 0;
      filter: blur(8px);
      transform: translateY(20px) scale(1.1);
    }
    to {
      opacity: 1;
      filter: blur(0);
      transform: translateY(0) scale(1);
    }
  }

  .animate-futuristic-letter {
    display: inline-block;
    opacity: 0; /* Initial state */
    animation: futuristicReveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    will-change: transform, opacity, filter;
  }
`;

// Animation du message de bienvenue
const AnimatedWelcomeMessage: React.FC<{ greeting: string; name: string }> = ({ greeting, name }) => {
    const fullText = `${greeting}, ${name}`;
    const nameStartIndex = greeting.length + 2; // Length of "Greeting, "

    return (
        <>
            {fullText.split('').map((char, index) => {
                const isNameChar = index >= nameStartIndex;
                return (
                    <span
                        key={`${char}-${index}`}
                        className={`animate-futuristic-letter ${isNameChar ? 'text-primary' : 'text-text'}`}
                        style={{ animationDelay: `${index * 0.035}s` }}
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </span>
                );
            })}
        </>
    );
};

// Composant SessionStatus optimisé avec mémoisation
const SessionStatus: React.FC<SessionStatusProps> = React.memo(({ dates }) => {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), UPDATE_INTERVAL_MS);
        return () => clearInterval(timer);
    }, []);

    const sessionInfo = useMemo(() => {
        if (!Array.isArray(dates) || dates.length === 0) {
            return { status: 'none', text: 'Aucune séance programmée', icon: 'event_busy' };
        }
        
        const parsedDates = dates
            .map(d => new Date(d))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());

        if (parsedDates.length === 0) {
            return { status: 'none', text: 'Date invalide', icon: 'error_outline' };
        }

        // Vérifier si une session est en cours
        const liveSession = parsedDates.find(date => {
            const sessionEnd = new Date(date.getTime() + SESSION_DURATION_MS);
            return now >= date && now <= sessionEnd;
        });

        if (liveSession) {
            const sessionEnd = new Date(liveSession.getTime() + SESSION_DURATION_MS);
            const remainingMinutes = Math.max(0, Math.floor((sessionEnd.getTime() - now.getTime()) / 60000));
            return { 
                status: 'live', 
                text: `En direct · Termine dans ${remainingMinutes} min`,
                icon: 'podcasts'
            };
        }

        // Trouver la prochaine session
        const nextSession = parsedDates.find(date => date > now);
        if (nextSession) {
            const timeDiff = nextSession.getTime() - now.getTime();
            const daysUntil = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            
            let formattedDate;
            const timeFormat: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' };
            const timeString = nextSession.toLocaleTimeString('fr-FR', timeFormat).replace(':', 'h');
            
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            if (daysUntil === 0 && nextSession.getDate() === now.getDate()) {
                formattedDate = `Aujourd'hui à ${timeString}`;
            } else if (daysUntil <= 1 && nextSession.getDate() === tomorrow.getDate()) {
                 formattedDate = `Demain à ${timeString}`;
            } else {
                formattedDate = new Intl.DateTimeFormat('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    ...timeFormat
                }).format(nextSession).replace(':', 'h');
            }
            
            return { 
                status: 'upcoming', 
                text: formattedDate,
                icon: 'update'
            };
        }

        // S'il y a des dates, mais qu'elles sont toutes passées
        if(parsedDates.length > 0) {
            return { 
                status: 'past', 
                text: 'Session terminée', 
                icon: 'history'
            };
        }
        
        // Fallback
        return { status: 'none', text: 'Aucune séance programmée', icon: 'event_busy' };

    }, [dates, now]);

    const statusStyles = {
        live: 'text-info font-semibold',
        upcoming: 'text-text-secondary font-medium',
        past: 'text-text-disabled italic',
        none: 'text-text-disabled italic',
    };
    
    const currentStyle = statusStyles[sessionInfo.status] || statusStyles.none;

    return (
        <div className={`flex items-center gap-2 fade-in ${currentStyle}`}>
            {sessionInfo.status === 'live' ? (
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                </span>
            ) : (
                <span className="material-symbols-outlined !text-base">{sessionInfo.icon}</span>
            )}
            <p className="text-base serif-text">{sessionInfo.text}</p>
        </div>
    );
});


// Composant ChapterCard optimisé
const ChapterCard: React.FC<ChapterCardProps> = React.memo(({ chapter, progress, onSelect }) => {
    const getStatusInfo = useCallback((): StatusInfo => {
        if (progress?.isWorkSubmitted) {
            return {
                text: 'Terminé',
                icon: 'check_circle',
                iconClasses: 'text-success',
                textClasses: 'text-success',
                disabled: false,
            };
        }
        if (!chapter.isActive) {
            return {
                text: 'Bientôt disponible',
                icon: 'lock',
                iconClasses: 'text-text-secondary',
                textClasses: 'text-text-secondary',
                disabled: true,
            };
        }
        if (progress?.quiz?.isSubmitted || Object.keys(progress?.exercisesFeedback || {}).length > 0) {
            return {
                text: 'En cours',
                icon: 'autorenew',
                iconClasses: 'text-primary',
                textClasses: 'text-primary',
                disabled: false,
            };
        }
        return {
            text: 'À faire',
            icon: 'edit_note',
            iconClasses: 'text-text-secondary',
            textClasses: 'text-text-secondary',
            disabled: false,
        };
    }, [chapter.isActive, progress]);

    const { text, icon, iconClasses, textClasses, disabled } = getStatusInfo();

    const handleClick = useCallback(() => {
        if (!disabled) {
            onSelect(chapter.id);
        }
    }, [disabled, onSelect, chapter.id]);

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`claude-card group w-full flex flex-col sm:flex-row justify-between items-start gap-4 p-6 rounded-xl ${
                disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
            aria-label={`Accéder au ${chapter.chapter}`}
            aria-disabled={disabled}
        >
            <div className="flex-1 text-left">
                <h3 className="text-2xl antique-title text-text mb-1">
                    {chapter.chapter}
                </h3>
                <div className="mt-3">
                    <SessionStatus dates={chapter.sessionDates} />
                </div>
            </div>
            <div className="flex items-center gap-4 self-start sm:self-center mt-3 sm:mt-0">
                <div className="flex items-center gap-1.5 font-medium serif-text text-base">
                    <span className={`material-symbols-outlined !text-xl ${iconClasses}`}>{icon}</span>
                    <span className={textClasses}>{text}</span>
                </div>
                {!disabled && (
                    <span className="material-symbols-outlined text-border-hover text-2xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                )}
            </div>
        </button>
    );
});

// Hook personnalisé pour la gestion du thème
const useThemePreference = () => {
    const [theme, setTheme] = useState('light');
    
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light');
        };
        
        setTheme(mediaQuery.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handleChange);
        
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    
    return theme;
};

// Hook pour les raccourcis clavier
const useKeyboardShortcuts = (callbacks: { onHelp: () => void; onOrientation: () => void; onRefresh: () => void; }) => {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'h':
                        e.preventDefault();
                        callbacks.onHelp();
                        break;
                    case 'o':
                        e.preventDefault();
                        callbacks.onOrientation();
                        break;
                    case 'r':
                        e.preventDefault();
                        callbacks.onRefresh();
                        break;
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [callbacks]);
};

// Hook pour la détection de l'inactivité
const useIdleDetection = (timeout = 300000) => { // 5 minutes
    const [isIdle, setIsIdle] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsIdle(false);
        
        timeoutRef.current = setTimeout(() => {
            setIsIdle(true);
        }, timeout);
    }, [timeout]);
    
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });
        
        resetTimer();
        
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [resetTimer]);
    
    return isIdle;
};

// Service de cache pour les données
const CacheService = (() => {
    let instance: {
        set: (key: string, data: any) => void;
        get: (key: string) => any;
        clear: () => void;
    };

    function createInstance() {
        const cache = new Map();
        const TTL = 5 * 60 * 1000; // 5 minutes

        return {
            set(key: string, data: any) {
                cache.set(key, {
                    data,
                    timestamp: Date.now()
                });
            },
            get(key: string) {
                const cached = cache.get(key);
                if (!cached) return null;

                if (Date.now() - cached.timestamp > TTL) {
                    cache.delete(key);
                    return null;
                }

                return cached.data;
            },
            clear() {
                cache.clear();
            }
        };
    }

    return {
        getInstance: () => {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

// Composant principal DashboardView avec améliorations avancées
const DashboardView: React.FC = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const { profile, activities, progress, chapterOrder } = state;
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    const [isOrientationModalOpen, setOrientationModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(!profile);

    const { addNotification } = useNotification();
    const helpClickCountRef = useRef(0);
    const helpClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Hooks personnalisés
    useThemePreference();
    const isIdle = useIdleDetection();
    CacheService.getInstance();
    
    // Raccourcis clavier
    useKeyboardShortcuts({
        onHelp: () => setHelpModalOpen(true),
        onOrientation: () => setOrientationModalOpen(true),
        onRefresh: () => window.location.reload()
    });
    
    // Gestion de l'état idle
    useEffect(() => {
        if (isIdle) {
            addNotification('Votre session est inactive. Les données seront rafraîchies.', 'info');
        }
    }, [isIdle, addNotification]);

    // Calcul du message de bienvenue basé sur l'heure
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Bonjour';
        if (hour >= 12 && hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    }, []);

    const className = useMemo(() => {
        if (!profile) return '';
        return CLASS_OPTIONS.find(c => c.value === profile.classId)?.label || '';
    }, [profile]);

    // Gestion optimisée du clic d'aide avec réinitialisation
    const handleHelpClick = useCallback(() => {
        setHelpModalOpen(true);
        if (helpClickTimerRef.current) clearTimeout(helpClickTimerRef.current);

        helpClickCountRef.current += 1;
        const currentCount = helpClickCountRef.current;

        if (currentCount === HELP_CLICKS_TO_RESET) {
            if (state.profile) {
                const profileToKeep = {
                    profile: { name: state.profile.name, classId: '' },
                };
                localStorage.setItem(DB_KEY, JSON.stringify(profileToKeep));
                addNotification('Réinitialisation en cours...', 'success');
                setTimeout(() => window.location.reload(), 500);
            }
            helpClickCountRef.current = 0;
        } else {
            if (currentCount >= 3) {
                addNotification(
                    `${HELP_CLICKS_TO_RESET - currentCount} clic${HELP_CLICKS_TO_RESET - currentCount > 1 ? 's' : ''} pour réinitialiser`,
                    'info'
                );
            }
            helpClickTimerRef.current = setTimeout(() => {
                helpClickCountRef.current = 0;
            }, HELP_RESET_DELAY_MS);
        }
    }, [state.profile, addNotification]);

    // Nettoyage du timer au démontage
    useEffect(() => {
        return () => {
            if (helpClickTimerRef.current) clearTimeout(helpClickTimerRef.current);
        };
    }, []);

    // Simulation du chargement
    useEffect(() => {
        if (!profile) {
            const timer = setTimeout(() => setIsLoading(false), 1500);
            return () => clearTimeout(timer);
        } else {
            setIsLoading(false);
        }
    }, [profile]);

    // Catégorisation optimisée des activités
    const categorizedActivities = useMemo((): CategorizedActivities => {
        if (!profile) return { inProgress: [], completed: [], upcoming: [] };

        const allUserActivities = (Object.values(activities) as Chapter[])
            .filter(activity => activity.class === profile.classId)
            .sort((a, b) => {
                const indexA = chapterOrder.indexOf(a.id);
                const indexB = chapterOrder.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });

        return allUserActivities.reduce<CategorizedActivities>(
            (acc, chapter) => {
                const chapterProgress = progress[chapter.id];
                if (chapterProgress?.isWorkSubmitted) {
                    acc.completed.push(chapter);
                } else if (chapter.isActive) {
                    acc.inProgress.push(chapter);
                } else {
                    acc.upcoming.push(chapter);
                }
                return acc;
            },
            { inProgress: [], completed: [], upcoming: [] }
        );
    }, [activities, progress, profile, chapterOrder]);

    // Gestion de la sélection de chapitre
    const handleChapterSelect = useCallback((chapterId: string) => {
        const chapter = activities[chapterId];
        if (chapter && (chapter.isActive || progress[chapterId]?.isWorkSubmitted)) {
            dispatch({ type: 'CHANGE_VIEW', payload: { view: 'work-plan', chapterId } });
        } else {
            addNotification('Ce chapitre n\'est pas encore accessible', 'info');
        }
    }, [activities, progress, dispatch, addNotification]);

    // État de chargement
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center fade-in">
                    <div className="w-16 h-16 border-4 border-border border-t-secondary rounded-full animate-spin mb-6 mx-auto" />
                    <h2 className="text-xl antique-title text-text">Chargement de votre espace...</h2>
                    <p className="serif-text text-text-secondary italic mt-2">Préparation de vos chapitres</p>
                </div>
            </div>
        );
    }

    // Pas de profil
    if (!profile) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-8 claude-card rounded-2xl max-w-md fade-in">
                    <span className="text-5xl text-text-disabled block mb-4">⚠</span>
                    <h2 className="text-xl antique-title text-text mb-2">Profil non trouvé</h2>
                    <p className="serif-text text-text-secondary italic">Veuillez vous reconnecter pour accéder à votre espace</p>
                </div>
            </div>
        );
    }

    const { inProgress, completed, upcoming } = categorizedActivities;
    const hasAnyActivity = inProgress.length > 0 || completed.length > 0 || upcoming.length > 0;
    
    return (
        <>
            <style>{customStyles}</style>

            <div className="fixed top-6 right-6 z-40 flex items-center gap-3">
                <div className="group relative">
                    <button 
                        onClick={handleHelpClick}
                        className="w-12 h-12 rounded-full bg-surface border border-border hover:bg-background transition-all duration-300 flex items-center justify-center"
                        aria-label="Aide et support"
                    >
                        <span className="material-symbols-outlined text-text-secondary !text-2xl">help_outline</span>
                    </button>
                    <span className="tooltip">Aide</span>
                </div>
                
                <div className="group relative">
                    <button 
                        onClick={() => setOrientationModalOpen(true)}
                        className="w-12 h-12 rounded-full bg-surface border border-border hover:bg-background transition-all duration-300 flex items-center justify-center"
                        aria-label="Programme d'orientation"
                    >
                        <span className="material-symbols-outlined text-text-secondary !text-2xl">explore</span>
                    </button>
                    <span className="tooltip">Programme</span>
                </div>
            </div>

            <div className="min-h-screen bg-background">
                <div className="max-w-5xl mx-auto p-6">
                    {/* Header avec ornements */}
                    <header className="mb-12 fade-in">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className="ornament text-3xl text-primary opacity-80 hover:scale-110 transition-transform">❦</span>
                            <span className="ornament text-3xl text-primary opacity-80 hover:scale-110 transition-transform">❦</span>
                            <span className="ornament text-3xl text-primary opacity-80 hover:scale-110 transition-transform">❦</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div>
                                <h1 className="text-6xl font-playfair mb-2 h-20">
                                    <AnimatedWelcomeMessage greeting={greeting} name={profile.name} />
                                </h1>
                                <p className="serif-text text-text-secondary text-2xl italic">
                                    {className}
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Contenu principal */}
                    {hasAnyActivity ? (
                        <div className="space-y-12">
                            {/* Section En cours */}
                            {inProgress.length > 0 && (
                                <section className="fade-in" style={{ animationDelay: '0.1s' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        
                                        <h2 className="text-4xl antique-title text-text">
                                            Chapitres en cours
                                            <span className="text-lg font-normal text-text-secondary ml-3">
                                                ({inProgress.length})
                                            </span>
                                        </h2>
                                    </div>
                                    <div className="space-y-4">
                                        {inProgress.map((chapter, index) => (
                                            <div key={chapter.id} style={{ animationDelay: `${0.1 + index * 0.05}s` }} className="fade-in">
                                                <ChapterCard 
                                                    chapter={chapter} 
                                                    progress={progress[chapter.id]} 
                                                    onSelect={handleChapterSelect} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Section Achevés */}
                            {completed.length > 0 && (
                                <section className="fade-in" style={{ animationDelay: '0.2s' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="text-success/70 text-2xl">✓</span>
                                        <h2 className="text-4xl antique-title text-text">
                                            Chapitres achevés
                                            <span className="text-lg font-normal text-success ml-3">
                                                ({completed.length})
                                            </span>
                                        </h2>
                                    </div>
                                    <div className="space-y-4">
                                        {completed.map((chapter, index) => (
                                            <div key={chapter.id} style={{ animationDelay: `${0.2 + index * 0.05}s` }} className="fade-in">
                                                <ChapterCard 
                                                    chapter={chapter} 
                                                    progress={progress[chapter.id]} 
                                                    onSelect={handleChapterSelect} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Section À venir */}
                            {upcoming.length > 0 && (
                                <section className="fade-in" style={{ animationDelay: '0.3s' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        
                                        <h2 className="text-4xl antique-title text-text">
                                            Chapitres à venir
                                            <span className="text-lg font-normal text-text-secondary ml-3">
                                                ({upcoming.length})
                                            </span>
                                        </h2>
                                    </div>
                                    <div className="space-y-4">
                                        {upcoming.map((chapter, index) => (
                                            <div key={chapter.id} style={{ animationDelay: `${0.3 + index * 0.05}s` }} className="fade-in">
                                                <ChapterCard 
                                                    chapter={chapter} 
                                                    progress={progress[chapter.id]} 
                                                    onSelect={handleChapterSelect} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    ) : (
                        <div className="claude-card text-center p-12 rounded-2xl mt-8 fade-in">
                            <span className="text-5xl text-text-disabled block mb-4">◎</span>
                            <h2 className="text-xl antique-title text-text mb-2">Aucun chapitre disponible</h2>
                            <p className="serif-text text-text-secondary italic">
                                Les chapitres pour votre classe seront bientôt révélés...
                            </p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="mt-6 px-6 py-2 bg-background hover:bg-border/50 text-text rounded-lg transition-colors serif-text"
                            >
                                Rafraîchir la page
                            </button>
                        </div>
                    )}

                    {/* Ornement de fin */}
                    <footer className="text-center mt-16 mb-8 fade-in">
                        <div className="flex flex-col items-center justify-center opacity-70">
                            <span className="font-brand text-xs tracking-wider text-text-secondary">Le Centre</span>
                            <div className="w-8 h-px bg-border-hover my-1.5"></div>
                            <span className="font-brand text-2xl text-primary -mt-1">Scientifique</span>
                        </div>
                        <p className="text-xs text-text-secondary serif-text italic mt-4">
                            © {new Date().getFullYear()} - Votre parcours d'apprentissage personnalisé
                        </p>
                    </footer>
                </div>
            </div>

            {/* Modals */}
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />
            <OrientationModal 
                isOpen={isOrientationModalOpen} 
                onClose={() => setOrientationModalOpen(false)} 
                classId={profile.classId} 
            />
            
            {/* Indicateur de progression globale */}
            <GlobalProgress 
                completed={categorizedActivities.completed.length}
                inProgress={categorizedActivities.inProgress.length}
                total={Object.keys(activities).filter(id => activities[id].class === profile.classId).length}
            />
            
            {/* Notifications flottantes */}
            <NotificationToast />
        </>
    );
};

// Composant de progression globale
const GlobalProgress: React.FC<{
    completed: number;
    inProgress: number;
    total: number;
}> = React.memo(({ completed, inProgress, total }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
    }, []);
    
    if (!isVisible || total === 0) return null;
    
    return (
        <div className="fixed bottom-8 right-8 z-40 fade-in">
            <div className="claude-card p-4 rounded-2xl shadow-xl backdrop-blur-sm bg-surface/90">
                <h4 className="text-sm antique-title text-text mb-2">Progression globale</h4>
                <div className="w-48">
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                        <span className="serif-text">{percentage}% complété</span>
                        <span className="serif-text">{completed}/{total}</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-success to-green-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    {inProgress > 0 && (
                        <p className="text-xs text-info mt-2 serif-text italic">
                            {inProgress} chapitre{inProgress > 1 ? 's' : ''} en cours
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
});

// Composant de notifications toast
const NotificationToast: React.FC = () => {
    const { notifications } = useNotification();
    
    return (
        <div className="fixed top-8 right-8 z-50 space-y-2">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className={`claude-card p-4 rounded-xl shadow-lg backdrop-blur-sm animate-slideIn
                        ${notif.type === 'success' ? 'bg-emerald-50/90 border-emerald-200' : ''}
                        ${notif.type === 'warning' ? 'bg-amber-50/90 border-amber-200' : ''}
                        ${notif.type === 'error' ? 'bg-red-50/90 border-red-200' : ''}
                        ${notif.type === 'info' ? 'bg-blue-50/90 border-blue-200' : ''}
                    `}
                >
                    <p className="text-sm serif-text text-text">{notif.message}</p>
                </div>
            ))}
        </div>
    );
};

export default DashboardView;