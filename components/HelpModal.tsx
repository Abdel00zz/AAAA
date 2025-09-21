import React, { useState } from 'react';
import Modal from './Modal';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FrenchContent: React.FC = () => (
    <div className="space-y-5 text-text-secondary leading-relaxed">
        <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-text">Bienvenue au Centre Scientifique !</h3>
            <p>Votre centre scolaire interactif, ouvert 24h/24 et 7j/7 pour un apprentissage sans limites.</p>
        </div>
        
        <div>
            <h4 className="font-bold text-text mb-2">Quiz Interactifs</h4>
            <p>Testez vos connaissances avec des quiz courts pour ancrer les bases. Lisez bien, répondez, puis analysez la correction pour progresser.</p>
        </div>
        
        <div>
            <h4 className="font-bold text-text mb-2">Exercices & Auto-évaluation</h4>
            <p>Après chaque exercice, évaluez votre ressenti. Cela m'aide à identifier vos points forts et les notions à renforcer.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="text-success">J'ai réussi facilement :</strong> Vous maîtrisez, bravo !</li>
                <li><strong className="text-warning">J'ai eu besoin de réfléchir :</strong> C'est bien, la pratique ancre les connaissances.</li>
                <li><strong className="text-error">C'était un vrai défi :</strong> Parfait pour en discuter en cours. Pensez à utiliser le bouton "Indice".</li>
                <li><strong>Je reviendrai plus tard :</strong> C'est noté, n'oubliez pas d'y revenir.</li>
            </ul>
        </div>

        <div>
            <h4 className="font-bold text-text mb-2">Finaliser et Envoyer</h4>
            <p>Une fois le quiz et tous les exercices évalués, vous pouvez m'envoyer votre travail. Je reçois alors un résumé de votre progression et peux vous proposer un accompagnement personnalisé.</p>
        </div>
        
        <div>
            <h4 className="font-bold text-text mb-2">Pour les Parents</h4>
            <p>La plateforme offre une solution durable aux parents. À la fin de chaque mois, ils recevront un rapport global sur la progression de leur enfant, leur permettant de suivre son évolution de manière claire et concrète.</p>
        </div>

        <div>
            <h4 className="font-bold text-text mb-2">Notre Approche Révolutionnaire</h4>
            <p>Notre plateforme est ultra-pédagogique et a été conçue pour être l'opposé d'un apprentissage passif comme le visionnage de vidéos. Elle oblige l'élève à s'engager activement :</p>
             <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Réfléchir et réagir à chaque étape.</li>
                <li>Organiser son temps pour accomplir son travail.</li>
                <li>Vivre une expérience interactive complète, soutenue par des méthodes de récompense et de motivation intelligentes.</li>
            </ul>
        </div>

        <div>
            <h4 className="font-bold text-text mb-2">Cours en Direct</h4>
            <p>Pendant nos séances, nous corrigeons les exercices, répondons à vos questions et structurons les méthodes de résolution. Chaque difficulté est une opportunité d'apprendre.</p>
            <div className="mt-3">
                <p className="font-bold text-text mb-2">Pour me contacter :</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <a href="https://web.facebook.com/Maths.new.horizons" target="_blank" rel="noopener noreferrer" className="font-button flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1877F2] rounded-lg hover:bg-opacity-90 transition transform hover:-translate-y-px">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
                        <span>Facebook</span>
                    </a>
                    <a href="https://wa.me/212674680119" target="_blank" rel="noopener noreferrer" className="font-button flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#25D366] rounded-lg hover:bg-opacity-90 transition transform hover:-translate-y-px">
                        <span className="material-symbols-outlined text-xl">chat</span>
                        <span>WhatsApp</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
);

const ArabicContent: React.FC = () => (
    <div className="space-y-5 text-text-secondary leading-relaxed text-right" dir="rtl">
        <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-text">! مرحباً بكم في المركز العلمي</h3>
            <p>مركزكم الدراسي التفاعلي، مفتوح 24 ساعة طوال أيام الأسبوع لتعلم بلا حدود.</p>
        </div>

        <div>
            <h4 className="font-bold text-text mb-2">اختبارات قصيرة تفاعلية</h4>
            <p>اختبروا معارفكم باختبارات قصيرة لتثبيت الأساسيات. اقرأوا بتمعن، أجيبوا، ثم حللوا التصحيح للتقدم.</p>
        </div>

        <div>
            <h4 className="font-bold text-text mb-2">التمارين والتقييم الذاتي</h4>
            <p>بعد كل تمرين، قيّموا شعوركم. هذا يساعدني على تحديد نقاط قوتكم والمفاهيم التي تحتاج إلى تعزيز.</p>
            <ul className="list-disc pr-5 mt-2 space-y-1">
                <li><strong className="text-success">لقد نجحت بسهولة:</strong> أنتم تتقنون، أحسنتم!</li>
                <li><strong className="text-warning">لقد احتجت إلى التفكير:</strong> جيد، الممارسة تثبت المعرفة.</li>
                <li><strong className="text-error">لقد كان تحديًا حقيقيًا:</strong> ممتاز لمناقشته في الحصة. فكروا في استخدام زر "تلميح".</li>
                <li><strong>سأعود لاحقًا:</strong> تم تسجيل ذلك، لا تنسوا العودة إليه.</li>
            </ul>
        </div>

        <div>
            <h4 className="font-bold text-text mb-2">إنهاء وإرسال</h4>
            <p>بمجرد إنهاء الاختبار وتقييم جميع التمارين، يمكنكم إرسال عملكم لي. أتلقى حينها ملخصًا لتقدمكم ويمكنني أن أقدم لكم مرافقة شخصية.</p>
        </div>
        
        <div>
            <h4 className="font-bold text-text mb-2">للآباء</h4>
            <p>تقدم المنصة حلاً دائماً للآباء. في نهاية كل شهر، سيتلقون تقريراً شاملاً عن تقدم طفلهم، مما يتيح لهم متابعة تطوره بوضوح وفعالية.</p>
        </div>

        <div>
            <h4 className="font-bold text-text mb-2">نهجنا الثوري</h4>
            <p>منصتنا تعليمية للغاية ومصممة لتكون نقيض التعلم السلبي مثل مشاهدة مقاطع الفيديو. إنها تجبر الطالب على المشاركة بفعالية:</p>
            <ul className="list-disc pr-5 mt-2 space-y-1">
                <li>التفكير والتفاعل في كل مرحلة.</li>
                <li>تنظيم وقته لإنجاز عمله.</li>
                <li>عيش تجربة تفاعلية كاملة، مدعومة بأساليب مكافأة وتحفيز ذكية.</li>
            </ul>
        </div>

        <div>
            <h4 className="font-bold text-text mb-2">الحصص المباشرة</h4>
            <p>خلال حصصنا، نصحح التمارين، نجيب على أسئلتكم، وننظم طرق الحل. كل صعوبة هي فرصة للتعلم.</p>
            <div className="mt-3">
                <p className="font-bold text-text mb-2">للتواصل معي :</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <a href="https://web.facebook.com/Maths.new.horizons" target="_blank" rel="noopener noreferrer" className="font-button flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1877F2] rounded-lg hover:bg-opacity-90 transition transform hover:-translate-y-px">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
                        <span>فيسبوك</span>
                    </a>
                    <a href="https://wa.me/212674680119" target="_blank" rel="noopener noreferrer" className="font-button flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#25D366] rounded-lg hover:bg-opacity-90 transition transform hover:-translate-y-px">
                        <span className="material-symbols-outlined text-xl">chat</span>
                        <span>واتساب</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
);

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'fr' | 'ar'>('fr');

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Guide d'utilisation"
            className="sm:max-w-2xl"
        >
            <div className="mt-4">
                <div className="border-b border-border mb-4">
                    <nav className="-mb-px flex gap-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('fr')}
                            className={`font-button shrink-0 border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                                activeTab === 'fr' 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-text-secondary hover:border-border-hover hover:text-text'
                            }`}
                        >
                            Français
                        </button>
                        <button
                             onClick={() => setActiveTab('ar')}
                             className={`font-button shrink-0 border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                                activeTab === 'ar' 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-text-secondary hover:border-border-hover hover:text-text'
                            }`}
                        >
                            العربية
                        </button>
                    </nav>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {activeTab === 'fr' ? <FrenchContent /> : <ArabicContent />}
                </div>
            </div>
        </Modal>
    );
};

export default HelpModal;