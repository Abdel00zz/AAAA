import React, { useState, FormEvent, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { CLASS_OPTIONS } from '../../constants';
import { Profile } from '../../types';

const LoginView: React.FC = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const [name, setName] = useState(state.profile?.name || '');
    const [classId, setClassId] = useState(CLASS_OPTIONS[0]?.value || '');
    const [error, setError] = useState('');

    // Sync local state with global state, especially for async data loading.
    useEffect(() => {
        if (state.profile?.name) {
            setName(state.profile.name);
        }
    }, [state.profile]);

    const hasPreloadedName = !!state.profile?.name;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Only validate the name if it's not pre-loaded from a reset
        if (!hasPreloadedName && !name.trim()) {
            setError('Veuillez entrer votre nom complet.');
            return;
        }
        if (!classId) {
            setError('Veuillez sélectionner votre classe.');
            return;
        }
        setError('');
        const profile: Profile = { name: name.trim(), classId };
        dispatch({ type: 'LOGIN', payload: profile });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn p-4">
            <div className="w-full max-w-md p-10 space-y-8 bg-surface border border-border rounded-lg shadow-claude">
                <div className="text-center">
                    <div className="mx-auto w-44 h-44 flex flex-col items-center justify-center bg-surface border-2 border-border mb-4">
                        <span className="font-brand text-sm tracking-widest text-text-secondary">Le Centre</span>
                        <div className="w-10 h-px bg-border-hover my-2"></div>
                        <span className="font-brand text-3xl text-primary -mt-1">Scientifique</span>
                    </div>

                    

                     {hasPreloadedName && (
                        <div className="mt-6">
                            <h2 className="text-2xl font-brand text-primary">
                                Bon retour, {name} !
                            </h2>
                            <p className="mt-2 text-secondary font-serif text-sm">
                                Sélectionnez votre nouvelle classe pour continuer
                            </p>
                        </div>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text font-lato mb-2">
                            Nom complet
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${hasPreloadedName ? 'bg-border/30 text-text-secondary cursor-not-allowed' : ''}`}
                            placeholder="Entrez votre nom"
                            required
                            readOnly={hasPreloadedName}
                        />
                    </div>
                    <div>
                        <label htmlFor="classId" className="block text-sm font-medium text-text font-lato mb-2">
                            Sélectionnez votre classe
                        </label>
                        <select
                            id="classId"
                            value={classId}
                            onChange={(e) => setClassId(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                            required
                        >
                            {CLASS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    {error && (
                        <div className="p-3 bg-error/10 border border-error/20 rounded-md">
                            <p className="text-sm text-error text-center">{error}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full px-4 py-3 font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] font-button shadow-sm"
                    >
                        {hasPreloadedName ? 'Mettre à jour' : 'Commencer maintenant'}
                    </button>
                </form>

                {!hasPreloadedName && (
                    <div className="p-4 bg-background rounded-lg border border-border">
                        <p className="text-center text-sm text-secondary font-lato">
                            Accédez à des ressources pédagogiques d'excellence, disponibles à tout moment pour accompagner votre réussite.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginView;