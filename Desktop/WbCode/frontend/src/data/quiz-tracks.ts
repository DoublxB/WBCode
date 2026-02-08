export type TrackQuizDifficulty =
  | 'EASY'
  | 'EASY_MEDIUM'
  | 'MEDIUM'
  | 'HARD'
  | 'VERY_HARD'
  | 'EXPERT'
  | 'LEGENDARY'
  | 'MASTERY';

export type QuizTrack = {
  slug: string;
  titleRo: string;
  subtitleRo: string;
  levelRo: string;
  quizCount: number;
  quizzes: Array<{
    slug: string;
    titleRo: string;
    descriptionRo: string;
    difficulty: TrackQuizDifficulty;
  }>;
};

export const quizTracks: QuizTrack[] = [
  {
    slug: 'programming-basics',
    titleRo: 'Bazele Programării',
    subtitleRo: 'De la zero la erou. Fundamentele absolute.',
    levelRo: 'Începător',
    quizCount: 8,
    quizzes: [
      {
        slug: 'hello-world-variabile',
        titleRo: 'Hello World & Variabile',
        descriptionRo: 'Primele tale linii de cod și tipuri de date.',
        difficulty: 'EASY'
      },
      {
        slug: 'operatori-matematici',
        titleRo: 'Operatori Matematici',
        descriptionRo: 'Cum facem calcule simple în Python.',
        difficulty: 'EASY'
      },
      {
        slug: 'decizii-logice-if-else',
        titleRo: 'Decizii Logice (If/Else)',
        descriptionRo: 'Învață computerul să ia decizii.',
        difficulty: 'EASY_MEDIUM'
      },
      {
        slug: 'buclele-while',
        titleRo: 'Buclele Repetitive (While)',
        descriptionRo: 'Cum repetăm o acțiune eficient.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'buclele-for',
        titleRo: 'Buclele For',
        descriptionRo: 'Iterarea prin secvențe simple.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'functii-partea-1',
        titleRo: 'Funcții – Partea 1',
        descriptionRo: 'Definirea și apelarea funcțiilor.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'functii-partea-2',
        titleRo: 'Funcții – Partea 2',
        descriptionRo: 'Parametri și valori returnate.',
        difficulty: 'HARD'
      },
      {
        slug: 'testul-final-de-baza',
        titleRo: 'Testul Final de Bază',
        descriptionRo: 'O combinație a tuturor conceptelor de mai sus.',
        difficulty: 'MASTERY'
      }
    ]
  },
  {
    slug: 'arrays-and-lists',
    titleRo: 'Liste și Șiruri',
    subtitleRo: 'Organizarea datelor.',
    levelRo: 'Începător → Intermediar',
    quizCount: 8,
    quizzes: [
      {
        slug: 'crearea-listelor',
        titleRo: 'Crearea Listelor',
        descriptionRo: 'Indexare și accesarea elementelor.',
        difficulty: 'EASY'
      },
      {
        slug: 'metode-de-baza',
        titleRo: 'Metode de Bază',
        descriptionRo: 'Append, Pop și Insert.',
        difficulty: 'EASY'
      },
      {
        slug: 'slicing-felierea',
        titleRo: 'Slicing (Felierea)',
        descriptionRo: 'Cum extragem sub‑liste eficient.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'list-comprehension',
        titleRo: 'List Comprehension',
        descriptionRo: 'Magia Python pentru liste pe o singură linie.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'matrice-liste-in-liste',
        titleRo: 'Matrice (Liste în Liste)',
        descriptionRo: 'Lucrul cu date 2D.',
        difficulty: 'HARD'
      },
      {
        slug: 'manipularea-stringurilor',
        titleRo: 'Manipularea String‑urilor',
        descriptionRo: 'Metode specifice pentru text.',
        difficulty: 'HARD'
      },
      {
        slug: 'tuples-vs-lists',
        titleRo: 'Tuples vs Lists',
        descriptionRo: 'Când folosim date imutabile.',
        difficulty: 'HARD'
      },
      {
        slug: 'arhitectul-de-date',
        titleRo: 'Arhitectul de Date',
        descriptionRo: 'Probleme complexe de organizare a datelor.',
        difficulty: 'MASTERY'
      }
    ]
  },
  {
    slug: 'recursion-mastery',
    titleRo: 'Măiestria Recursivității',
    subtitleRo: 'Funcții care se auto‑apelează.',
    levelRo: 'Intermediar',
    quizCount: 8,
    quizzes: [
      {
        slug: 'ce-este-recursivitatea',
        titleRo: 'Ce este Recursivitatea?',
        descriptionRo: 'Conceptul de bază și cazul de oprire.',
        difficulty: 'EASY'
      },
      {
        slug: 'stiva-de-apeluri',
        titleRo: 'Stiva de Apeluri (Call Stack)',
        descriptionRo: 'Cum ține minte calculatorul unde a rămas.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'factorial-fibonacci',
        titleRo: 'Factorial & Fibonacci',
        descriptionRo: 'Exemplele clasice explicate.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'recursivitate-vs-iteratie',
        titleRo: 'Recursivitate vs Iterație',
        descriptionRo: 'Transcrierea buclelor în funcții recursive.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'cautarea-binara-recursiva',
        titleRo: 'Căutarea Binară Recursivă',
        descriptionRo: 'Algoritmi eficienți.',
        difficulty: 'HARD'
      },
      {
        slug: 'turnurile-din-hanoi',
        titleRo: 'Problema Turnurilor din Hanoi',
        descriptionRo: 'Logică avansată.',
        difficulty: 'HARD'
      },
      {
        slug: 'backtracking-simplu',
        titleRo: 'Backtracking Simplu',
        descriptionRo: 'Generarea permutărilor.',
        difficulty: 'VERY_HARD'
      },
      {
        slug: 'marele-recurs',
        titleRo: 'Marele Recurs',
        descriptionRo: 'Rezolvă un labirint folosind recursivitatea.',
        difficulty: 'MASTERY'
      }
    ]
  },
  {
    slug: 'object-oriented-programming',
    titleRo: 'Programare Orientată pe Obiecte',
    subtitleRo: 'Modelarea lumii reale în cod.',
    levelRo: 'Intermediar',
    quizCount: 8,
    quizzes: [
      {
        slug: 'clase-si-obiecte',
        titleRo: 'Clase și Obiecte',
        descriptionRo: 'Diferența dintre plan (clasă) și casă (obiect).',
        difficulty: 'EASY'
      },
      {
        slug: 'atribute-si-metode',
        titleRo: 'Atribute și Metode',
        descriptionRo: 'Comportamentul obiectelor („self”).',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'constructorul-init',
        titleRo: 'Constructorul (__init__)',
        descriptionRo: 'Cum iau naștere obiectele.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'incapsularea',
        titleRo: 'Încapsularea',
        descriptionRo: 'Protejarea datelor private.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'mostenirea',
        titleRo: 'Moștenirea (Inheritance)',
        descriptionRo: 'Cum refolosim codul părinților.',
        difficulty: 'HARD'
      },
      {
        slug: 'polimorfismul',
        titleRo: 'Polimorfismul',
        descriptionRo: 'Aceeași funcție, comportament diferit.',
        difficulty: 'HARD'
      },
      {
        slug: 'metode-magice',
        titleRo: 'Metode Magice (Dunder Methods)',
        descriptionRo: 'Puterea ascunsă a claselor.',
        difficulty: 'HARD'
      },
      {
        slug: 'arhitect-software',
        titleRo: 'Arhitect Software',
        descriptionRo: 'Proiectează un sistem complet (ex: un mic joc RPG).',
        difficulty: 'MASTERY'
      }
    ]
  },
  {
    slug: 'database-and-sql',
    titleRo: 'Baze de Date & SQL',
    subtitleRo: 'Persistența datelor.',
    levelRo: 'Intermediar → Avansat',
    quizCount: 8,
    quizzes: [
      {
        slug: 'ce-este-o-baza-de-date',
        titleRo: 'Ce este o Bază de Date?',
        descriptionRo: 'Tabele, rânduri și coloane.',
        difficulty: 'EASY'
      },
      {
        slug: 'select-where',
        titleRo: 'SELECT & WHERE',
        descriptionRo: 'Cum găsim exact ce căutăm.',
        difficulty: 'EASY'
      },
      {
        slug: 'crud',
        titleRo: 'INSERT, UPDATE, DELETE',
        descriptionRo: 'Modificarea datelor (CRUD).',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'functii-de-agregare',
        titleRo: 'Funcții de Agregare',
        descriptionRo: 'SUM, AVG, COUNT.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'group-by-having',
        titleRo: 'Gruparea Datelor',
        descriptionRo: 'GROUP BY și HAVING.',
        difficulty: 'HARD'
      },
      {
        slug: 'join',
        titleRo: 'Relații între Tabele (JOIN)',
        descriptionRo: 'Inner, Left și Right Joins.',
        difficulty: 'HARD'
      },
      {
        slug: 'normalizarea',
        titleRo: 'Normalizarea',
        descriptionRo: 'Cum organizăm datele eficient.',
        difficulty: 'HARD'
      },
      {
        slug: 'sql-master',
        titleRo: 'SQL Master',
        descriptionRo: 'Interogări complexe imbricate.',
        difficulty: 'MASTERY'
      }
    ]
  },
  {
    slug: 'dynamic-programming',
    titleRo: 'Avansați – Programare Dinamică',
    subtitleRo: 'Optimizarea algoritmilor complecși.',
    levelRo: 'Greu',
    quizCount: 8,
    quizzes: [
      {
        slug: 'memoization',
        titleRo: 'Memoization',
        descriptionRo: 'Cum să nu calculezi același lucru de două ori.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'top-down',
        titleRo: 'Abordarea Top‑Down',
        descriptionRo: 'Descompunerea problemelor.',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'bottom-up',
        titleRo: 'Abordarea Bottom‑Up',
        descriptionRo: 'Construirea soluției de la bază.',
        difficulty: 'HARD'
      },
      {
        slug: 'knapsack',
        titleRo: 'Problema Rucsacului (Knapsack)',
        descriptionRo: 'Maximizarea valorii.',
        difficulty: 'HARD'
      },
      {
        slug: 'lcs',
        titleRo: 'Cel mai lung subșir comun',
        descriptionRo: 'Algoritmi pe text.',
        difficulty: 'VERY_HARD'
      },
      {
        slug: 'grid-paths',
        titleRo: 'Numărul de căi într‑o matrice',
        descriptionRo: 'Grid traversal.',
        difficulty: 'VERY_HARD'
      },
      {
        slug: 'optimizarea-spatiului',
        titleRo: 'Optimizarea Spațiului',
        descriptionRo: 'Reducerea memoriei folosite.',
        difficulty: 'EXPERT'
      },
      {
        slug: 'algoritmul-suprem',
        titleRo: 'Algoritmul Suprem',
        descriptionRo: 'O problemă de concurs (stil LeetCode Hard).',
        difficulty: 'LEGENDARY'
      }
    ]
  }
];

export function getTrackBySlug(slug: string) {
  return quizTracks.find((t) => t.slug === slug) ?? null;
}

export function getDifficultyMeta(difficulty: TrackQuizDifficulty): {
  labelRo: string;
  tone: 'easy' | 'medium' | 'hard';
  bars: 1 | 2 | 3;
} {
  switch (difficulty) {
    case 'EASY':
      return { labelRo: 'Ușor', tone: 'easy', bars: 1 };
    case 'EASY_MEDIUM':
      return { labelRo: 'Ușor → Mediu', tone: 'medium', bars: 2 };
    case 'MEDIUM':
      return { labelRo: 'Mediu', tone: 'medium', bars: 2 };
    case 'HARD':
      return { labelRo: 'Greu', tone: 'hard', bars: 3 };
    case 'VERY_HARD':
      return { labelRo: 'Foarte greu', tone: 'hard', bars: 3 };
    case 'EXPERT':
      return { labelRo: 'Expert', tone: 'hard', bars: 3 };
    case 'LEGENDARY':
      return { labelRo: 'Legendar', tone: 'hard', bars: 3 };
    case 'MASTERY':
      return { labelRo: 'Mastery', tone: 'hard', bars: 3 };
    default:
      return { labelRo: '—', tone: 'medium', bars: 2 };
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Recommended time limit for a quiz, computed from difficulty + number of questions.
 *
 * Rationale (high-level):
 * - Multiple-choice / short conceptual items: ~45–75s per item
 * - Harder items take longer due to reading + reasoning
 *
 * We keep it conservative and clamp to avoid extremes.
 */
export function recommendedQuizTimeLimitSeconds(questionCount: number, difficulty: TrackQuizDifficulty) {
  const q = clamp(Math.floor(questionCount || 0), 1, 50);
  const secondsPerQuestion =
    difficulty === 'EASY'
      ? 45
      : difficulty === 'EASY_MEDIUM'
      ? 55
      : difficulty === 'MEDIUM'
      ? 60
      : difficulty === 'HARD'
      ? 75
      : difficulty === 'VERY_HARD'
      ? 90
      : difficulty === 'EXPERT'
      ? 105
      : difficulty === 'LEGENDARY'
      ? 120
      : 90; // MASTERY

  const raw = q * secondsPerQuestion;
  // Clamp: min 2 min, max 30 min (keeps UX predictable)
  return clamp(raw, 120, 1800);
}


