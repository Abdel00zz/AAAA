import React, { useState } from 'react';
// Fix: Import `useAppState` hook instead of the unexported `AppContext`.
import { useAppState } from '../context/AppContext';
import { CLASS_OPTIONS } from '../constants';
import HelpModal from './HelpModal';
import OrientationModal from './OrientationModal';

const AppHeader: React.FC = () => {
    // Fix: Use the `useAppState` hook to get the application state.
    const state = useAppState();
    const { profile } = state;
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    const [isOrientationModalOpen, setOrientationModalOpen] = useState(false);
    
    const getClassName = (classId: string) => {
        return CLASS_OPTIONS.find(c => c.value === classId)?.label || classId;
    };

    return (
        <>
            <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <div className="border border-border px-3 py-1.5 rounded-md text-center leading-none">
                                <div className="font-brand text-[10px] tracking-widest text-text-secondary">Le Centre</div>
                                <div className="w-6 h-px bg-border-hover my-1 mx-auto"></div>
                                <div className="font-brand text-xl text-primary -mt-1">Scientifique</div>
                            </div>
                        </div>
                        {profile && (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-sm font-semibold text-text">{profile.name}</span>
                                    <span className="text-xs text-secondary">{getClassName(profile.classId)}</span>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-base">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />
            {/* Fix: Conditionally render OrientationModal only when a profile exists and pass the required classId prop. */}
            {profile && (
                <OrientationModal
                    isOpen={isOrientationModalOpen}
                    onClose={() => setOrientationModalOpen(false)}
                    classId={profile.classId}
                />
            )}
        </>
    );
};

export default AppHeader;