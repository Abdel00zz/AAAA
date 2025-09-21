import React, { useState } from 'react';
import Modal from './Modal';
import { MathJax } from 'better-react-mathjax';

interface OrientationModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
}

interface Chapter {
    id: number;
    title: string;
    section: 'Géométrie' | 'Algèbre' | 'Analyse';
    contents: string[];
    capacities: string[];
}

const getChaptersForClass = (classId: string): Chapter[] => {
    switch (classId) {
        case '1bsm':
            return [
                // Géométrie
                {
                    id: 1, section: 'Géométrie', title: 'Le barycentre dans le plan',
                    contents: [
                        'Barycentre de n points ($2 \\le n \\le 4$) ; centre de gravité ;',
                        'Propriété caractéristique du barycentre; invariance; associativité ;',
                        'Coordonnées du barycentre dans un repère donné.'
                    ],
                    capacities: [
                        'Utiliser le barycentre pour simplifier une expression vectorielle ;',
                        'Utiliser le barycentre pour établir l\'alignement de trois points d\'un plan ;',
                        'Utiliser le barycentre pour établir l\'intersection de droites ;',
                        'Construire le barycentre de n points ($2 \\le n \\le 4$);',
                        'Utiliser le barycentre pour résoudre des problèmes et pour déterminer des lieux géométriques.'
                    ]
                },
                {
                    id: 2, section: 'Géométrie', title: 'Analytique du produit scalaire et applications',
                    contents: [
                        'Expression analytique du produit scalaire dans un repère orthonormé ;',
                        'Expression analytique de la norme d\'un vecteur et de la distance de deux points.',
                        'Expression de $\\cos \\theta$ et expression de $\\sin \\theta$;',
                        'Inégalité de Cauchy-Schwartz et inégalité triangulaire.',
                        'La droite dans le plan (Etude analytique)',
                        'Le cercle (Etude analytique) : Équation cartésienne, représentation paramétrique, étude de l\'ensemble $\\{M(x,y) / x^2+y^2 + ax + by +c = 0\\}$',
                        'Etude de la position relative d\'un cercle et d\'une droite ;',
                        'Equation cartésienne d\'une droite tangente à un cercle en un point donné de ce cercle.'
                    ],
                    capacities: [
                        'Exprimer le parallélisme et l\'orthogonalité de deux droites ;',
                        'Utiliser le produit scalaire pour calculer des distances, des aires et des mesures d\'angles ;',
                        'Reconnaitre l\'ensemble des points M du plan vérifiant la relation : $\\vec{MA}.\\vec{MB} = 0$',
                        'Déterminer le centre et le rayon d\'un cercle défini à l\'aide d\'une équation cartésienne ;',
                        'Passer d\'une équation cartésienne à une représentation paramétrique et inversement;',
                        'Utiliser l\'analytique du produit scalaire pour résoudre des problèmes géométriques et algébriques.'
                    ]
                },
                {
                    id: 3, section: 'Géométrie', title: 'La rotation dans le plan',
                    contents: [
                        'Définition d\'une rotation; la rotation réciproque ; décomposition comme composée de deux symétries axiales ;',
                        'Propriétés : Conservation de la distance, de la mesure des angles orientés, du barycentre, de l\'équipollence, du parallélisme et de l\'orthogonalité ;',
                        'Image par une rotation d\'une droite, d\'un segment, d\'un cercle, d\'un angle et de l\'intersection de deux figures géométriques ;',
                        'Composée de deux rotations.'
                    ],
                    capacities: [
                        'Utiliser une rotation donnée dans une situation géométrique ;',
                        'Construire les images de figures usuelles par une rotation donnée ;',
                        'Reconnaitre une rotation et l\'utiliser pour résoudre des problèmes géométriques (déterminer des lieux géométriques, constructions géométriques ...) ;',
                        'Reconnaitre des figures isométriques en utilisant une rotation.'
                    ]
                },
                {
                    id: 4, section: 'Géométrie', title: 'Géométrie dans l\'espace',
                    contents: [
                        'Calcul vectoriel dans l\'espace; Vecteurs colinéaires; définition vectorielle d\'une droite ; Définition vectorielle d\'un plan ; Vecteurs coplanaires.',
                        'Coordonnées d\'un point dans un repère, coordonnées d\'un vecteur dans une base ; coordonnées de $\\vec{u}+\\vec{v}$ et de $\\lambda\\vec{u}$ ; coordonnées de $\\vec{AB}$ ;',
                        'Déterminant de trois vecteurs ;',
                        'Représentation paramétrique d\'une droite ; positions relatives de deux droites ;',
                        'Représentation paramétrique d\'un plan ; Equation cartésienne d\'un plan; positions relatives de deux plans;',
                        'Deux équations cartésiennes d\'une droite ; Positions relatives d\'une droite et d\'un plan.'
                    ],
                    capacities: [
                        'Maitriser les règles du calcul vectoriel dans l\'espace ;',
                        'Reconnaitre et exprimer la colinéarité de deux vecteurs ; Reconnaitre et exprimer la coplanarité de trois vecteurs ;',
                        'Appliquer l\'alignement et la coplanarité pour résoudre des problèmes géométriques.',
                        'Exprimer les notions et les propriétés de la géométrie affine et de la géométrie vectorielle à l\'aide des coordonnées ;',
                        'Choisir la représentation convenable (cartésienne ou paramétrique) pour étudier les positions relatives de droites et de plans et pour interpréter les résultats.'
                    ]
                },
                 {
                    id: 5, section: 'Géométrie', title: 'Produit scalaire dans l\'espace et ses applications',
                    contents: [
                        'Définition; Propriétés: symétrie, bilinéarité; Orthogonalité de deux vecteurs ;',
                        'Repère orthonormé, base orthonormée ;',
                        'Expression analytique du produit scalaire, de la norme d\'un vecteur et de la distance de deux points.',
                        'Détermination analytique de l\'ensemble $\\{M \\in P / \\vec{u} \\cdot \\vec{AM} = k\\}$;',
                        'Vecteur normal à un plan ; Équation cartésienne d\'un plan défini par un point et un vecteur normal à ce plan;',
                        'Distance d\'un point à un plan; Étude analytique de la sphère ;',
                        'Etude de l\'ensemble des points $M(x,y,z)$ tels que : $x^2+y^2+z^2+ax+by+cz+d = 0$;',
                        'Intersection d\'une sphère et d\'un plan; plan tangent à une sphère en un point donné; intersection d\'une sphère et d\'une droite.'
                    ],
                    capacities: [
                        'Utiliser le produit scalaire pour exprimer et pour montrer l\'orthogonalité de deux vecteurs ;',
                        'Exprimer vectoriellement et analytiquement l\'orthogonalité de deux vecteurs.',
                        'Déterminer un plan défini par un point et un vecteur normal à ce plan;',
                        'Déterminer la droite passant par un point et orthogonale à un plan ;',
                        'Déterminer une équation cartésienne d\'une sphère définie par son centre et son rayon ;',
                        'Déterminer une représentation paramétrique d\'une sphère ;',
                        'Reconnaitre l\'ensemble des points M de l\'espace tels que : $\\vec{MA} \\cdot \\vec{MB} = 0$'
                    ]
                },
                {
                    id: 6, section: 'Géométrie', title: 'Produit vectoriel',
                    contents: [
                        'Orientation de l\'espace; trièdre ; repère et base orientés;',
                        'Définition géométrique du produit vectoriel et interprétation de sa norme ;',
                        'Propriétés : antisymétrie ; Bilinéarité ;',
                        'Coordonnées du produit vectoriel de deux vecteurs dans une base orthonormée directe ;',
                        'Distance d\'un point à une droite.'
                    ],
                    capacities: [
                        'Calculer l\'aire d\'un triangle en utilisant le produit vectoriel ;',
                        'Déterminer une équation d\'un plan défini par trois points non alignés ;',
                        'Appliquer le produit vectoriel dans la résolution de problèmes géométriques et physiques.'
                    ]
                },
                // Algèbre
                {
                    id: 7, section: 'Algèbre', title: 'Notions de logique',
                    contents: [
                        'Propositions ; opérations sur les propositions ; fonctions propositionnelles ;',
                        'Les quantificateurs ; les propositions quantifiées ; les lois logiques.',
                        'Les raisonnements mathématiques : raisonnement par l\'absurde; raisonnement par contraposée ; raisonnement par disjonction des cas; raisonnement par équivalence; raisonnement par récurrence.'
                    ],
                    capacities: [
                        'Transformer un énoncé mathématique en écriture symbolique en utilisant les connecteurs et les quantificateurs logiques et inversement ;',
                        'Utiliser le type de raisonnement convenable selon la situation étudiée ;',
                        'Rédiger des raisonnements et des démonstrations mathématiques claires et logiquement correctes.'
                    ]
                },
                {
                    id: 8, section: 'Algèbre', title: 'Les ensembles',
                    contents: [
                        'Définition d\'un ensemble par compréhension et par extension, partie d\'un ensemble ;',
                        'Ensemble des parties d\'un ensemble ; la notation $P(E)$;',
                        'Inclusion; égalité; complémentaire ;',
                        'Intersection, réunion et différence de deux ensembles, lois de Morgan ;',
                        'Propriétés de l\'intersection et de la réunion ;',
                        'Produit cartésien de deux ensembles.'
                    ],
                    capacities: [
                        'Déterminer un ensemble par compréhension ou par extension ;',
                        'Maitriser la relation entre les règles de la logique et les opérations sur les ensembles.'
                    ]
                },
                {
                    id: 9, section: 'Algèbre', title: 'Les applications',
                    contents: [
                        'Egalité de deux applications',
                        'Image et image réciproque d\'une partie par une application;',
                        'Application injective, application surjective; application bijective; application réciproque d\'une bijection;',
                        'Composée de deux applications ;',
                        'Restriction et prolongement d\'une application.'
                    ],
                    capacities: [
                        'Déterminer l\'image et l\'image réciproque d\'un ensemble par une application;',
                        'Déterminer la bijection et la bijection réciproque d\'une application et son utilisation dans la résolution de problèmes ;',
                        'Déterminer la composée de deux applications et la décomposition d\'une application en deux applications en vue d\'explorer ses propriétés.'
                    ]
                },
                {
                    id: 10, section: 'Algèbre', title: 'Arithmétique dans $\\mathbb{Z}$',
                    contents: [
                        'La division euclidienne et ses propriétés ;',
                        'Les nombres premiers ; la décomposition en produit de facteurs premiers ;',
                        'Le plus petit commun multiple (PPCM ; $a \\lor b$ ); le plus grand commun diviseur (PGCD ; $a \\land b$ ) ; propriétés ;',
                        'Algorithme d\'Euclide ;',
                        'Congruence modulo n ; l\'ensemble $\\mathbb{Z} / n\\mathbb{Z}$ et opérations.'
                    ],
                    capacities: [
                        'Appliquer l\'algorithme d\'Euclide pour la détermination du PGCD de deux nombres entiers ;',
                        'Reconnaitre l\'ensemble $\\mathbb{Z}/n\\mathbb{Z}$ et les règles de calcul modulo n ;',
                        'Utiliser la congruence modulo n dans l\'étude de la divisibilité et inversement.'
                    ]
                },
                {
                    id: 11, section: 'Algèbre', title: 'Dénombrement',
                    contents: [
                        'Ensemble fini; cardinal d\'un ensemble fini: la notation card;',
                        'Principe général du dénombrement, cardinal du produit cartésien;',
                        'Cardinal de l\'ensemble des applications d\'un ensemble fini vers un autre ensemble fini ;',
                        'Cardinal de l\'ensemble des parties d\'un ensemble fini;',
                        'Cardinal de la réunion et de l\'intersection de deux ensembles finis ;',
                        'Nombre d\'arrangements; la notation $A_n^p$;',
                        'Nombre de permutations ; la notation $n!$;',
                        'Nombre de combinaisons ; la notation $C_n^p$;',
                        'Propriétés des nombres $C_n^p$',
                        'Formule du binôme.'
                    ],
                    capacities: [
                        'Utiliser l\'arbre des choix dans des situations combinatoires;',
                        'Utiliser le modèle combinatoire (ou de dénombrement) adéquat à la situation étudiée;',
                        'Application du dénombrement dans la résolution de problèmes variés.'
                    ]
                },
                // Analyse
                {
                    id: 12, section: 'Analyse', title: 'Généralités sur les fonctions numériques',
                    contents: [
                        'Fonction majorée ; fonction minorée ; fonctions bornée ; fonction périodique ;',
                        'Comparaison de deux fonctions, interprétation géométrique ;',
                        'Extrémums d\'une fonction numérique ;',
                        'Monotonie d\'une fonction numérique ;',
                        'Composée de deux fonctions numériques;',
                        'Monotonie de la composée de deux fonctions numériques monotones ;',
                        'Représentation graphique des fonctions : $x \\mapsto \\sqrt{x+a}$, $x \\mapsto ax^3$ et $x \\mapsto E(x)$.'
                    ],
                    capacities: [
                        'Comparer deux expressions en utilisant différentes techniques ;',
                        'Déduire les variations ou les extrémums ou le signe d\'une fonction à partir de sa représentation graphique ou à partir de son tableau de variation ;',
                        'Déterminer les variations des fonctions $f + \\lambda$ et $\\lambda f$ à partir des variations de la fonction $f$ ;',
                        'Discuter les solutions d\'une équation de type $f(x)=c$ et $f(x) = g(x)$ à partir de la représentation graphique ;',
                        'Etude d\'équations et d\'inéquations en utilisant et en représentant les fonctions.'
                    ]
                },
                {
                    id: 13, section: 'Analyse', title: 'Généralités sur les suites numériques',
                    contents: [
                        'Suites numériques ; Suites récurrentes ;',
                        'Suites majorées, suites minorées, suites bornées ;',
                        'Monotonie d\'une suite ; Suites arithmétiques ; Suites géométriques.'
                    ],
                    capacities: [
                        'Utiliser le raisonnement par récurrence;',
                        'Etudier une suite numérique (majoration, minoration, monotonie);',
                        'Reconnaitre une suite arithmétique ou géométrique ;',
                        'Calculer la somme de n termes consécutifs d\'une suite arithmétique ou géométrique ;',
                        'Reconnaitre une situation de suite arithmétique ou géométrique ;',
                        'Utiliser une suite arithmétique ou géométrique pour résoudre des problèmes.'
                    ]
                },
                {
                    id: 14, section: 'Analyse', title: 'Trigonométrie',
                    contents: [
                        'Formules de transformation ; Transformation de l\'expression : $a \\cos x+b \\sin x$.'
                    ],
                    capacities: [
                        'Maitriser les différentes formules de transformation ;',
                        'Résoudre les équations et les inéquations trigonométriques se ramenant à la résolution d\'équations et d\'inéquations fondamentales;',
                        'Représenter et lire les solutions d\'une équation et d\'une inéquation sur le cercle trigonométrique.'
                    ]
                },
                {
                    id: 15, section: 'Analyse', title: 'Limite d’une fonction numérique',
                    contents: [
                        'Limite finie en un point; limite infinie en un point;',
                        'Limite finie en $+\\infty$ et en $-\\infty$; limite infinie en $+\\infty$ et en $-\\infty$;',
                        'Limite à gauche, limite à droite ; Opérations sur les limites ;',
                        'Limites de fonction polynôme, de fonction rationnelle et limites de fonction de la forme $\\sqrt{f}$ où f est une fonction usuelle ;',
                        'Les limites: $\\lim_{x\\to 0} \\frac{\\sin x}{x}$, $\\lim_{x\\to 0} \\frac{\\tan x}{x}$, $\\lim_{x\\to 0} \\frac{1-\\cos x}{x^2}$ et $\\lim_{x\\to 0} \\frac{\\sin(ax)}{x}$;',
                        'Limites et ordre.'
                    ],
                    capacities: [
                        'Calculer les limites des fonctions polynômes, des fonctions rationnelles et des fonctions irrationnelles ;',
                        'Calculer les limites de fonctions trigonométriques simples en utilisant les limites usuelles ;',
                        'Résoudre des inéquations de type $|f(x)-l| < \\varepsilon$ et de type $f(x) > A$ pour montrer que $f(x)$ tend vers $l$ dans des situations simples.'
                    ]
                },
                {
                    id: 16, section: 'Analyse', title: 'Dérivation',
                    contents: [
                        'Dérivabilité en un point; nombre dérivé ; interprétation géométrique ; tangente à une courbe; approximation d\'une fonction dérivable par une fonction affine en un point;',
                        'Dérivabilité à droite ; dérivabilité à gauche; interprétation géométrique et, demi- tangente; tangente ou demi- tangente verticale; point anguleux ;',
                        'Dérivabilité sur un intervalle; dérivée première; dérivée seconde ; dérivées successives ;',
                        'Dérivation de $f+g$, $\\lambda f$, $f \\times g$, $1/g$, $f/g$, $f^n (n \\in \\mathbb{Z}^*)$, $f(ax+b)$ et $\\sqrt{f}$;',
                        'Equation différentielle : $y\'\' + \\omega^2y = 0$.'
                    ],
                    capacities: [
                        'Approcher une fonction au voisinage d\'un point;',
                        'Reconnaitre que le nombre dérivée de la fonction en $x_0$ est le coefficient directeur de la tangente à cette courbe au point d\'abscisse $x_0$',
                        'Reconnaitre les dérivées des fonctions de référence ;',
                        'Maitriser les techniques de calcul de la dérivée de fonctions ;',
                        'Déterminer une équation de la tangente à une courbe en un point et construire cette tangente;',
                        'Déterminer la monotonie d\'une fonction à partir de l\'étude du signe de sa dérivée ;',
                        'Déterminer le signe d\'une fonction à partir de son tableau de variation ou de sa courbe représentative;',
                        'Résoudre des problèmes concernant des valeurs minimales et des valeurs maximales.',
                        'Appliquer la dérivation dans le calcul de certaines limites.'
                    ]
                },
                {
                    id: 17, section: 'Analyse', title: 'Représentation graphique d’une fonction numérique',
                    contents: [
                        'Branches infinies; droites asymptotes ; directions asymptotiques;',
                        'Point d\'inflexion; concavité de la courbe d\'une fonction ;',
                        'Eléments de symétrie de la courbe d\'une fonction.'
                    ],
                    capacities: [
                        'Résoudre graphiquement des équations et des inéquations ;',
                        'Utiliser la périodicité et les éléments de symétrie d\'une courbe pour réduire le domaine d\'étude d\'une fonction ;',
                        'Utiliser le signe de la dérivée seconde pour étudier la concavité d\'une courbe et déterminer ses points d\'inflexion;',
                        'Etudier et représenter des fonctions polynômes, des fonctions rationnelles et des fonctions irrationnelles.',
                        'Etudier et représenter des fonctions trigonométriques simples.'
                    ]
                }
            ];
        default:
            return [];
    }
};

const OrientationModal: React.FC<OrientationModalProps> = ({ isOpen, onClose, classId }) => {
    const [openChapterId, setOpenChapterId] = useState<number | null>(null);
    const chapters = getChaptersForClass(classId);

    const toggleChapter = (id: number) => {
        setOpenChapterId(openChapterId === id ? null : id);
    };
    
    const sections = chapters.reduce((acc, chapter) => {
        acc[chapter.section] = [...(acc[chapter.section] || []), chapter];
        return acc;
    }, {} as Record<string, Chapter[]>);

    const sectionOrder: (keyof typeof sections)[] = ['Algèbre', 'Analyse', 'Géométrie'];


    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Programme d'Orientation" 
            className="sm:max-w-7xl font-serif"
        >
            <div className="mt-4 max-h-[75vh] overflow-y-auto -mr-2 pr-2 space-y-4">
                {chapters.length > 0 ? sectionOrder.map(sectionName => sections[sectionName] && (
                    <div key={sectionName}>
                        <h3 className="text-2xl font-bold text-primary mb-3 sticky top-0 bg-surface/80 backdrop-blur-sm py-2">{sectionName}</h3>
                        <div className="space-y-2">
                        {sections[sectionName].map((chapter) => (
                            <div key={chapter.id} className="border border-border rounded-lg overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => toggleChapter(chapter.id)}
                                    className="font-button w-full flex justify-between items-center p-4 text-left hover:bg-background transition"
                                    aria-expanded={openChapterId === chapter.id}
                                >
                                    <span className="font-bold text-text pr-4 text-lg">
                                        <MathJax dynamic>{`${chapter.title}`}</MathJax>
                                    </span>
                                    <span className={`material-symbols-outlined text-secondary transition-transform duration-300 ${openChapterId === chapter.id ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>
                                <div 
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                        openChapterId === chapter.id ? 'max-h-[2000px]' : 'max-h-0'
                                    }`}
                                >
                                    <div className="px-4 pb-4 pt-2 border-t border-border bg-background/50">
                                        <div>
                                            <h4 className="font-bold text-text text-base mb-3 mt-2">Contenus</h4>
                                            <ul className="list-disc pl-5 space-y-2 text-text-secondary">
                                                {chapter.contents.map((content, index) => (
                                                    <li key={index}><MathJax dynamic>{content}</MathJax></li>
                                                ))}
                                            </ul>
                                        </div>
                                         <div className="mt-6">
                                            <h4 className="font-bold text-text text-base mt-2 mb-3">Capacités attendues</h4>
                                            <ul className="list-disc pl-5 space-y-2 text-text-secondary">
                                                {chapter.capacities.map((capacity, index) => (
                                                    <li key={index}><MathJax dynamic>{capacity}</MathJax></li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-8 text-secondary">
                        <span className="material-symbols-outlined text-4xl">upcoming</span>
                        <p className="mt-2">Le programme pour cette classe sera bientôt disponible.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default OrientationModal;