import { PrismaClient, RoleType } from '@prisma/client';
import { Role } from '../src/common/constants/roles';

const prisma = new PrismaClient();
const HASHED_PASSWORD = '$2b$10$WEDcPu9EDOrPiXGeA4MaROP6QE00lAjFX9YTMZyv5TjFPzN8CUZCO';

async function main() {
  const roles = await Promise.all(
    Object.values(Role).map((name) =>
      prisma.role.upsert({
        where: { name: name as RoleType },
        update: {},
        create: { name: name as RoleType }
      })
    )
  );

  const [studentRole, professorRole, adminRole] = roles;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@wbcode.com' },
    update: {},
    create: {
      email: 'admin@wbcode.com',
      password: HASHED_PASSWORD,
      firstName: 'System',
      lastName: 'Admin',
      roleId: adminRole.id,
      xp: 1000,
      level: 5
    }
  });

  const professor = await prisma.user.upsert({
    where: { email: 'professor@wbcode.com' },
    update: {},
    create: {
      email: 'professor@wbcode.com',
      password: HASHED_PASSWORD,
      firstName: 'Prof',
      lastName: 'Coder',
      roleId: professorRole.id,
      xp: 800,
      level: 4
    }
  });

  const students = await Promise.all(
    ['alex', 'bianca', 'cristian'].map((name, idx) =>
      prisma.user.upsert({
        where: { email: `${name}@wbcode.com` },
        update: {},
        create: {
          email: `${name}@wbcode.com`,
          password: HASHED_PASSWORD,
          firstName: name.charAt(0).toUpperCase() + name.slice(1),
          lastName: 'Learner',
          roleId: studentRole.id,
          xp: 100 * (idx + 1),
          level: 1 + idx
        }
      })
    )
  );

  // Create multiple lessons for different difficulty levels (în română)
  const lessons = await Promise.all([
    prisma.lesson.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'Introducere în Programare',
        description: 'Învață elementele de bază ale programării.',
        content: '# Introducere în Programare\n\nÎnvață despre variabile, tipuri de date și operații de bază!',
        difficulty: 'Beginner',
        tags: ['baze', 'programare'],
        authorId: professor.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: 'Bazele Recursiei',
        description: 'Înțelege recursia prin factorial și fibonacci.',
        content: '# Recursie\n\nÎnvață prin practică!',
        difficulty: 'Intermediate',
        tags: ['recursie', 'algoritmi'],
        authorId: professor.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 3 },
      update: {},
      create: {
        title: 'Structuri de Date: Liste și Array-uri',
        description: 'Stăpânește liste, array-uri și operațiile lor.',
        content: '# Structuri de Date\n\nFundamentele listelor și array-urilor.',
        difficulty: 'Beginner',
        tags: ['structuri-date', 'liste'],
        authorId: professor.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 4 },
      update: {},
      create: {
        title: 'Programare Orientată pe Obiecte',
        description: 'Clase, obiecte, moștenire și polimorfism.',
        content: '# POO\n\nConcepte de programare orientată pe obiecte.',
        difficulty: 'Intermediate',
        tags: ['poo', 'clase', 'moștenire'],
        authorId: professor.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 5 },
      update: {},
      create: {
        title: 'Algoritmi Avansați: Programare Dinamică',
        description: 'Stăpânește tehnici DP pentru probleme complexe.',
        content: '# Programare Dinamică\n\nTehnici algoritmice avansate.',
        difficulty: 'Advanced',
        tags: ['algoritmi', 'programare-dinamica'],
        authorId: professor.id
      }
    }),
    prisma.lesson.upsert({
      where: { id: 6 },
      update: {},
      create: {
        title: 'Fundamentele Bazelor de Date',
        description: 'SQL, interogări și design de baze de date.',
        content: '# Baze de Date\n\nSQL și managementul bazelor de date.',
        difficulty: 'Intermediate',
        tags: ['baze-date', 'sql'],
        authorId: professor.id
      }
    })
  ]);

  // Create multiple quizzes for different levels
  const quizzes = await Promise.all([
    // Beginner Quiz 1: Introduction to Programming
    prisma.quiz.upsert({
      where: { id: 1 },
      update: {},
      create: {
        lessonId: lessons[0].id,
        title: 'Programming Basics Quiz',
        description: 'Test your understanding of fundamental programming concepts',
        timeLimit: 300, // 5 minutes
        questions: {
          create: [
            {
              prompt: 'What is a variable?',
              type: 'SINGLE',
              options: ['A storage location with a name', 'A function', 'A loop', 'A data type'],
              answerKey: 'A storage location with a name',
              explanation: 'A variable is a named storage location that holds a value.'
            },
            {
              prompt: 'Which data type is used for whole numbers?',
              type: 'SINGLE',
              options: ['String', 'Integer', 'Boolean', 'Float'],
              answerKey: 'Integer',
              explanation: 'Integers represent whole numbers without decimal points.'
            },
            {
              prompt: 'What does "=" mean in programming?',
              type: 'SINGLE',
              options: ['Equality check', 'Assignment', 'Comparison', 'Addition'],
              answerKey: 'Assignment',
              explanation: 'The "=" operator assigns a value to a variable.'
            },
            {
              prompt: 'What is the result of: 5 + 3 * 2?',
              type: 'SINGLE',
              options: ['16', '11', '13', '10'],
              answerKey: '11',
              explanation: 'Order of operations: multiplication first (3*2=6), then addition (5+6=11).'
            }
          ]
        }
      }
    }),
    // Beginner Quiz 2: Data Structures
    prisma.quiz.upsert({
      where: { id: 2 },
      update: {},
      create: {
        lessonId: lessons[2].id,
        title: 'Arrays & Lists Fundamentals',
        description: 'Master the basics of arrays and lists',
        timeLimit: 360, // 6 minutes
        questions: {
          create: [
            {
              prompt: 'What is the index of the first element in an array?',
              type: 'SINGLE',
              options: ['0', '1', '-1', 'It depends'],
              answerKey: '0',
              explanation: 'In most programming languages, arrays are zero-indexed.'
            },
            {
              prompt: 'What is the time complexity of accessing an element by index in an array?',
              type: 'SINGLE',
              options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'],
              answerKey: 'O(1)',
              explanation: 'Array access by index is constant time O(1).'
            },
            {
              prompt: 'What is a linked list?',
              type: 'SINGLE',
              options: ['A collection of nodes connected by pointers', 'An array', 'A function', 'A loop'],
              answerKey: 'A collection of nodes connected by pointers',
              explanation: 'A linked list is a linear data structure where elements are linked via pointers.'
            }
          ]
        }
      }
    }),
    // Intermediate Quiz 1: Recursion
    prisma.quiz.upsert({
      where: { id: 3 },
      update: {},
      create: {
        lessonId: lessons[1].id,
        title: 'Recursion Mastery',
        description: 'Test your recursion knowledge',
        timeLimit: 600, // 10 minutes
        questions: {
          create: [
            {
              prompt: 'What is the base case of factorial?',
              type: 'SINGLE',
              options: ['n == 0', 'n == 1', 'n == 2', 'n < 0'],
              answerKey: 'n == 0',
              explanation: 'factorial(0) = 1 ensures recursion stops.'
            },
            {
              prompt: 'Recursion requires?',
              type: 'SINGLE',
              options: ['Loop', 'Base case + recursive step', 'Only base case', 'Only recursive step'],
              answerKey: 'Base case + recursive step',
              explanation: 'Both are mandatory for proper recursion.'
            },
            {
              prompt: 'What is the time complexity of recursive Fibonacci without memoization?',
              type: 'SINGLE',
              options: ['O(n)', 'O(2^n)', 'O(log n)', 'O(n²)'],
              answerKey: 'O(2^n)',
              explanation: 'Without memoization, recursive Fibonacci has exponential time complexity.'
            },
            {
              prompt: 'What is tail recursion?',
              type: 'SINGLE',
              options: ['Recursion where the recursive call is the last operation', 'A loop', 'A base case', 'An infinite recursion'],
              answerKey: 'Recursion where the recursive call is the last operation',
              explanation: 'Tail recursion allows compiler optimization and prevents stack overflow.'
            }
          ]
        }
      }
    }),
    // Intermediate Quiz 2: OOP
    prisma.quiz.upsert({
      where: { id: 4 },
      update: {},
      create: {
        lessonId: lessons[3].id,
        title: 'Object-Oriented Programming Challenge',
        description: 'Test your OOP knowledge',
        timeLimit: 600, // 10 minutes
        questions: {
          create: [
            {
              prompt: 'What are the four pillars of OOP?',
              type: 'SINGLE',
              options: ['Encapsulation, Inheritance, Polymorphism, Abstraction', 'Variables, Functions, Loops, Conditions', 'Arrays, Lists, Trees, Graphs', 'Classes, Objects, Methods, Properties'],
              answerKey: 'Encapsulation, Inheritance, Polymorphism, Abstraction',
              explanation: 'These four concepts form the foundation of OOP.'
            },
            {
              prompt: 'What is inheritance?',
              type: 'SINGLE',
              options: ['A class deriving properties from another class', 'A function', 'A variable', 'A loop'],
              answerKey: 'A class deriving properties from another class',
              explanation: 'Inheritance allows a class to inherit attributes and methods from a parent class.'
            },
            {
              prompt: 'What is polymorphism?',
              type: 'SINGLE',
              options: ['The ability to use one interface for different types', 'A data structure', 'A sorting algorithm', 'A design pattern'],
              answerKey: 'The ability to use one interface for different types',
              explanation: 'Polymorphism allows objects of different types to be treated through the same interface.'
            }
          ]
        }
      }
    }),
    // Intermediate Quiz 3: Databases
    prisma.quiz.upsert({
      where: { id: 5 },
      update: {},
      create: {
        lessonId: lessons[5].id,
        title: 'Database & SQL Quiz',
        description: 'Master SQL queries and database concepts',
        timeLimit: 600, // 10 minutes
        questions: {
          create: [
            {
              prompt: 'What does SQL stand for?',
              type: 'SINGLE',
              options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'],
              answerKey: 'Structured Query Language',
              explanation: 'SQL is the standard language for managing relational databases.'
            },
            {
              prompt: 'Which SQL command is used to retrieve data?',
              type: 'SINGLE',
              options: ['SELECT', 'GET', 'FETCH', 'RETRIEVE'],
              answerKey: 'SELECT',
              explanation: 'SELECT is used to query and retrieve data from a database.'
            },
            {
              prompt: 'What is a primary key?',
              type: 'SINGLE',
              options: ['A unique identifier for each row', 'A foreign key', 'An index', 'A constraint'],
              answerKey: 'A unique identifier for each row',
              explanation: 'A primary key uniquely identifies each record in a table.'
            },
            {
              prompt: 'What is the purpose of JOIN in SQL?',
              type: 'SINGLE',
              options: ['Combine rows from multiple tables', 'Filter data', 'Sort data', 'Group data'],
              answerKey: 'Combine rows from multiple tables',
              explanation: 'JOIN combines rows from two or more tables based on related columns.'
            }
          ]
        }
      }
    }),
    // Advanced Quiz: Dynamic Programming
    prisma.quiz.upsert({
      where: { id: 6 },
      update: {},
      create: {
        lessonId: lessons[4].id,
        title: 'Advanced: Dynamic Programming',
        description: 'Challenge yourself with advanced DP concepts',
        timeLimit: 900, // 15 minutes
        questions: {
          create: [
            {
              prompt: 'What is the main principle of Dynamic Programming?',
              type: 'SINGLE',
              options: ['Break problem into subproblems and store results', 'Use recursion only', 'Sort the data first', 'Use loops'],
              answerKey: 'Break problem into subproblems and store results',
              explanation: 'DP solves problems by breaking them into overlapping subproblems and storing solutions.'
            },
            {
              prompt: 'What is memoization?',
              type: 'SINGLE',
              options: ['Storing results of expensive function calls', 'A sorting algorithm', 'A data structure', 'A loop optimization'],
              answerKey: 'Storing results of expensive function calls',
              explanation: 'Memoization caches results to avoid recalculating the same subproblems.'
            },
            {
              prompt: 'What is the time complexity of DP solution for Fibonacci?',
              type: 'SINGLE',
              options: ['O(n)', 'O(2^n)', 'O(log n)', 'O(n²)'],
              answerKey: 'O(n)',
              explanation: 'With DP, Fibonacci can be solved in linear time using memoization.'
            },
            {
              prompt: 'What is the difference between top-down and bottom-up DP?',
              type: 'SINGLE',
              options: ['Top-down uses recursion + memoization, bottom-up uses iteration', 'They are the same', 'Top-down is faster', 'Bottom-up uses recursion'],
              answerKey: 'Top-down uses recursion + memoization, bottom-up uses iteration',
              explanation: 'Top-down starts from the problem and works down, bottom-up builds from base cases.'
            },
            {
              prompt: 'Which problem is a classic DP problem?',
              type: 'SINGLE',
              options: ['Longest Common Subsequence', 'Binary Search', 'Quick Sort', 'Bubble Sort'],
              answerKey: 'Longest Common Subsequence',
              explanation: 'LCS is a classic DP problem that demonstrates optimal substructure.'
            }
          ]
        }
      }
    })
  ]);

  // ------------------------------------------------------------
  // ROADMAP "FINAL BOSS" content (8 quizzes + 2 bugfix + 2 solve per module)
  // Convention used by BossService:
  // - Quizzes: title starts with "[BOSS:<moduleSlug>]"
  // - Coding: category = "boss:<moduleSlug>" and titles include "[BUGFIX]" / "[SOLVE]"
  // ------------------------------------------------------------

  const bossModules: Array<{ slug: string; lessonId: number; label: string }> = [
    { slug: 'procedural-programming', lessonId: lessons[0].id, label: 'Procedural Programming' },
    { slug: 'object-oriented', lessonId: lessons[3].id, label: 'OOP' },
    { slug: 'data-structures', lessonId: lessons[2].id, label: 'Data Structures' },
    { slug: 'algorithms-logic', lessonId: lessons[1].id, label: 'Algorithms & Logic' },
    { slug: 'databases-sql', lessonId: lessons[5].id, label: 'Databases & SQL' },
    // Software Architecture doesn't exist in the base seed lessons; create one lightweight lesson and use it.
  ];

  const architectureLesson = await prisma.lesson.upsert({
    where: { id: 7 },
    update: {},
    create: {
      title: 'Software Architecture (Roadmap)',
      description: 'Design patterns, layering, scalability, and clean architecture.',
      content: '# Software Architecture\n\nPrincipii: SRP, separation of concerns, layering, scalability.',
      difficulty: 'Advanced',
      tags: ['arhitectura', 'design-patterns', 'clean-architecture'],
      authorId: professor.id
    }
  });

  bossModules.push({ slug: 'software-architecture', lessonId: architectureLesson.id, label: 'Software Architecture' });

  const bossQuizQuestionBank = [
    {
      prompt: 'Care afirmație despre complexitatea Big-O este corectă?',
      options: ['Descrie exact timpul în secunde', 'Descrie limita superioară asimptotică', 'Depinde doar de CPU', 'Nu are legătură cu algoritmii'],
      answerKey: 'Descrie limita superioară asimptotică',
      explanation: 'Big-O oferă o limită superioară asimptotică a timpului/ spațiului în funcție de n.'
    },
    {
      prompt: 'Care este diferența principală între listă și tuplu în Python?',
      options: ['Tuplul e mutabil', 'Lista e imutabilă', 'Tuplul e imutabil', 'Nu există diferență'],
      answerKey: 'Tuplul e imutabil',
      explanation: 'Tuplurile sunt imutabile, listele sunt mutabile.'
    },
    {
      prompt: 'Ce proprietate trebuie să aibă un algoritm de sortare “stabil”?',
      options: ['Să fie O(1)', 'Să păstreze ordinea relativă a elementelor egale', 'Să folosească recursie', 'Să ruleze doar pe array-uri'],
      answerKey: 'Să păstreze ordinea relativă a elementelor egale',
      explanation: 'Stabilitatea înseamnă că elementele cu chei egale își păstrează ordinea inițială.'
    }
  ];

  const bossQuizExtra = (moduleLabel: string) => [
    {
      prompt: `În contextul modulului "${moduleLabel}", care este cea mai bună practică?`,
      options: [
        'Scrie tot codul într-o singură funcție',
        'Separă responsabilitățile și testează incremental',
        'Evită testele pentru viteză',
        'Ignoră edge case-urile'
      ],
      answerKey: 'Separă responsabilitățile și testează incremental',
      explanation: 'Separarea responsabilităților + testarea incrementală reduce bug-urile și crește mentenabilitatea.'
    }
  ];

  // Create 8 boss quizzes per module (each quiz has 3-4 questions, "hard-ish")
  for (const mod of bossModules) {
    for (let i = 1; i <= 8; i++) {
      const title = `[BOSS:${mod.slug}] Final Boss Quiz ${i} • ${mod.label}`;
      const existing = await prisma.quiz.findFirst({ where: { title } });
      if (!existing) {
        await prisma.quiz.create({
          data: {
            lessonId: mod.lessonId,
            title,
            description: `Quiz greu (${i}/8) din modulul ${mod.label}.`,
            timeLimit: 8 * 60, // per-quiz internal limit (boss run uses global limit in frontend)
            status: 'PUBLISHED',
            questions: {
              create: [
                {
                  prompt: bossQuizQuestionBank[0].prompt,
                  type: 'SINGLE',
                  options: bossQuizQuestionBank[0].options,
                  answerKey: bossQuizQuestionBank[0].answerKey,
                  explanation: bossQuizQuestionBank[0].explanation
                },
                {
                  prompt: bossQuizQuestionBank[1].prompt,
                  type: 'SINGLE',
                  options: bossQuizQuestionBank[1].options,
                  answerKey: bossQuizQuestionBank[1].answerKey,
                  explanation: bossQuizQuestionBank[1].explanation
                },
                {
                  prompt: bossQuizQuestionBank[2].prompt,
                  type: 'SINGLE',
                  options: bossQuizQuestionBank[2].options,
                  answerKey: bossQuizQuestionBank[2].answerKey,
                  explanation: bossQuizQuestionBank[2].explanation
                },
                {
                  prompt: bossQuizExtra(mod.label)[0].prompt,
                  type: 'SINGLE',
                  options: bossQuizExtra(mod.label)[0].options,
                  answerKey: bossQuizExtra(mod.label)[0].answerKey,
                  explanation: bossQuizExtra(mod.label)[0].explanation
                }
              ]
            }
          }
        });
      }
    }

    // Create 2 bugfix + 2 solve coding exercises per module
    // NOTE: These are Python-only for now (consistent runner).
    const bugfixExercises = [
      {
        title: `[BUGFIX] Suma a două numere (bug) • ${mod.label}`,
        prompt:
          'Ai un bug: programul trebuie să afișeze suma a două numere citite de la stdin, dar acum produce output greșit.\n' +
          'Repară codul astfel încât să afișeze DOAR suma corectă.',
        starterCode:
          'a = int(input())\n' +
          'b = int(input())\n' +
          '# BUG: ar trebui suma, nu produs\n' +
          'print(a * b)\n',
        testCases: [
          { stdin: '2\n3\n', output: '5' },
          { stdin: '10\n-4\n', output: '6' }
        ]
      },
      {
        title: `[BUGFIX] Par/Impar (bug) • ${mod.label}`,
        prompt:
          'Ai un bug: programul trebuie să afișeze "par" dacă numărul este par, altfel "impar".\n' +
          'Repară codul (atenție la condiție).',
        starterCode:
          'n = int(input())\n' +
          '# BUG: condiția este inversată\n' +
          'if n % 2 != 0:\n' +
          '    print("par")\n' +
          'else:\n' +
          '    print("impar")\n',
        testCases: [
          { stdin: '4\n', output: 'par' },
          { stdin: '5\n', output: 'impar' }
        ]
      }
    ];

    const solveExercises = [
      {
        title: `[SOLVE] Maxim din 3 numere • ${mod.label}`,
        prompt: 'Citește 3 numere întregi și afișează cel mai mare dintre ele.',
        starterCode:
          'a = int(input())\n' +
          'b = int(input())\n' +
          'c = int(input())\n' +
          '# TODO: afișează maximul\n' +
          'print(max(a, b, c))\n',
        testCases: [
          { stdin: '1\n2\n3\n', output: '3' },
          { stdin: '-10\n-3\n-7\n', output: '-3' }
        ]
      },
      {
        title: `[SOLVE] Număr prim • ${mod.label}`,
        prompt:
          'Citește un număr n și afișează "da" dacă este prim, altfel "nu".\n' +
          'n este prim dacă are exact 2 divizori.',
        starterCode:
          'n = int(input())\n' +
          'if n < 2:\n' +
          '    print("nu")\n' +
          'else:\n' +
          '    prime = True\n' +
          '    for i in range(2, int(n ** 0.5) + 1):\n' +
          '        if n % i == 0:\n' +
          '            prime = False\n' +
          '            break\n' +
          '    print("da" if prime else "nu")\n',
        testCases: [
          { stdin: '2\n', output: 'da' },
          { stdin: '9\n', output: 'nu' }
        ]
      }
    ];

    for (const ex of [...bugfixExercises, ...solveExercises]) {
      const existing = await prisma.codingExercise.findFirst({
        where: { title: ex.title, category: `boss:${mod.slug}` }
      });
      if (!existing) {
        await prisma.codingExercise.create({
          data: {
            lessonId: mod.lessonId,
            title: ex.title,
            prompt: ex.prompt,
            starterCode: ex.starterCode,
            difficulty: 'HARD',
            language: 'PYTHON',
            category: `boss:${mod.slug}`,
            testCases: ex.testCases as any,
            status: 'PUBLISHED'
          }
        });
      }
    }
  }

  // ------------------------------------------------------------
  // ROADMAP v2: 45 CodeLab exercises per module (student-facing)
  // - category MUST equal module slug (so /codelab?category=slug loads only that module)
  // - titles are unique + deterministic => seed is idempotent
  // ------------------------------------------------------------

  const ROADMAP_MODULES: Array<{ slug: string; label: string }> = [
    { slug: 'procedural-programming', label: 'Procedural Programming' },
    { slug: 'object-oriented', label: 'Object Oriented (OOP)' },
    { slug: 'data-structures', label: 'Data Structures' },
    { slug: 'algorithms-logic', label: 'Algorithms & Logic' },
    { slug: 'databases-sql', label: 'Databases & SQL' },
    { slug: 'software-architecture', label: 'Software Architecture' }
  ];

  // Helper generators (simple, deterministic, validated by DB testCases)
  const makeProblem = (idx: number) => {
    const a = (idx % 17) + 2;
    const b = (idx % 11) + 3;
    const c = (idx % 19) - 5;
    const kinds = [
      {
        name: 'Suma a două numere',
        prompt: 'Citește două numere întregi și afișează suma lor.',
        stdin: `${a}\n${b}\n`,
        output: String(a + b)
      },
      {
        name: 'Diferența a două numere',
        prompt: 'Citește două numere întregi și afișează diferența (a - b).',
        stdin: `${a}\n${b}\n`,
        output: String(a - b)
      },
      {
        name: 'Produsul a două numere',
        prompt: 'Citește două numere întregi și afișează produsul lor.',
        stdin: `${a}\n${b}\n`,
        output: String(a * b)
      },
      {
        name: 'Maxim din 3 numere',
        prompt: 'Citește trei numere întregi și afișează cel mai mare dintre ele.',
        stdin: `${a}\n${b}\n${c}\n`,
        output: String(Math.max(a, b, c))
      },
      {
        name: 'Par sau impar',
        prompt: 'Citește un număr întreg și afișează "par" dacă este par, altfel "impar".',
        stdin: `${a}\n`,
        output: a % 2 === 0 ? 'par' : 'impar'
      }
    ];
    return kinds[idx % kinds.length];
  };

  const difficultyCycle = (i: number) => (i % 5 === 0 ? 'HARD' : i % 3 === 0 ? 'MEDIUM' : 'EASY');

  for (const mod of ROADMAP_MODULES) {
    for (let i = 1; i <= 45; i++) {
      const p = makeProblem(i + mod.slug.length);
      const title = `[Roadmap:${mod.slug}] #${String(i).padStart(2, '0')}: ${p.name}`;

      const existing = await prisma.codingExercise.findFirst({
        where: { title }
      });
      if (existing) continue;

      // Use the architectureLesson for software-architecture; otherwise map by bossModules lessonId
      const lessonId =
        mod.slug === 'software-architecture'
          ? architectureLesson.id
          : bossModules.find((m) => m.slug === mod.slug)?.lessonId ?? lessons[0].id;

      await prisma.codingExercise.create({
        data: {
          lessonId,
          title,
          prompt: `${p.prompt}\n\n(Modul: ${mod.label} • Exercițiul ${i}/45)`,
          starterCode:
            'import sys\n' +
            '# TODO: citește de la stdin și afișează răspunsul corect\n',
          difficulty: difficultyCycle(i),
          language: 'PYTHON',
          category: mod.slug,
          testCases: [{ stdin: p.stdin, output: p.output }] as any,
          hint: 'Urmează exact cerința: citește input-ul cu input() și afișează DOAR rezultatul cerut.',
          status: 'PUBLISHED'
        }
      });
    }
  }

  // Seed track quizzes (Romanian) - one track step == one quiz
  // Idempotent: upsert by (lessonId + title) and replace questions.
  type TrackDifficulty = 'EASY' | 'EASY_MEDIUM' | 'MEDIUM' | 'HARD' | 'VERY_HARD' | 'EXPERT' | 'LEGENDARY' | 'MASTERY';
  type SeedQuestion = {
    prompt: string;
    type: 'SINGLE';
    options: string[];
    answerKey: string;
    explanation: string;
  };

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const recommendedQuizTimeLimitSeconds = (questionCount: number, difficulty: TrackDifficulty) => {
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
    return clamp(q * secondsPerQuestion, 120, 1800);
  };

  const q = (prompt: string, options: string[], answerKey: string, explanation: string): SeedQuestion => ({
    prompt,
    type: 'SINGLE',
    options,
    answerKey,
    explanation
  });

  const upsertQuizByTitle = async (lessonId: number, title: string, description: string, timeLimit: number, questions: SeedQuestion[]) => {
    const existing = await prisma.quiz.findFirst({
      where: { lessonId, title },
      select: { id: true }
    });

    if (existing) {
      return prisma.quiz.update({
        where: { id: existing.id },
        data: {
          description,
          timeLimit,
          status: 'PUBLISHED',
          questions: {
            deleteMany: {},
            create: questions
          }
        }
      });
    }

    return prisma.quiz.create({
      data: {
        lessonId,
        title,
        description,
        timeLimit,
        status: 'PUBLISHED',
        questions: {
          create: questions
        }
      }
    });
  };

  const trackQuizzes: Array<{
    lessonId: number;
    title: string;
    description: string;
    difficulty: TrackDifficulty;
    questions: SeedQuestion[];
  }> = [
    // Category 1: Bazele Programării (lessons[0])
    {
      lessonId: lessons[0].id,
      title: 'Hello World & Variabile',
      description: 'Primele tale linii de cod și tipuri de date.',
      difficulty: 'EASY',
      questions: [
        q('Ce face instrucțiunea `print("Hello World")` în Python?', ['Afișează textul în consolă', 'Citește un număr de la tastatură', 'Definește o funcție', 'Creează o listă'], 'Afișează textul în consolă', 'print afișează pe ecran (stdout) ceea ce îi dai ca argument.'),
        q('Ce este o variabilă?', ['Un nume care “ține” o valoare', 'Un tip de buclă', 'Un operator matematic', 'Un fișier de sistem'], 'Un nume care “ține” o valoare', 'O variabilă este o etichetă (nume) asociată unei valori.'),
        q('Ce tip are în Python valoarea `3.14`?', ['int', 'float', 'str', 'bool'], 'float', 'Numerele cu zecimale sunt de tip float.')
      ]
    },
    {
      lessonId: lessons[0].id,
      title: 'Operatori Matematici',
      description: 'Cum facem calcule simple în Python.',
      difficulty: 'EASY',
      questions: [
        q('Ce rezultat are expresia `5 % 2`?', ['0', '1', '2', '3'], '1', 'Operatorul % întoarce restul împărțirii.'),
        q('Ce înseamnă operatorul `//` în Python?', ['Împărțire cu rezultat zecimal', 'Împărțire întreagă (floor)', 'Ridicare la putere', 'Comparare'], 'Împărțire întreagă (floor)', 'Împărțirea întreagă păstrează doar partea întreagă.'),
        q('Care este rezultatul lui `2 + 3 * 4`?', ['20', '14', '24', '9'], '14', 'Înmulțirea are prioritate față de adunare.')
      ]
    },
    {
      lessonId: lessons[0].id,
      title: 'Decizii Logice (If/Else)',
      description: 'Învață computerul să ia decizii.',
      difficulty: 'EASY_MEDIUM',
      questions: [
        q('Ce face o instrucțiune `if`?', ['Execută un bloc doar dacă o condiție e adevărată', 'Repetă un bloc de cod de N ori', 'Definește o variabilă', 'Importă o bibliotecă'], 'Execută un bloc doar dacă o condiție e adevărată', 'if controlează executarea condiționată.'),
        q('Ce operator verifică egalitatea în Python?', ['=', '==', '!=', '=>'], '==', '`=` este atribuire, `==` este comparație.'),
        q('Dacă `x = 5`, ce se întâmplă pentru `if x > 3: print("DA")`?', ['Nu se afișează nimic', 'Se afișează DA', 'Eroare de sintaxă', 'Se afișează 3'], 'Se afișează DA', 'Condiția este adevărată, deci blocul rulează.')
      ]
    },
    {
      lessonId: lessons[0].id,
      title: 'Buclele Repetitive (While)',
      description: 'Cum repetăm o acțiune eficient.',
      difficulty: 'MEDIUM',
      questions: [
        q('Când se oprește o buclă `while`?', ['Când condiția devine falsă', 'Când întâlnește un `print`', 'Când variabila e de tip int', 'Doar la finalul programului'], 'Când condiția devine falsă', 'while rulează cât timp condiția e adevărată.'),
        q('Câte iterații face codul: `i=0; while i<3: i+=1`?', ['2', '3', '4', 'Infinit'], '3', 'i ia valorile 0→1→2→3, bucla rulează de 3 ori.'),
        q('Care este o cauză comună a unei bucle infinite?', ['Nu actualizezi variabila din condiție', 'Folosești `print`', 'Ai prea multe spații', 'Ai o funcție'], 'Nu actualizezi variabila din condiție', 'Dacă condiția nu se schimbă niciodată, bucla nu se termină.')
      ]
    },
    {
      lessonId: lessons[0].id,
      title: 'Buclele For',
      description: 'Iterarea prin secvențe simple.',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce valori produce `range(3)`?', ['1, 2, 3', '0, 1, 2', '0, 1, 2, 3', '3, 2, 1'], '0, 1, 2', 'range(n) pornește de la 0 și se oprește la n-1.'),
        q('Cum iterezi printr-o listă `lista`?', ['for i in len(lista):', 'for item in lista:', 'while lista:', 'for item in range(lista):'], 'for item in lista:', 'În Python, iterezi direct elementele listei.'),
        q('Când e mai potrivit `for` decât `while`?', ['Când știi “câte” elemente/parcurgeri ai', 'Când vrei o buclă infinită', 'Când nu ai condiții', 'Doar în C++'], 'Când știi “câte” elemente/parcurgeri ai', '`for` e ideal pentru parcurgere de colecții/range.')
      ]
    },
    {
      lessonId: lessons[0].id,
      title: 'Funcții – Partea 1',
      description: 'Definirea și apelarea funcțiilor.',
      difficulty: 'MEDIUM',
      questions: [
        q('Cu ce cuvânt cheie definești o funcție în Python?', ['func', 'def', 'function', 'lambda'], 'def', '`def` începe definiția unei funcții.'),
        q('Cum apelezi o funcție `suma` cu argumentele 2 și 3?', ['suma = 2,3', 'call suma(2,3)', 'suma(2, 3)', 'suma{2,3}'], 'suma(2, 3)', 'Funcțiile se apelează cu paranteze rotunde.'),
        q('Ce este “scope”-ul unei variabile locale?', ['Zona în care variabila există/poate fi folosită', 'Tipul variabilei', 'Valoarea variabilei', 'Numele funcției'], 'Zona în care variabila există/poate fi folosită', 'Variabilele locale sunt vizibile doar în funcția în care sunt create.')
      ]
    },
    {
      lessonId: lessons[0].id,
      title: 'Funcții – Partea 2',
      description: 'Parametri și valori returnate.',
      difficulty: 'HARD',
      questions: [
        q('Care este diferența dintre parametri și argumente?', ['Nu există diferență', 'Parametrii sunt în definiție, argumentele la apel', 'Parametrii sunt numere, argumentele sunt texte', 'Argumentele sunt în definiție, parametrii la apel'], 'Parametrii sunt în definiție, argumentele la apel', 'Parametrii apar în `def`, argumentele sunt valorile concrete la apel.'),
        q('Ce face instrucțiunea `return`?', ['Afișează ceva', 'Opresc programul', 'Întoarce o valoare și iese din funcție', 'Definește o listă'], 'Întoarce o valoare și iese din funcție', 'return finalizează funcția și trimite rezultatul.'),
        q('Ce se întâmplă dacă o funcție nu are `return` explicit?', ['Returnează 0', 'Returnează None', 'Returnează True', 'Eroare'], 'Returnează None', 'În Python, implicit se întoarce None.')
      ]
    },
    {
      lessonId: lessons[0].id,
      title: 'Testul Final de Bază',
      description: 'O combinație a tuturor conceptelor de mai sus.',
      difficulty: 'MASTERY',
      questions: [
        q('Ce ordonare a pașilor e corectă pentru a rezolva o problemă simplă?', ['Scrii cod, apoi citești cerința', 'Citești cerința, planifici, apoi scrii cod', 'Rulezi fără să citești', 'Doar copiezi'], 'Citești cerința, planifici, apoi scrii cod', 'Un flux bun: înțelegi → planifici → implementezi → testezi.'),
        q('Care este combinația corectă “intrare → procesare → ieșire”?', ['print → input → calcule', 'input → calcule → print', 'calcule → print → input', 'input → print → calcule'], 'input → calcule → print', 'În majoritatea problemelor: citești datele, calculezi, afișezi rezultatul.'),
        q('Ce folosești ca să eviți repetarea de cod?', ['Funcții', 'Mai multe print-uri', 'Comentarii', 'Spații'], 'Funcții', 'Funcțiile te ajută să reutilizezi logică.')
      ]
    },

    // Category 2: Liste și Șiruri (lessons[2])
    {
      lessonId: lessons[2].id,
      title: 'Crearea Listelor',
      description: 'Indexare și accesarea elementelor.',
      difficulty: 'EASY',
      questions: [
        q('Care este indexul primului element într-o listă Python?', ['0', '1', '-1', 'Depinde'], '0', 'Listele sunt indexate de la 0.'),
        q('Ce înseamnă indexul `-1` într-o listă?', ['Primul element', 'Ultimul element', 'Element inexistent', 'Lista întreagă'], 'Ultimul element', 'Indexarea negativă pornește de la coadă.'),
        q('Ce întoarce `len([1,2,3])`?', ['2', '3', '4', 'Eroare'], '3', 'len întoarce numărul de elemente.')
      ]
    },
    {
      lessonId: lessons[2].id,
      title: 'Metode de Bază',
      description: 'Append, Pop și Insert.',
      difficulty: 'EASY',
      questions: [
        q('Ce face `lista.append(x)`?', ['Adaugă x la final', 'Șterge x', 'Sortează lista', 'Caută x'], 'Adaugă x la final', 'append adaugă un element la final.'),
        q('Ce face `lista.pop()` fără argument?', ['Șterge primul element', 'Șterge ultimul element și îl returnează', 'Copiază lista', 'Nu face nimic'], 'Șterge ultimul element și îl returnează', 'pop scoate ultimul element (by default) și îl returnează.'),
        q('Ce face `lista.insert(0, x)`?', ['Adaugă x la final', 'Adaugă x la început', 'Înlocuiește toate valorile', 'Inversează lista'], 'Adaugă x la început', 'insert(i, x) inserează la indexul i.')
      ]
    },
    {
      lessonId: lessons[2].id,
      title: 'Slicing (Felierea)',
      description: 'Cum extragem sub‑liste eficient.',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce întoarce `a[1:3]` pentru `a=[10,20,30,40]`?', ['[20, 30]', '[10, 20, 30]', '[30, 40]', '[20, 30, 40]'], '[20, 30]', 'Capătul din slicing (3) este exclus.'),
        q('Ce înseamnă `a[:2]`?', ['Primele 2 elemente', 'Ultimele 2 elemente', 'Doar elementul 2', 'Lista goală'], 'Primele 2 elemente', 'Dacă lipsește start-ul, începe de la 0.'),
        q('Ce înseamnă `a[::2]`?', ['Toate elementele', 'Elementele de pe poziții pare', 'Elementele de pe poziții impare', 'Inversează lista'], 'Elementele de pe poziții pare', 'Pasul 2 sare din 2 în 2: 0,2,4,...')
      ]
    },
    {
      lessonId: lessons[2].id,
      title: 'List Comprehension',
      description: 'Magia Python pentru liste pe o singură linie.',
      difficulty: 'MEDIUM',
      questions: [
        q('Care este forma corectă pentru o list comprehension?', ['[x for x in lista]', '(x for x in lista)', '{x for x in lista}', 'x for x in lista'], '[x for x in lista]', 'List comprehension folosește paranteze pătrate.'),
        q('Ce produce `[x*x for x in [1,2,3]]`?', ['[1,2,3]', '[1,4,9]', '[2,4,6]', '[1,8,27]'], '[1,4,9]', 'Se aplică x*x fiecărui element.'),
        q('Cum filtrezi doar numerele pare într-o comprehension?', ['[x for x in lista if x % 2 == 0]', '[if x%2==0 for x in lista]', '[x if x%2==0 for x in lista]', '[x for x in lista % 2]'], '[x for x in lista if x % 2 == 0]', 'Condiția se pune la final.')
      ]
    },
    {
      lessonId: lessons[2].id,
      title: 'Matrice (Liste în Liste)',
      description: 'Lucrul cu date 2D.',
      difficulty: 'HARD',
      questions: [
        q('Cum accesezi elementul de pe linia 2, coloana 3 într-o matrice `m`?', ['m[2,3]', 'm[1][2]', 'm[2][3]', 'm(2)(3)'], 'm[1][2]', 'Indexarea e 0-based: linia 2→index 1, coloana 3→index 2.'),
        q('Ce reprezintă o “matrice” în Python, de obicei?', ['O listă de liste', 'Un string', 'Un dicționar', 'Un set'], 'O listă de liste', 'Reprezentarea clasică este listă de rânduri.'),
        q('Ce problemă apare dacă faci `m = [[0]*3]*3`?', ['Matricea e prea mare', 'Toate rândurile referă aceeași listă', 'Nu se poate în Python', 'E mai lent'], 'Toate rândurile referă aceeași listă', 'Ai referințe comune → modifici un rând, se schimbă toate.')
      ]
    },
    {
      lessonId: lessons[2].id,
      title: 'Manipularea String‑urilor',
      description: 'Metode specifice pentru text.',
      difficulty: 'HARD',
      questions: [
        q('String-urile în Python sunt…', ['Mutabile', 'Imutabile', 'Doar numere', 'Doar liste'], 'Imutabile', 'Nu poți modifica direct un caracter, creezi un nou string.'),
        q('Ce face `"a,b,c".split(",")`?', ['Unește textele', 'Împarte în listă', 'Șterge virgule', 'Înlocuiește virgule cu spații'], 'Împarte în listă', 'split separă string-ul după separator.'),
        q('Ce întoarce `"Abc".lower()`?', ['"ABC"', '"abc"', '"Abc"', 'Eroare'], '"abc"', 'lower transformă în litere mici.')
      ]
    },
    {
      lessonId: lessons[2].id,
      title: 'Tuples vs Lists',
      description: 'Când folosim date imutabile.',
      difficulty: 'HARD',
      questions: [
        q('Diferența principală tuple vs listă este că tuple-ul este…', ['Mai lent', 'Imutabil', 'Doar pentru numere', 'Indexat de la 1'], 'Imutabil', 'Tuple nu se modifică după creare.'),
        q('Care sintaxă creează un tuple cu un singur element?', ['(5)', '(5,)', '[5]', '{5}'], '(5,)', 'Virgula face diferența: (5,) este tuple.'),
        q('Când e util un tuple?', ['Când vrei date care nu se schimbă', 'Când ai nevoie de metode append', 'Când vrei să sortezi mereu', 'Când ai doar stringuri'], 'Când vrei date care nu se schimbă', 'Imutabilitatea reduce erori și poate fi folosită ca cheie.')
      ]
    },
    {
      lessonId: lessons[2].id,
      title: 'Arhitectul de Date',
      description: 'Probleme complexe de organizare a datelor.',
      difficulty: 'MASTERY',
      questions: [
        q('Ce structură e potrivită pentru “nume → vârstă” (mapare)?', ['listă', 'dicționar', 'tuple', 'set'], 'dicționar', 'Dicționarul mapează chei la valori.'),
        q('Ce alegi pentru a evita duplicatele automat?', ['set', 'listă', 'tuple', 'string'], 'set', 'Set păstrează elemente unice.'),
        q('Ce concept ajută la organizarea datelor în pași mici și verificabili?', ['Decompozare', 'Random', 'Copy-paste', 'Overflow'], 'Decompozare', 'Împarți problema în sub-probleme clare.')
      ]
    },

    // Category 3: Măiestria Recursivității (lessons[1])
    {
      lessonId: lessons[1].id,
      title: 'Ce este Recursivitatea?',
      description: 'Conceptul de bază și cazul de oprire.',
      difficulty: 'EASY',
      questions: [
        q('Ce este recursivitatea?', ['O funcție care se auto-apelează', 'Un tip de listă', 'Un operator matematic', 'Un fișier'], 'O funcție care se auto-apelează', 'Recursivitatea înseamnă apelarea funcției din ea însăși.'),
        q('De ce ai nevoie obligatoriu într-o soluție recursivă?', ['Un caz de oprire (base case)', 'Un print', 'O listă', 'Un for'], 'Un caz de oprire (base case)', 'Fără base case, recursia nu se termină.'),
        q('Ce risc apare la recursie fără oprire?', ['Stack overflow', 'Se sortează lista', 'Se optimizează automat', 'Nu se întâmplă nimic'], 'Stack overflow', 'Prea multe apeluri umplu stiva de apeluri.')
      ]
    },
    {
      lessonId: lessons[1].id,
      title: 'Stiva de Apeluri (Call Stack)',
      description: 'Cum ține minte calculatorul unde a rămas.',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce este “call stack”-ul?', ['Structura care reține apelurile funcțiilor active', 'O listă de numere', 'Un tabel SQL', 'Un fișier de log'], 'Structura care reține apelurile funcțiilor active', 'Stiva păstrează contextul fiecărui apel.'),
        q('Ce se întâmplă la fiecare apel recursiv?', ['Se adaugă un nou “frame” în stivă', 'Se șterge programul', 'Se resetează variabilele globale', 'Nu se schimbă nimic'], 'Se adaugă un nou “frame” în stivă', 'Fiecare apel are propriul context.'),
        q('Cum eviți adâncimi foarte mari de recursie?', ['Folosind iterație sau optimizare (memoizare)', 'Adăugând print-uri', 'Punând mai multe spații', 'Folosind set'], 'Folosind iterație sau optimizare (memoizare)', 'Poți rescrie iterativ sau reduci apelurile.')
      ]
    },
    {
      lessonId: lessons[1].id,
      title: 'Factorial & Fibonacci',
      description: 'Exemplele clasice explicate.',
      difficulty: 'MEDIUM',
      questions: [
        q('Care este definiția recursivă pentru factorial?', ['n! = n*(n-1)!', 'n! = n+(n-1)', 'n! = 2n', 'n! = n/2'], 'n! = n*(n-1)!', 'Factorialul se reduce la factorial(n-1).'),
        q('Ce base case e corect pentru factorial?', ['factorial(0)=1', 'factorial(0)=0', 'factorial(1)=0', 'factorial(2)=2'], 'factorial(0)=1', '0! este definit ca 1.'),
        q('De ce Fibonacci recursiv “naiv” e lent?', ['Recalculează aceleași subprobleme', 'Nu folosește print', 'Nu are liste', 'Folosește prea puține variabile'], 'Recalculează aceleași subprobleme', 'Fără memoizare, ai multe calcule repetate.')
      ]
    },
    {
      lessonId: lessons[1].id,
      title: 'Recursivitate vs Iterație',
      description: 'Transcrierea buclelor în funcții recursive.',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce au în comun recursia și iterația?', ['Pot rezolva aceleași probleme', 'Sunt identice ca performanță mereu', 'Recursia nu folosește memorie', 'Iterația nu poate repeta'], 'Pot rezolva aceleași probleme', 'Multe probleme au soluții echivalente.'),
        q('Ce e un avantaj al iterației?', ['De obicei consumă mai puțină stivă', 'E mereu mai ușor de citit', 'Nu poate avea bug-uri', 'Nu folosește condiții'], 'De obicei consumă mai puțină stivă', 'Iterația nu adaugă frame-uri în call stack.'),
        q('Ce e un avantaj al recursiei?', ['Cod mai natural pentru structuri recursive (ex: arbori)', 'E mai rapidă întotdeauna', 'Nu are nevoie de base case', 'Nu are nevoie de variabile'], 'Cod mai natural pentru structuri recursive (ex: arbori)', 'Pentru arbori/backtracking recursia e foarte expresivă.')
      ]
    },
    {
      lessonId: lessons[1].id,
      title: 'Căutarea Binară Recursivă',
      description: 'Algoritmi eficienți.',
      difficulty: 'HARD',
      questions: [
        q('Ce condiție trebuie să îndeplinească lista pentru binary search?', ['Să fie sortată', 'Să fie un set', 'Să aibă număr par de elemente', 'Să fie doar stringuri'], 'Să fie sortată', 'Binary search funcționează corect doar pe colecții sortate.'),
        q('Care este complexitatea tipică a căutării binare?', ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], 'O(log n)', 'Împarte spațiul de căutare la jumătate la fiecare pas.'),
        q('În recursie, care e “base case”-ul pentru binary search?', ['Când intervalul devine invalid (stânga > dreapta)', 'Când găsești primul element', 'Când lista e goală doar la început', 'Nu există base case'], 'Când intervalul devine invalid (stânga > dreapta)', 'Dacă nu mai ai interval, elementul nu există.')
      ]
    },
    {
      lessonId: lessons[1].id,
      title: 'Problema Turnurilor din Hanoi',
      description: 'Logică avansată.',
      difficulty: 'HARD',
      questions: [
        q('Regula principală la Hanoi este…', ['Nu pui un disc mare peste unul mic', 'Muți toate discurile simultan', 'Folosești două tije', 'Nu ai nevoie de recursie'], 'Nu pui un disc mare peste unul mic', 'Aceasta este constrângerea problemei.'),
        q('Câte mutări minime sunt necesare pentru n discuri?', ['n', '2^n - 1', 'n^2', 'n!'], '2^n - 1', 'Formula clasică pentru Hanoi.'),
        q('De ce e Hanoi un exemplu bun de recursie?', ['Se reduce natural la o problemă cu n-1 discuri', 'Nu are base case', 'Nu are reguli', 'Nu folosește funcții'], 'Se reduce natural la o problemă cu n-1 discuri', 'Subproblema e aceeași, doar mai mică.')
      ]
    },
    {
      lessonId: lessons[1].id,
      title: 'Backtracking Simplu',
      description: 'Generarea permutărilor.',
      difficulty: 'VERY_HARD',
      questions: [
        q('Ce este backtracking?', ['Explorare a opțiunilor cu “undo” când ajungi într-un impas', 'Un tip de sorting', 'Un tip de SQL', 'O variabilă'], 'Explorare a opțiunilor cu “undo” când ajungi într-un impas', 'Construiești soluția pas cu pas și revii dacă nu merge.'),
        q('De ce backtracking poate fi costisitor?', ['Poate explora multe combinații', 'Nu are condiții', 'Nu folosește funcții', 'Este mereu O(1)'], 'Poate explora multe combinații', 'Spațiul de căutare poate crește exponențial.'),
        q('Ce tehnică ajută să reduci căutarea în backtracking?', ['Pruning (tăierea ramurilor)', 'Mai multe print-uri', 'Mai multe variabile globale', 'Schimbarea fontului'], 'Pruning (tăierea ramurilor)', 'Elimini devreme ramurile imposibile.')
      ]
    },
    {
      lessonId: lessons[1].id,
      title: 'Marele Recurs',
      description: 'Rezolvă un labirint folosind recursivitatea.',
      difficulty: 'MASTERY',
      questions: [
        q('Ce algoritm clasic folosești pentru labirint (grid) cu recursie?', ['DFS (depth-first search)', 'Bubble sort', 'Binary search', 'Two pointers'], 'DFS (depth-first search)', 'DFS explorează adânc pe fiecare direcție.'),
        q('Cum eviți să te întorci în același loc în labirint?', ['Marchezi celulele vizitate', 'Sortezi labirintul', 'Folosești doar while', 'Scoți toate zidurile'], 'Marchezi celulele vizitate', 'Fără vizitare, poți intra în cicluri.'),
        q('Ce reprezintă “backtracking” într-un labirint?', ['Te întorci când un drum e blocat', 'Te oprești la prima celulă', 'Mergi doar în dreapta', 'Ștergi intrarea'], 'Te întorci când un drum e blocat', 'Revii la ultima decizie și încerci altă direcție.')
      ]
    },

    // Category 4: Programare Orientată pe Obiecte (lessons[3])
    {
      lessonId: lessons[3].id,
      title: 'Clase și Obiecte',
      description: 'Diferența dintre plan (clasă) și casă (obiect).',
      difficulty: 'EASY',
      questions: [
        q('Ce este o clasă?', ['Un “șablon” pentru obiecte', 'O variabilă', 'O buclă', 'Un fișier'], 'Un “șablon” pentru obiecte', 'Clasa definește atribute și comportamente.'),
        q('Ce este un obiect?', ['O instanță a unei clase', 'O funcție', 'Un modul', 'Un tip de date primitiv'], 'O instanță a unei clase', 'Obiectul este “construit” din clasă.'),
        q('Cum creezi un obiect în Python?', ['Prin apelarea clasei ca o funcție', 'Cu `new` obligatoriu', 'Cu `malloc`', 'Cu `import`'], 'Prin apelarea clasei ca o funcție', 'Ex: `p = Persoana()`.')
      ]
    },
    {
      lessonId: lessons[3].id,
      title: 'Atribute și Metode',
      description: 'Comportamentul obiectelor ("self").',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce reprezintă `self` într-o metodă?', ['Referința la instanța curentă', 'Un tip de date', 'O constantă', 'O bibliotecă'], 'Referința la instanța curentă', '`self` îți dă acces la atributele/metodele obiectului.'),
        q('Atributele descriu…', ['Starea obiectului', 'Doar bucle', 'Doar interogări', 'Doar fișiere'], 'Starea obiectului', 'Ex: nume, vârstă, scor etc.'),
        q('Metodele descriu…', ['Comportamentul obiectului', 'Doar datele brute', 'Doar tipurile', 'Doar erorile'], 'Comportamentul obiectului', 'Ex: calculează, validează, afișează.')
      ]
    },
    {
      lessonId: lessons[3].id,
      title: 'Constructorul (__init__)',
      description: 'Cum iau naștere obiectele.',
      difficulty: 'MEDIUM',
      questions: [
        q('Când se apelează `__init__`?', ['La crearea obiectului', 'La ștergerea obiectului', 'La import', 'La fiecare print'], 'La crearea obiectului', 'Constructorul inițializează instanța.'),
        q('Care este scopul lui `__init__`?', ['Inițializează atributele', 'Sortează liste', 'Rulează SQL', 'Face networking'], 'Inițializează atributele', 'Setează starea inițială a obiectului.'),
        q('Ce se întâmplă dacă nu definești `__init__`?', ['Python folosește unul implicit', 'Programul nu pornește', 'Nu poți crea obiecte', 'Eroare de sintaxă'], 'Python folosește unul implicit', 'Există un constructor implicit fără inițializări custom.')
      ]
    },
    {
      lessonId: lessons[3].id,
      title: 'Încapsularea',
      description: 'Protejarea datelor private.',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce urmărește încapsularea?', ['Ascunderea detaliilor interne și protejarea datelor', 'Să faci codul mai lung', 'Să elimini clasele', 'Să eviți funcțiile'], 'Ascunderea detaliilor interne și protejarea datelor', 'Încapsularea limitează accesul direct la internals.'),
        q('În Python, convenția pentru “privat” este…', ['prefix `_`', 'prefix `#`', 'prefix `private`', 'nu există'], 'prefix `_`', 'Ex: `_saldo` indică “folosește cu grijă”.'),
        q('Ce folosești ca să controlezi accesul la un atribut?', ['Metode / property', 'Doar print', 'Doar global', 'Doar set'], 'Metode / property', 'Getter/setter sau @property.')
      ]
    },
    {
      lessonId: lessons[3].id,
      title: 'Moștenirea (Inheritance)',
      description: 'Cum refolosim codul părinților.',
      difficulty: 'HARD',
      questions: [
        q('Ce este moștenirea?', ['O clasă derivă din alta și preia comportamente', 'Un tip de buclă', 'Un operator', 'O bază de date'], 'O clasă derivă din alta și preia comportamente', 'Clasele copil reutilizează codul părinte.'),
        q('Ce reprezintă clasa “părinte” (base class)?', ['Clasa de la care moștenești', 'Clasa cu cele mai multe metode', 'Clasa care nu are atribute', 'Clasa finală'], 'Clasa de la care moștenești', 'Din ea preiei atribute/metode.'),
        q('Când e utilă moștenirea?', ['Când ai relație “este-un” (is-a)', 'Când ai relație “are-un” (has-a) mereu', 'Când vrei să eviți funcțiile', 'Când ai doar date'], 'Când ai relație “este-un” (is-a)', 'Ex: Student este Persoană.')
      ]
    },
    {
      lessonId: lessons[3].id,
      title: 'Polimorfismul',
      description: 'Aceeași funcție, comportament diferit.',
      difficulty: 'HARD',
      questions: [
        q('Ce înseamnă polimorfism?', ['Aceeași interfață, implementări diferite', 'Doar moștenire', 'Doar încapsulare', 'Doar variabile'], 'Aceeași interfață, implementări diferite', 'Poți trata obiecte diferite la fel, dar ele se comportă diferit.'),
        q('Ce este “override”?', ['Suprascrierea unei metode în clasa copil', 'Ștergerea clasei', 'Crearea unei liste', 'Un tip de SQL'], 'Suprascrierea unei metode în clasa copil', 'Copilul oferă o implementare proprie.'),
        q('De ce e util polimorfismul?', ['Simplifică codul care lucrează cu tipuri diferite', 'Crește numărul de bug-uri', 'Elimină testele', 'Obligă folosirea while'], 'Simplifică codul care lucrează cu tipuri diferite', 'Codul devine extensibil.')
      ]
    },
    {
      lessonId: lessons[3].id,
      title: 'Metode Magice (Dunder Methods)',
      description: 'Puterea ascunsă a claselor.',
      difficulty: 'HARD',
      questions: [
        q('Ce este o “dunder method”?', ['Metodă specială cu __nume__', 'Metodă care rulează doar duminica', 'Operator matematic', 'Decorator'], 'Metodă specială cu __nume__', 'Ex: __str__, __len__, __add__.'),
        q('Ce face `__str__`?', ['Definește cum se afișează obiectul ca text', 'Calculează suma', 'Face moștenire', 'Creează fișiere'], 'Definește cum se afișează obiectul ca text', 'Controlează reprezentarea “friendly”.'),
        q('Ce face `__len__`?', ['Definește comportamentul lui len(obj)', 'Citește input', 'Deschide conexiuni', 'Validează SQL'], 'Definește comportamentul lui len(obj)', 'Poți controla lungimea pentru obiectele tale.')
      ]
    },
    {
      lessonId: lessons[3].id,
      title: 'Arhitect Software',
      description: 'Proiectează un sistem complet (ex: un mic joc RPG).',
      difficulty: 'MASTERY',
      questions: [
        q('Ce principiu te ajută să ai clase mici și clare?', ['Single Responsibility', 'Copy/Paste', 'Hardcode', 'Spaghetti'], 'Single Responsibility', 'O clasă ar trebui să aibă un singur motiv de schimbare.'),
        q('Ce relație e bună pentru “Personaj are Inventar”?', ['Compoziție (has-a)', 'Moștenire (is-a)', 'Nicio relație', 'Sortare'], 'Compoziție (has-a)', 'Inventarul e “parte din” personaj.'),
        q('Ce e important când modelezi un sistem?', ['Separarea responsabilităților și interfețe clare', 'Să ai cât mai multe clase random', 'Să nu folosești testare', 'Să eviți design'], 'Separarea responsabilităților și interfețe clare', 'Design-ul bun reduce bug-uri și crește viteza de dezvoltare.')
      ]
    },

    // Category 5: Baze de Date & SQL (lessons[5])
    {
      lessonId: lessons[5].id,
      title: 'Ce este o Bază de Date?',
      description: 'Tabele, rânduri și coloane.',
      difficulty: 'EASY',
      questions: [
        q('Într-o bază de date relațională, datele sunt organizate în…', ['tabele', 'fișiere text', 'imagini', 'grafuri doar'], 'tabele', 'Modelul relațional folosește tabele.'),
        q('Un rând (row) reprezintă…', ['un record/înregistrare', 'o coloană', 'un index', 'o relație'], 'un record/înregistrare', 'Rândul = o instanță de date.'),
        q('O coloană (column) reprezintă…', ['un câmp/atribut', 'un fișier', 'un program', 'o cheie externă mereu'], 'un câmp/atribut', 'Coloana descrie un tip de informație (ex: email).')
      ]
    },
    {
      lessonId: lessons[5].id,
      title: 'SELECT & WHERE',
      description: 'Cum găsim exact ce căutăm.',
      difficulty: 'EASY',
      questions: [
        q('Ce face `SELECT`?', ['Citește (retrage) date', 'Șterge date', 'Creează tabele', 'Actualizează date'], 'Citește (retrage) date', 'SELECT returnează rânduri/coloane.'),
        q('Ce face `WHERE`?', ['Filtrează rândurile', 'Sortează rândurile', 'Unește tabele', 'Creează index'], 'Filtrează rândurile', 'WHERE aplică o condiție.'),
        q('Care e forma corectă?', ['SELECT * WHERE users;', 'SELECT * FROM users WHERE id=1;', 'FROM users SELECT *;', 'WHERE id=1 SELECT *;'], 'SELECT * FROM users WHERE id=1;', 'Sintaxa standard include FROM și WHERE.')
      ]
    },
    {
      lessonId: lessons[5].id,
      title: 'INSERT, UPDATE, DELETE',
      description: 'Modificarea datelor (CRUD).',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce comandă adaugă date noi?', ['INSERT', 'SELECT', 'JOIN', 'GROUP'], 'INSERT', 'INSERT creează un nou rând.'),
        q('Ce comandă modifică rânduri existente?', ['UPDATE', 'INSERT', 'DELETE', 'ORDER'], 'UPDATE', 'UPDATE schimbă valori pe rânduri existente.'),
        q('De ce e important WHERE la UPDATE/DELETE?', ['Ca să nu modifici/ștergi toate rândurile', 'Ca să fie mai rapid internetul', 'Ca să creezi index', 'Nu e important'], 'Ca să nu modifici/ștergi toate rândurile', 'Fără WHERE riști operații globale.')
      ]
    },
    {
      lessonId: lessons[5].id,
      title: 'Funcții de Agregare',
      description: 'SUM, AVG, COUNT.',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce face `COUNT(*)`?', ['Numără rândurile', 'Adună valori', 'Împarte rânduri', 'Șterge duplicate'], 'Numără rândurile', 'COUNT(*) numără rândurile returnate.'),
        q('Ce face `AVG(col)`?', ['Media valorilor din coloană', 'Maximul', 'Minimul', 'Numărul de coloane'], 'Media valorilor din coloană', 'AVG calculează media.'),
        q('Ce problemă apare dacă agregi fără să știi de NULL?', ['Rezultate surprinzătoare (NULL ignorat)', 'SQL se oprește', 'Nu poți folosi SELECT', 'Nu există'], 'Rezultate surprinzătoare (NULL ignorat)', 'Multe agregări ignoră NULL.')
      ]
    },
    {
      lessonId: lessons[5].id,
      title: 'Gruparea Datelor',
      description: 'GROUP BY și HAVING.',
      difficulty: 'HARD',
      questions: [
        q('Ce face `GROUP BY`?', ['Grupează rânduri după o coloană', 'Unește tabele', 'Șterge rânduri', 'Sortează mereu'], 'Grupează rânduri după o coloană', 'Creezi grupuri pentru agregări.'),
        q('Diferența HAVING vs WHERE este că HAVING…', ['Filtrează după agregare', 'Filtrează înainte de agregare', 'E identic cu WHERE', 'Se folosește doar la JOIN'], 'Filtrează după agregare', 'HAVING aplică condiții pe grupuri agregate.'),
        q('Poți selecta coloane neagregate fără GROUP BY?', ['Nu, în mod corect trebuie grupate', 'Da, mereu', 'Doar în Python', 'Doar cu INSERT'], 'Nu, în mod corect trebuie grupate', 'În SQL standard trebuie să fie în GROUP BY sau agregate.')
      ]
    },
    {
      lessonId: lessons[5].id,
      title: 'Relații între Tabele (JOIN)',
      description: 'Inner, Left și Right Joins.',
      difficulty: 'HARD',
      questions: [
        q('Ce face un JOIN?', ['Combină rânduri din tabele diferite', 'Șterge tabele', 'Creează baze noi', 'Rulează cod Python'], 'Combină rânduri din tabele diferite', 'JOIN unește pe baza unei condiții.'),
        q('Ce întoarce LEFT JOIN?', ['Toate rândurile din stânga + potrivirile din dreapta', 'Doar potrivirile', 'Doar rândurile din dreapta', 'Nimic dacă nu există match'], 'Toate rândurile din stânga + potrivirile din dreapta', 'Rândurile fără match au NULL pe coloanele din dreapta.'),
        q('Ce greșeală produce “duplicări” în JOIN?', ['Condiție de join greșită (cardinalitate mare)', 'Folosirea SELECT', 'Folosirea WHERE', 'Folosirea COUNT'], 'Condiție de join greșită (cardinalitate mare)', 'Un join pe chei nepotrivite multiplică rânduri.')
      ]
    },
    {
      lessonId: lessons[5].id,
      title: 'Normalizarea',
      description: 'Cum organizăm datele eficient.',
      difficulty: 'HARD',
      questions: [
        q('Scopul normalizării este…', ['Reducerea redundanței și anomaliilor', 'Să ai mai multe duplicate', 'Să faci query-urile mereu mai lente', 'Să elimini tabelele'], 'Reducerea redundanței și anomaliilor', 'Normalizarea organizează datele logic.'),
        q('Ce este o “anomaliă de actualizare”?', ['Când trebuie să modifici aceeași informație în mai multe locuri', 'Când SELECT nu merge', 'Când ai prea multe JOIN-uri', 'Când nu ai index'], 'Când trebuie să modifici aceeași informație în mai multe locuri', 'Redundanța produce inconsistențe.'),
        q('Ce implică de obicei normalizarea?', ['Împărțirea datelor în tabele relaționate', 'Un singur tabel uriaș', 'Doar fișiere CSV', 'Doar arrays'], 'Împărțirea datelor în tabele relaționate', 'Tabele separate + chei primare/străine.')
      ]
    },
    {
      lessonId: lessons[5].id,
      title: 'SQL Master',
      description: 'Interogări complexe imbricate.',
      difficulty: 'MASTERY',
      questions: [
        q('Ce este o sub-interogare (subquery)?', ['Un SELECT în interiorul altui SELECT', 'Un INSERT care șterge', 'Un JOIN care sortează', 'Un index'], 'Un SELECT în interiorul altui SELECT', 'Subquery = query imbricat.'),
        q('Când folosești o sub-interogare?', ['Când ai nevoie de un rezultat intermediar', 'Doar când nu ai WHERE', 'Doar la UPDATE', 'Niciodată'], 'Când ai nevoie de un rezultat intermediar', 'E utilă pentru filtrări/transformări în pași.'),
        q('Ce ajută performanța la query-uri grele?', ['Indexuri pe coloane folosite în JOIN/WHERE', 'Mai multe subquery-uri random', 'Mai multe SELECT *', 'Mai multe tabele goale'], 'Indexuri pe coloane folosite în JOIN/WHERE', 'Indexurile reduc costul căutărilor.')
      ]
    },

    // Category 6: Avansați – Programare Dinamică (lessons[4])
    {
      lessonId: lessons[4].id,
      title: 'Memoization',
      description: 'Cum să nu calculezi același lucru de două ori.',
      difficulty: 'MEDIUM',
      questions: [
        q('Ce este memoization?', ['Caching al rezultatelor subproblemelor', 'Un tip de sortare', 'O bază de date', 'Un tip de loop'], 'Caching al rezultatelor subproblemelor', 'Reții rezultatele ca să eviți recalcularea.'),
        q('Ce problemă rezolvă memoization?', ['Subprobleme repetate (overlapping)', 'Indexare 1-based', 'Tipuri de date', 'IO lent'], 'Subprobleme repetate (overlapping)', 'DP apare când subproblemele se repetă.'),
        q('În ce stil DP apare des memoization?', ['Top-down', 'Bottom-up', 'SQL', 'OOP'], 'Top-down', 'Top-down folosește recursie + memo.')
      ]
    },
    {
      lessonId: lessons[4].id,
      title: 'Abordarea Top‑Down',
      description: 'Descompunerea problemelor.',
      difficulty: 'MEDIUM',
      questions: [
        q('Top-down DP pornește de la…', ['Problema mare și se sparge în subprobleme', 'Cele mai mici cazuri și urcă', 'Datele sortate', 'Baze de date'], 'Problema mare și se sparge în subprobleme', 'Top-down = recursie.'),
        q('Ce folosești în top-down ca să fie eficient?', ['Memoization', 'Bubble sort', 'JOIN', 'Inheritance'], 'Memoization', 'Fără memo, recursia poate fi exponențială.'),
        q('Ce componentă e obligatorie în recursia top-down?', ['Base case', 'SQL', 'HTML', 'Random'], 'Base case', 'Ai nevoie de oprire.')
      ]
    },
    {
      lessonId: lessons[4].id,
      title: 'Abordarea Bottom‑Up',
      description: 'Construirea soluției de la bază.',
      difficulty: 'HARD',
      questions: [
        q('Bottom-up DP pornește de la…', ['Cazurile de bază și construiește spre problemă', 'Problema mare direct', 'Un query SQL', 'Un set'], 'Cazurile de bază și construiește spre problemă', 'Bottom-up = iterație pe stări.'),
        q('Ce structură folosești frecvent în bottom-up?', ['Tabel DP (array/matrice)', 'Fișier text', 'Socket', 'Tree mereu'], 'Tabel DP (array/matrice)', 'Stochezi rezultate pentru stări.'),
        q('Un avantaj al bottom-up față de top-down este…', ['Control mai bun asupra memoriei și ordinii calculului', 'Nu ai nevoie de stări', 'E mereu O(1)', 'Nu are bucle'], 'Control mai bun asupra memoriei și ordinii calculului', 'E iterativ și previzibil.')
      ]
    },
    {
      lessonId: lessons[4].id,
      title: 'Problema Rucsacului (Knapsack)',
      description: 'Maximizarea valorii.',
      difficulty: 'HARD',
      questions: [
        q('În 0/1 Knapsack, fiecare obiect poate fi…', ['Lu(at) o singură dată sau deloc', 'Lu(at) de infinit ori', 'Sortat', 'Șters'], 'Lu(at) o singură dată sau deloc', '0/1 = nu poți repeta obiectul.'),
        q('Ce reprezintă starea DP clasică la knapsack?', ['i (primele obiecte), w (capacitate)', 'doar i', 'doar w', 'doar valoare'], 'i (primele obiecte), w (capacitate)', 'Starea depinde de câte obiecte ai considerat și capacitate.'),
        q('De ce e DP potrivit pentru knapsack?', ['Are optimal substructure', 'Nu are subprobleme', 'E doar sortare', 'E doar recursie fără stocare'], 'Are optimal substructure', 'Soluția optimă se compune din soluții optime ale subproblemelor.')
      ]
    },
    {
      lessonId: lessons[4].id,
      title: 'Cel mai lung subșir comun',
      description: 'Algoritmi pe text.',
      difficulty: 'VERY_HARD',
      questions: [
        q('LCS (Longest Common Subsequence) caută…', ['Un subșir (nu neapărat contiguu) comun', 'Un substring contiguu mereu', 'Un set de caractere', 'Un hash'], 'Un subșir (nu neapărat contiguu) comun', 'Subsequence permite să sari caractere.'),
        q('Complexitatea tipică DP pentru LCS (lungimi n și m) este…', ['O(n+m)', 'O(n*m)', 'O(log n)', 'O(n^2+m^2)'], 'O(n*m)', 'Tabelul DP are n*m celule.'),
        q('Ce stochezi în DP la LCS?', ['Lungimea LCS pentru prefixe', 'Doar caracterele unice', 'Doar poziția maximă', 'Doar sortarea'], 'Lungimea LCS pentru prefixe', 'Stările sunt prefixele celor două șiruri.')
      ]
    },
    {
      lessonId: lessons[4].id,
      title: 'Numărul de căi într‑o matrice',
      description: 'Grid traversal.',
      difficulty: 'VERY_HARD',
      questions: [
        q('Într-un grid, DP-ul calculează de obicei…', ['Numărul de moduri de a ajunge într-o celulă', 'Sortarea celulelor', 'Căutarea binară', 'JOIN între rânduri'], 'Numărul de moduri de a ajunge într-o celulă', 'Fiecare celulă depinde de vecini.'),
        q('O tranziție clasică pentru căi (dreapta/jos) este…', ['dp[i][j]=dp[i-1][j]+dp[i][j-1]', 'dp[i][j]=max(...)', 'dp[i][j]=dp[i][j]*2', 'dp[i][j]=random()'], 'dp[i][j]=dp[i-1][j]+dp[i][j-1]', 'Numărul de căi vine din sus + stânga.'),
        q('Ce condiție specială apare la obstacole?', ['dp devine 0 pe celulele blocate', 'dp devine infinit', 'dp devine -1 mereu', 'nu afectează'], 'dp devine 0 pe celulele blocate', 'Nu poți trece prin ele.')
      ]
    },
    {
      lessonId: lessons[4].id,
      title: 'Optimizarea Spațiului',
      description: 'Reducerea memoriei folosite.',
      difficulty: 'EXPERT',
      questions: [
        q('Cum optimizezi spațiul în DP când depinzi doar de “rândul anterior”?', ['Folosești un array 1D (rolling array)', 'Folosești mai multe tabele', 'Folosești recursie fără memo', 'Folosești SQL'], 'Folosești un array 1D (rolling array)', 'Păstrezi doar ce îți trebuie.'),
        q('Care e riscul la optimizarea spațiului?', ['Poți pierde posibilitatea de a reconstrui soluția ușor', 'Devine mereu mai rapid', 'Nu mai funcționează', 'Nu mai ai base case'], 'Poți pierde posibilitatea de a reconstrui soluția ușor', 'Uneori trebuie să păstrezi “drumul”.'),
        q('Când e justificată optimizarea spațiului?', ['Când n și m sunt mari și memoria e limitată', 'Când ai doar 3 elemente', 'Când nu ai bucle', 'Când ai doar stringuri'], 'Când n și m sunt mari și memoria e limitată', 'Reduci consumul de memorie semnificativ.')
      ]
    },
    {
      lessonId: lessons[4].id,
      title: 'Algoritmul Suprem',
      description: 'O problemă de concurs (stil LeetCode Hard).',
      difficulty: 'LEGENDARY',
      questions: [
        q('Când alegi DP într-un concurs?', ['Când ai optimal substructure + overlapping subproblems', 'Când vrei să folosești JOIN', 'Când problema e doar print', 'Când ai un singur caz'], 'Când ai optimal substructure + overlapping subproblems', 'Aceste două proprietăți sunt semnalul DP.'),
        q('Ce e important înainte să codezi DP?', ['Să definești starea și tranzițiile clar', 'Să începi direct cu cod', 'Să pui cât mai multe if-uri', 'Să eviți testele'], 'Să definești starea și tranzițiile clar', 'Definirea corectă a DP-ului e 80% din problemă.'),
        q('Cum validezi rapid o soluție DP?', ['Teste mici + verificare manuală + edge cases', 'Doar cu un singur input', 'Fără să rulezi', 'Doar cu print'], 'Teste mici + verificare manuală + edge cases', 'DP e sensibil la cazuri de margine.')
      ]
    }
  ];

  for (const tq of trackQuizzes) {
    const timeLimit = recommendedQuizTimeLimitSeconds(tq.questions.length, tq.difficulty);
    await upsertQuizByTitle(tq.lessonId, tq.title, tq.description, timeLimit, tq.questions);
  }

  // Seed cosmetics catalog (WBC Coins) + grant free cosmetics to all seeded users
  // Cosmetics catalog: 20 options per type (80 total).
  // Pricing model (balanced with current earning rates):
  // - COMMON: 0–120
  // - RARE: 180–320
  // - EPIC: 420–620
  // - LEGENDARY: 850–1250
  const cosmeticItems = [
    // ------------------------------
    // PROFILE_BANNER (20)
    // ------------------------------
    { code: 'banner-default-night', type: 'PROFILE_BANNER', name: 'Noapte Calmă', description: 'Un banner simplu, elegant, pe albastru închis.', priceCoins: 0, rarity: 'COMMON', metadata: { colors: ['#0b1020', '#0f172a', '#111827'] } },
    { code: 'banner-mist', type: 'PROFILE_BANNER', name: 'Ceață Arctică', description: 'Tonuri reci, discrete, pentru focus.', priceCoins: 0, rarity: 'COMMON', metadata: { colors: ['#0b1220', '#0b1f3a', '#0f172a'] } },
    { code: 'banner-nebula', type: 'PROFILE_BANNER', name: 'Nebuloasă', description: 'Gradient cosmic: albastru → indigo → mov.', priceCoins: 240, rarity: 'RARE', metadata: { colors: ['#0ea5e9', '#6366f1', '#a855f7'] } },
    { code: 'banner-sunset', type: 'PROFILE_BANNER', name: 'Apus Electric', description: 'Energie pură: roz → portocaliu → galben.', priceCoins: 520, rarity: 'EPIC', metadata: { colors: ['#ec4899', '#f97316', '#facc15'] } },
    { code: 'banner-aurora', type: 'PROFILE_BANNER', name: 'Auroră', description: 'Linii verzi și albastre ca pe cerul nordic.', priceCoins: 280, rarity: 'RARE', metadata: { colors: ['#22c55e', '#06b6d4', '#1d4ed8'] } },
    { code: 'banner-midnight-run', type: 'PROFILE_BANNER', name: 'Midnight Run', description: 'Dark blue cu accent de indigo, stealth mode.', priceCoins: 220, rarity: 'RARE', metadata: { colors: ['#020617', '#0f172a', '#1e1b4b'] } },
    { code: 'banner-matrix', type: 'PROFILE_BANNER', name: 'Matrix Pulse', description: 'Verde neon pe fundal întunecat, vibe hacker.', priceCoins: 620, rarity: 'EPIC', metadata: { colors: ['#022c22', '#064e3b', '#22c55e'] } },
    { code: 'banner-cobalt', type: 'PROFILE_BANNER', name: 'Cobalt Clean', description: 'Albastru saturat, modern și curat.', priceCoins: 200, rarity: 'RARE', metadata: { colors: ['#0b1220', '#1d4ed8', '#60a5fa'] } },
    { code: 'banner-starlight', type: 'PROFILE_BANNER', name: 'Starlight', description: 'Indigo → violet cu un aer “premium”.', priceCoins: 260, rarity: 'RARE', metadata: { colors: ['#111827', '#4f46e5', '#a855f7'] } },
    { code: 'banner-ember', type: 'PROFILE_BANNER', name: 'Jar', description: 'Portocaliu ars → roșu, pentru profiluri “hot”.', priceCoins: 420, rarity: 'EPIC', metadata: { colors: ['#7c2d12', '#ef4444', '#f97316'] } },
    { code: 'banner-ocean', type: 'PROFILE_BANNER', name: 'Ocean Adânc', description: 'Cyan → albastru, calm și profi.', priceCoins: 240, rarity: 'RARE', metadata: { colors: ['#083344', '#06b6d4', '#1d4ed8'] } },
    { code: 'banner-royal', type: 'PROFILE_BANNER', name: 'Royal Purple', description: 'Mov regal pentru cei cu pretenții.', priceCoins: 300, rarity: 'RARE', metadata: { colors: ['#1e1b4b', '#7c3aed', '#c084fc'] } },
    { code: 'banner-sakura', type: 'PROFILE_BANNER', name: 'Sakura', description: 'Roz pastel, clean și prietenos.', priceCoins: 180, rarity: 'RARE', metadata: { colors: ['#1f2937', '#f472b6', '#fecdd3'] } },
    { code: 'banner-glacier', type: 'PROFILE_BANNER', name: 'Ghețar', description: 'Albăstrui rece, minimalist.', priceCoins: 220, rarity: 'RARE', metadata: { colors: ['#0b1220', '#93c5fd', '#e0f2fe'] } },
    { code: 'banner-obsidian', type: 'PROFILE_BANNER', name: 'Obsidian', description: 'Negru-albăstrui, ultra stealth.', priceCoins: 200, rarity: 'RARE', metadata: { colors: ['#020617', '#0b1020', '#111827'] } },
    { code: 'banner-synthwave', type: 'PROFILE_BANNER', name: 'Synthwave', description: 'Vibe retro: mov → roz → cyan.', priceCoins: 580, rarity: 'EPIC', metadata: { colors: ['#4c1d95', '#ec4899', '#22d3ee'] } },
    { code: 'banner-graphite', type: 'PROFILE_BANNER', name: 'Grafit', description: 'Gri închis cu reflex albastru.', priceCoins: 180, rarity: 'RARE', metadata: { colors: ['#0b1220', '#111827', '#334155'] } },
    { code: 'banner-lava', type: 'PROFILE_BANNER', name: 'Lavă', description: 'Roșu intens pentru “challenge mode”.', priceCoins: 520, rarity: 'EPIC', metadata: { colors: ['#450a0a', '#ef4444', '#fb7185'] } },
    { code: 'banner-cyber-gold', type: 'PROFILE_BANNER', name: 'Cyber Gold', description: 'Aur + albastru: look de “VIP”.', priceCoins: 950, rarity: 'LEGENDARY', metadata: { colors: ['#0b1020', '#f59e0b', '#fde68a'] } },
    { code: 'banner-legendary-crown', type: 'PROFILE_BANNER', name: 'Coroană Legendară', description: 'Cel mai flashy banner din shop.', priceCoins: 1200, rarity: 'LEGENDARY', metadata: { colors: ['#111827', '#fbbf24', '#f97316'] } },

    // ------------------------------
    // AVATAR_FRAME (20)
    // ------------------------------
    { code: 'frame-default-ice', type: 'AVATAR_FRAME', name: 'Ramă de Gheață', description: 'O ramă rece, curată, pentru un profil “pro”.', priceCoins: 0, rarity: 'COMMON', metadata: { border: ['#60a5fa', '#a78bfa'] } },
    { code: 'frame-default-slate', type: 'AVATAR_FRAME', name: 'Ramă Slate', description: 'Minimalistă, neutră, merge cu orice.', priceCoins: 0, rarity: 'COMMON', metadata: { border: ['#334155', '#64748b'] } },
    { code: 'frame-emerald', type: 'AVATAR_FRAME', name: 'Ramă Smarald', description: 'Verde fresh, clar, modern.', priceCoins: 220, rarity: 'RARE', metadata: { border: ['#10b981', '#34d399'] } },
    { code: 'frame-royal', type: 'AVATAR_FRAME', name: 'Ramă Regală', description: 'Indigo → mov, premium vibe.', priceCoins: 260, rarity: 'RARE', metadata: { border: ['#4f46e5', '#a855f7'] } },
    { code: 'frame-sunset', type: 'AVATAR_FRAME', name: 'Ramă Apus', description: 'Portocaliu → roz, energizant.', priceCoins: 420, rarity: 'EPIC', metadata: { border: ['#f97316', '#ec4899'] } },
    { code: 'frame-cyan', type: 'AVATAR_FRAME', name: 'Ramă Cyan', description: 'Cyan neon, foarte vizibil.', priceCoins: 220, rarity: 'RARE', metadata: { border: ['#22d3ee', '#60a5fa'] } },
    { code: 'frame-ruby', type: 'AVATAR_FRAME', name: 'Ramă Rubin', description: 'Roșu intens pentru profiluri “fighter”.', priceCoins: 300, rarity: 'RARE', metadata: { border: ['#ef4444', '#fb7185'] } },
    { code: 'frame-gold-legend', type: 'AVATAR_FRAME', name: 'Ramă Legendară', description: 'Aur pur pentru cei care vor să iasă în evidență.', priceCoins: 980, rarity: 'LEGENDARY', metadata: { border: ['#fbbf24', '#f59e0b'] } },
    { code: 'frame-silver', type: 'AVATAR_FRAME', name: 'Ramă Argint', description: 'Simplu, elegant, “clean”.', priceCoins: 180, rarity: 'RARE', metadata: { border: ['#e2e8f0', '#94a3b8'] } },
    { code: 'frame-neon-lime', type: 'AVATAR_FRAME', name: 'Ramă Neon Lime', description: 'Lime neon pentru profiluri out-of-the-box.', priceCoins: 520, rarity: 'EPIC', metadata: { border: ['#84cc16', '#22c55e'] } },
    { code: 'frame-amethyst', type: 'AVATAR_FRAME', name: 'Ramă Ametist', description: 'Mov profund, elegant.', priceCoins: 240, rarity: 'RARE', metadata: { border: ['#7c3aed', '#c084fc'] } },
    { code: 'frame-ocean', type: 'AVATAR_FRAME', name: 'Ramă Ocean', description: 'Cyan → albastru, calm.', priceCoins: 240, rarity: 'RARE', metadata: { border: ['#06b6d4', '#1d4ed8'] } },
    { code: 'frame-ember', type: 'AVATAR_FRAME', name: 'Ramă Jar', description: 'Arămiu → roșu, agresiv.', priceCoins: 420, rarity: 'EPIC', metadata: { border: ['#f59e0b', '#ef4444'] } },
    { code: 'frame-night', type: 'AVATAR_FRAME', name: 'Ramă Nocturnă', description: 'Foarte dark, foarte clean.', priceCoins: 200, rarity: 'RARE', metadata: { border: ['#0b1020', '#1f2937'] } },
    { code: 'frame-synthwave', type: 'AVATAR_FRAME', name: 'Ramă Synthwave', description: 'Retro: mov → roz.', priceCoins: 580, rarity: 'EPIC', metadata: { border: ['#a855f7', '#ec4899'] } },
    { code: 'frame-aurora', type: 'AVATAR_FRAME', name: 'Ramă Aurora', description: 'Verde → cyan, nordic.', priceCoins: 320, rarity: 'RARE', metadata: { border: ['#22c55e', '#22d3ee'] } },
    { code: 'frame-carbon', type: 'AVATAR_FRAME', name: 'Ramă Carbon', description: 'Gri închis, stealth.', priceCoins: 180, rarity: 'RARE', metadata: { border: ['#111827', '#334155'] } },
    { code: 'frame-candy', type: 'AVATAR_FRAME', name: 'Ramă Candy', description: 'Roz pastel, prietenos.', priceCoins: 220, rarity: 'RARE', metadata: { border: ['#fb7185', '#fecdd3'] } },
    { code: 'frame-champion', type: 'AVATAR_FRAME', name: 'Ramă Campion', description: 'Aur + indigo, foarte premium.', priceCoins: 1100, rarity: 'LEGENDARY', metadata: { border: ['#fbbf24', '#4f46e5'] } },
    { code: 'frame-obsidian', type: 'AVATAR_FRAME', name: 'Ramă Obsidian', description: 'Negru-albăstrui, ultra stealth.', priceCoins: 260, rarity: 'RARE', metadata: { border: ['#020617', '#0f172a'] } },

    // ------------------------------
    // PROFILE_THEME (20)
    // ------------------------------
    { code: 'theme-default-blue', type: 'PROFILE_THEME', name: 'Accent Albastru', description: 'Accent clasic albastru pentru butoane și highlights.', priceCoins: 0, rarity: 'COMMON', metadata: { accent: '#60a5fa' } },
    { code: 'theme-default-violet', type: 'PROFILE_THEME', name: 'Accent Violet', description: 'Violet discret, super modern.', priceCoins: 0, rarity: 'COMMON', metadata: { accent: '#a78bfa' } },
    { code: 'theme-emerald', type: 'PROFILE_THEME', name: 'Accent Smarald', description: 'Un accent fresh, verde smarald.', priceCoins: 220, rarity: 'RARE', metadata: { accent: '#34d399' } },
    { code: 'theme-amber', type: 'PROFILE_THEME', name: 'Accent Chihlimbar', description: 'Auriu cald, “premium”.', priceCoins: 240, rarity: 'RARE', metadata: { accent: '#fbbf24' } },
    { code: 'theme-rose', type: 'PROFILE_THEME', name: 'Accent Roz', description: 'Roz energic, perfect pentru highlight.', priceCoins: 240, rarity: 'RARE', metadata: { accent: '#fb7185' } },
    { code: 'theme-cyan', type: 'PROFILE_THEME', name: 'Accent Cyan', description: 'Cyan clar, foarte vizibil.', priceCoins: 240, rarity: 'RARE', metadata: { accent: '#22d3ee' } },
    { code: 'theme-indigo', type: 'PROFILE_THEME', name: 'Accent Indigo', description: 'Indigo deep, modern.', priceCoins: 260, rarity: 'RARE', metadata: { accent: '#6366f1' } },
    { code: 'theme-lime', type: 'PROFILE_THEME', name: 'Accent Lime', description: 'Lime neon, vibe “hacker”.', priceCoins: 520, rarity: 'EPIC', metadata: { accent: '#84cc16' } },
    { code: 'theme-red', type: 'PROFILE_THEME', name: 'Accent Roșu', description: 'Roșu intens, “challenge”.', priceCoins: 280, rarity: 'RARE', metadata: { accent: '#ef4444' } },
    { code: 'theme-orange', type: 'PROFILE_THEME', name: 'Accent Portocaliu', description: 'Portocaliu cald, energic.', priceCoins: 260, rarity: 'RARE', metadata: { accent: '#f97316' } },
    { code: 'theme-purple-epic', type: 'PROFILE_THEME', name: 'Purple Epic', description: 'Mov puternic pentru un look “wow”.', priceCoins: 580, rarity: 'EPIC', metadata: { accent: '#a855f7' } },
    { code: 'theme-sky', type: 'PROFILE_THEME', name: 'Accent Sky', description: 'Sky blue, clean și proaspăt.', priceCoins: 220, rarity: 'RARE', metadata: { accent: '#38bdf8' } },
    { code: 'theme-teal', type: 'PROFILE_THEME', name: 'Accent Teal', description: 'Teal calm, echilibrat.', priceCoins: 240, rarity: 'RARE', metadata: { accent: '#14b8a6' } },
    { code: 'theme-fuchsia', type: 'PROFILE_THEME', name: 'Accent Fuchsia', description: 'Fuchsia puternic, foarte stylish.', priceCoins: 520, rarity: 'EPIC', metadata: { accent: '#d946ef' } },
    { code: 'theme-slate', type: 'PROFILE_THEME', name: 'Accent Slate', description: 'Neutru, elegant, super clean.', priceCoins: 180, rarity: 'RARE', metadata: { accent: '#94a3b8' } },
    { code: 'theme-gold-legend', type: 'PROFILE_THEME', name: 'Aur Legendar', description: 'Accent “VIP” — rar și flashy.', priceCoins: 980, rarity: 'LEGENDARY', metadata: { accent: '#f59e0b' } },
    { code: 'theme-mint', type: 'PROFILE_THEME', name: 'Accent Mentă', description: 'Verde mentă, relaxat.', priceCoins: 220, rarity: 'RARE', metadata: { accent: '#6ee7b7' } },
    { code: 'theme-lavender', type: 'PROFILE_THEME', name: 'Accent Lavandă', description: 'Lavandă soft, premium.', priceCoins: 240, rarity: 'RARE', metadata: { accent: '#c4b5fd' } },
    { code: 'theme-graphite', type: 'PROFILE_THEME', name: 'Accent Grafit', description: 'Dark neutral, stealth vibe.', priceCoins: 200, rarity: 'RARE', metadata: { accent: '#64748b' } },
    { code: 'theme-neon-cyber', type: 'PROFILE_THEME', name: 'Neon Cyber', description: 'Accent super vivid, “late game”.', priceCoins: 850, rarity: 'LEGENDARY', metadata: { accent: '#22c55e' } },

    // ------------------------------
    // TITLE (20)  (name = actual displayed title)
    // ------------------------------
    { code: 'title-coder-incepator', type: 'TITLE', name: 'Coder Începător', description: 'Un titlu simplu, perfect pentru start.', priceCoins: 0, rarity: 'COMMON', metadata: { value: 'Coder Începător' } },
    { code: 'title-depanator-de-buguri', type: 'TITLE', name: 'Depanator de Bug-uri', description: 'Nu pleci până nu e verde.', priceCoins: 90, rarity: 'COMMON', metadata: { value: 'Depanator de Bug-uri' } },
    { code: 'title-ucenic-algoritmi', type: 'TITLE', name: 'Ucenic în Algoritmi', description: 'Îți place să înțelegi “de ce”.', priceCoins: 90, rarity: 'COMMON', metadata: { value: 'Ucenic în Algoritmi' } },
    { code: 'title-architect-de-logica', type: 'TITLE', name: 'Arhitect de Logică', description: 'Pentru cei care gândesc înainte să scrie cod.', priceCoins: 220, rarity: 'RARE', metadata: { value: 'Arhitect de Logică' } },
    { code: 'title-vrajitor-python', type: 'TITLE', name: 'Vrăjitor Python', description: 'Cu o linie de cod, faci magie.', priceCoins: 260, rarity: 'RARE', metadata: { value: 'Vrăjitor Python' } },
    { code: 'title-vanator-de-xp', type: 'TITLE', name: 'Vânător de XP', description: 'Îți place progresul vizibil.', priceCoins: 120, rarity: 'COMMON', metadata: { value: 'Vânător de XP' } },
    { code: 'title-samurai-de-conditii', type: 'TITLE', name: 'Samurai de Condiții', description: 'If/Else? Le tai dintr-o mișcare.', priceCoins: 180, rarity: 'RARE', metadata: { value: 'Samurai de Condiții' } },
    { code: 'title-inginer-de-date', type: 'TITLE', name: 'Inginer de Date', description: 'Liste, șiruri, structuri — totul la locul lui.', priceCoins: 220, rarity: 'RARE', metadata: { value: 'Inginer de Date' } },
    { code: 'title-ucenic-recursiv', type: 'TITLE', name: 'Ucenic Recursiv', description: 'Îți place să te chemi pe tine însuți.', priceCoins: 180, rarity: 'RARE', metadata: { value: 'Ucenic Recursiv' } },
    { code: 'title-stapan-recursivitate', type: 'TITLE', name: 'Stăpânul Recursivității', description: 'Call stack? Îl ții în palmă.', priceCoins: 520, rarity: 'EPIC', metadata: { value: 'Stăpânul Recursivității' } },
    { code: 'title-paladin-oop', type: 'TITLE', name: 'Paladin OOP', description: 'Clasele sunt armura ta.', priceCoins: 260, rarity: 'RARE', metadata: { value: 'Paladin OOP' } },
    { code: 'title-maestru-oop', type: 'TITLE', name: 'Maestru OOP', description: 'Încapsulare, moștenire, polimorfism — check.', priceCoins: 520, rarity: 'EPIC', metadata: { value: 'Maestru OOP' } },
    { code: 'title-operator-sql', type: 'TITLE', name: 'Operator SQL', description: 'SELECT… WHERE… și e gata.', priceCoins: 220, rarity: 'RARE', metadata: { value: 'Operator SQL' } },
    { code: 'title-oracol-sql', type: 'TITLE', name: 'Oracol SQL', description: 'Interogări imbricate? Le mănânci la mic dejun.', priceCoins: 580, rarity: 'EPIC', metadata: { value: 'Oracol SQL' } },
    { code: 'title-dp-strateg', type: 'TITLE', name: 'Strateg DP', description: 'Găsești starea perfectă.', priceCoins: 520, rarity: 'EPIC', metadata: { value: 'Strateg DP' } },
    { code: 'title-memorie-de-elefant', type: 'TITLE', name: 'Memorie de Elefant', description: 'Memoization all the way.', priceCoins: 320, rarity: 'RARE', metadata: { value: 'Memorie de Elefant' } },
    { code: 'title-speedrunner', type: 'TITLE', name: 'Speedrunner', description: 'Timpul e dușmanul tău preferat.', priceCoins: 420, rarity: 'EPIC', metadata: { value: 'Speedrunner' } },
    { code: 'title-campion-leaderboard', type: 'TITLE', name: 'Campion de Leaderboard', description: 'Țintești topul. Mereu.', priceCoins: 620, rarity: 'EPIC', metadata: { value: 'Campion de Leaderboard' } },
    { code: 'title-legend-of-wbcode', type: 'TITLE', name: 'Legenda WBCode', description: 'Titlul suprem pentru profiluri “final boss”.', priceCoins: 1250, rarity: 'LEGENDARY', metadata: { value: 'Legenda WBCode' } },
    { code: 'title-aur-vip', type: 'TITLE', name: 'VIP Aur', description: 'Un titlu rar, pentru cei care vor să strălucească.', priceCoins: 980, rarity: 'LEGENDARY', metadata: { value: 'VIP Aur' } }
  ] as const;

  for (const item of cosmeticItems) {
    await prisma.cosmeticItem.upsert({
      where: { code: item.code },
      update: {
        type: item.type as any,
        name: item.name,
        description: item.description,
        priceCoins: item.priceCoins,
        rarity: item.rarity,
        metadata: item.metadata as any
      },
      create: {
        code: item.code,
        type: item.type as any,
        name: item.name,
        description: item.description,
        priceCoins: item.priceCoins,
        rarity: item.rarity,
        metadata: item.metadata as any
      }
    });
  }

  const allSeedUsers = [admin, professor, ...students];
  const freeCosmetics = await prisma.cosmeticItem.findMany({ where: { priceCoins: 0 } });
  for (const u of allSeedUsers) {
    for (const c of freeCosmetics) {
      await prisma.cosmeticOwnership.upsert({
        where: { userId_cosmeticId: { userId: u.id, cosmeticId: c.id } },
        update: {},
        create: { userId: u.id, cosmeticId: c.id }
      });
    }

    // Equip defaults if not set
    const defaultsByType: Record<string, string> = {
      PROFILE_BANNER: 'banner-default-night',
      AVATAR_FRAME: 'frame-default-ice',
      PROFILE_THEME: 'theme-default-blue'
    };

    for (const [type, code] of Object.entries(defaultsByType)) {
      const cosmetic = await prisma.cosmeticItem.findUnique({ where: { code } });
      if (!cosmetic) continue;
      await prisma.cosmeticEquip.upsert({
        where: { userId_type: { userId: u.id, type: type as any } },
        update: { cosmeticId: cosmetic.id },
        create: { userId: u.id, type: type as any, cosmeticId: cosmetic.id }
      });
    }
  }

  // NOTE: Avoid deleting seeded CodeLab exercises by default because they are referenced
  // by submissions/challenges/missions in real environments. If you really want a reset,
  // run with RESET_CODELAB=true and ensure dependent tables are cleared first.
  const RESET_CODELAB = process.env.RESET_CODELAB === 'true';
  if (RESET_CODELAB) {
    console.log('[seed] RESET_CODELAB=true -> attempting to delete seeded CodeLab exercises');
    await prisma.codingExercise.deleteMany({
      where: { title: { startsWith: '[Seed] CodeLab #' } }
    });
  } else {
    console.log('[seed] Skipping CodeLab exercise deletion (set RESET_CODELAB=true to force).');
  }

  // 20 probleme EASY
  const easyProblems = [
    {
      title: '[Seed] CodeLab #1: Suma a două numere',
      prompt: 'Scrie o funcție care primește două numere și returnează suma lor.',
      starterCode: 'def suma(a, b):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    a = int(input())\n    b = int(input())\n    print(suma(a, b))',
      difficulty: 'Easy',
      inputSpec: 'Două numere întregi, câte unul pe linie.',
      outputSpec: 'Suma celor două numere.'
    },
    {
      title: '[Seed] CodeLab #2: Număr par sau impar',
      prompt: 'Verifică dacă un număr este par sau impar. Returnează "par" sau "impar".',
      starterCode: 'def par_impar(n):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    print(par_impar(n))',
      difficulty: 'Easy',
      inputSpec: 'Un număr întreg n.',
      outputSpec: '"par" sau "impar".'
    },
    {
      title: '[Seed] CodeLab #3: Cel mai mare dintre trei',
      prompt: 'Găsește cel mai mare număr dintre trei numere date.',
      starterCode: 'def maxim(a, b, c):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    a = int(input())\n    b = int(input())\n    c = int(input())\n    print(maxim(a, b, c))',
      difficulty: 'Easy',
      inputSpec: 'Trei numere întregi, câte unul pe linie.',
      outputSpec: 'Cel mai mare număr.'
    },
    {
      title: '[Seed] CodeLab #4: Factorial',
      prompt: 'Calculează factorialul unui număr n (n! = 1 * 2 * 3 * ... * n).',
      starterCode: 'def factorial(n):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    print(factorial(n))',
      difficulty: 'Easy',
      inputSpec: 'Un număr întreg n (0 <= n <= 10).',
      outputSpec: 'Factorialul lui n.'
    },
    {
      title: '[Seed] CodeLab #5: Inversarea unui șir',
      prompt: 'Inversează un șir de caractere. Exemplu: "hello" -> "olleh".',
      starterCode: 'def inversare(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(inversare(s))',
      difficulty: 'Easy',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Șirul inversat.'
    },
    {
      title: '[Seed] CodeLab #6: Numărul de vocale',
      prompt: 'Numără câte vocale (a, e, i, o, u) sunt într-un șir.',
      starterCode: 'def numar_vocale(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(numar_vocale(s))',
      difficulty: 'Easy',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Numărul de vocale.'
    },
    {
      title: '[Seed] CodeLab #7: Suma elementelor unei liste',
      prompt: 'Calculează suma tuturor elementelor dintr-o listă de numere.',
      starterCode: 'def suma_lista(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(suma_lista(lst))',
      difficulty: 'Easy',
      inputSpec: 'Prima linie: n (numărul de elemente). Următoarele n linii: elementele listei.',
      outputSpec: 'Suma elementelor.'
    },
    {
      title: '[Seed] CodeLab #8: Verificare palindrom',
      prompt: 'Verifică dacă un șir este palindrom (se citește la fel de la stânga la dreapta și invers).',
      starterCode: 'def este_palindrom(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print("DA" if este_palindrom(s) else "NU")',
      difficulty: 'Easy',
      inputSpec: 'Un șir de caractere.',
      outputSpec: '"DA" dacă este palindrom, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #9: Numărul de cifre',
      prompt: 'Numără câte cifre are un număr întreg.',
      starterCode: 'def numar_cifre(n):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    print(numar_cifre(n))',
      difficulty: 'Easy',
      inputSpec: 'Un număr întreg n.',
      outputSpec: 'Numărul de cifre.'
    },
    {
      title: '[Seed] CodeLab #10: Media aritmetică',
      prompt: 'Calculează media aritmetică a unei liste de numere.',
      starterCode: 'def media(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(media(lst))',
      difficulty: 'Easy',
      inputSpec: 'Prima linie: n. Următoarele n linii: numerele.',
      outputSpec: 'Media aritmetică (cu 2 zecimale).'
    },
    {
      title: '[Seed] CodeLab #11: Cel mai mic element',
      prompt: 'Găsește cel mai mic element dintr-o listă de numere.',
      starterCode: 'def minim(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(minim(lst))',
      difficulty: 'Easy',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Cel mai mic element.'
    },
    {
      title: '[Seed] CodeLab #12: Numerele pare dintr-o listă',
      prompt: 'Returnează o listă cu toate numerele pare dintr-o listă dată.',
      starterCode: 'def numere_pare(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(numere_pare(lst))',
      difficulty: 'Easy',
      inputSpec: 'Prima linie: n. Următoarele n linii: numerele.',
      outputSpec: 'Lista cu numerele pare, separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #13: Puterea unui număr',
      prompt: 'Calculează a^b (a la puterea b) fără să folosești operatorul **.',
      starterCode: 'def putere(a, b):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    a = int(input())\n    b = int(input())\n    print(putere(a, b))',
      difficulty: 'Easy',
      inputSpec: 'Două numere întregi: a și b (b >= 0).',
      outputSpec: 'a^b.'
    },
    {
      title: '[Seed] CodeLab #14: Numărul de apariții',
      prompt: 'Numără de câte ori apare un element într-o listă.',
      starterCode: 'def numar_aparitii(lst, x):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    x = int(input())\n    print(numar_aparitii(lst, x))',
      difficulty: 'Easy',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele. Ultima linie: x (elementul căutat).',
      outputSpec: 'Numărul de apariții ale lui x.'
    },
    {
      title: '[Seed] CodeLab #15: Verificare număr prim',
      prompt: 'Verifică dacă un număr este prim.',
      starterCode: 'def este_prim(n):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    print("DA" if este_prim(n) else "NU")',
      difficulty: 'Easy',
      inputSpec: 'Un număr întreg n (n > 1).',
      outputSpec: '"DA" dacă este prim, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #16: Șirul Fibonacci până la n',
      prompt: 'Generează șirul Fibonacci până la al n-lea termen.',
      starterCode: 'def fibonacci(n):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    print(fibonacci(n))',
      difficulty: 'Easy',
      inputSpec: 'Un număr întreg n (n >= 1).',
      outputSpec: 'Primii n termeni din șirul Fibonacci, separați prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #17: Eliminarea duplicatelor',
      prompt: 'Elimină duplicatele dintr-o listă, păstrând ordinea inițială.',
      starterCode: 'def elimina_duplicate(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(elimina_duplicate(lst))',
      difficulty: 'Easy',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Lista fără duplicate, separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #18: Numărul de cuvinte',
      prompt: 'Numără câte cuvinte sunt într-un șir (cuvintele sunt separate prin spații).',
      starterCode: 'def numar_cuvinte(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(numar_cuvinte(s))',
      difficulty: 'Easy',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Numărul de cuvinte.'
    },
    {
      title: '[Seed] CodeLab #19: Verificare an bisect',
      prompt: 'Verifică dacă un an este bisect.',
      starterCode: 'def an_bisect(an):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    an = int(input())\n    print("DA" if an_bisect(an) else "NU")',
      difficulty: 'Easy',
      inputSpec: 'Un an (număr întreg).',
      outputSpec: '"DA" dacă este bisect, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #20: Sortare crescătoare',
      prompt: 'Sortează o listă de numere în ordine crescătoare.',
      starterCode: 'def sorteaza(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(sorteaza(lst))',
      difficulty: 'Easy',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Lista sortată, elemente separate prin spațiu.'
    }
  ];

  // 20 probleme MEDIUM
  const mediumProblems = [
    {
      title: '[Seed] CodeLab #21: Căutare binară',
      prompt: 'Implementează căutarea binară într-o listă sortată. Returnează indexul elementului sau -1 dacă nu există.',
      starterCode: 'def cautare_binara(lst, x):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    x = int(input())\n    print(cautare_binara(lst, x))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: lista sortată. Ultima linie: x (elementul căutat).',
      outputSpec: 'Indexul elementului sau -1.'
    },
    {
      title: '[Seed] CodeLab #22: Sortare rapidă (Quick Sort)',
      prompt: 'Implementează algoritmul Quick Sort pentru a sorta o listă.',
      starterCode: 'def quick_sort(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(quick_sort(lst))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Lista sortată, elemente separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #23: Cel mai lung subșir comun',
      prompt: 'Găsește lungimea celui mai lung subșir comun între două șiruri.',
      starterCode: 'def subșir_comun(s1, s2):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s1 = input()\n    s2 = input()\n    print(subșir_comun(s1, s2))',
      difficulty: 'Medium',
      inputSpec: 'Două șiruri de caractere, câte unul pe linie.',
      outputSpec: 'Lungimea celui mai lung subșir comun.'
    },
    {
      title: '[Seed] CodeLab #24: Validare paranteze',
      prompt: 'Verifică dacă o expresie cu paranteze este validă (parantezele sunt închise corect).',
      starterCode: 'def paranteze_valide(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print("DA" if paranteze_valide(s) else "NU")',
      difficulty: 'Medium',
      inputSpec: 'Un șir care conține paranteze: (, ), [, ], {, }.',
      outputSpec: '"DA" dacă este valid, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #25: Numărul de subșiruri distincte',
      prompt: 'Numără câte subșiruri distincte are un șir dat.',
      starterCode: 'def subșiruri_distincte(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(subșiruri_distincte(s))',
      difficulty: 'Medium',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Numărul de subșiruri distincte.'
    },
    {
      title: '[Seed] CodeLab #26: Rotirea unei liste',
      prompt: 'Rotește o listă cu k poziții la stânga. Exemplu: [1,2,3,4,5] cu k=2 -> [3,4,5,1,2].',
      starterCode: 'def roteste(lst, k):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    k = int(input())\n    print(roteste(lst, k))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele. Ultima linie: k (numărul de rotații).',
      outputSpec: 'Lista rotită, elemente separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #27: Găsirea elementului majoritar',
      prompt: 'Găsește elementul care apare de mai mult de n/2 ori într-o listă (dacă există).',
      starterCode: 'def element_majoritar(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    result = element_majoritar(lst)\n    print(result if result is not None else "NU")',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Elementul majoritar sau "NU" dacă nu există.'
    },
    {
      title: '[Seed] CodeLab #28: Suma maximă a subșirului',
      prompt: 'Găsește suma maximă a unui subșir continuu dintr-o listă (Kadane\'s algorithm).',
      starterCode: 'def suma_maxima(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(suma_maxima(lst))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei (pot fi negative).',
      outputSpec: 'Suma maximă a unui subșir continuu.'
    },
    {
      title: '[Seed] CodeLab #29: Gruparea anagramelor',
      prompt: 'Gruphează cuvintele care sunt anagrame unul altuia.',
      starterCode: 'def grupeaza_anagrame(cuvinte):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    cuvinte = [input() for _ in range(n)]\n    print(grupeaza_anagrame(cuvinte))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: cuvintele.',
      outputSpec: 'Grupurile de anagrame, fiecare grup pe o linie, cuvinte separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #30: Cel mai lung palindrom',
      prompt: 'Găsește cel mai lung subșir palindrom dintr-un șir dat.',
      starterCode: 'def palindrom_maxim(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(palindrom_maxim(s))',
      difficulty: 'Medium',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Cel mai lung subșir palindrom.'
    },
    {
      title: '[Seed] CodeLab #31: Merge două liste sortate',
      prompt: 'Combină două liste sortate într-o singură listă sortată.',
      starterCode: 'def merge(lst1, lst2):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n1 = int(input())\n    lst1 = [int(input()) for _ in range(n1)]\n    n2 = int(input())\n    lst2 = [int(input()) for _ in range(n2)]\n    print(merge(lst1, lst2))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n1. Următoarele n1 linii: prima listă sortată. Apoi n2 și a doua listă sortată.',
      outputSpec: 'Lista combinată și sortată, elemente separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #32: Numărul de insule',
      prompt: 'Într-o matrice binară (0 și 1), numără câte "insule" de 1 există (zone conectate de 1).',
      starterCode: 'def numar_insule(matrice):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    m = int(input())\n    matrice = [[int(x) for x in input().split()] for _ in range(n)]\n    print(numar_insule(matrice))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n (rânduri). A doua linie: m (coloane). Următoarele n linii: matricea.',
      outputSpec: 'Numărul de insule.'
    },
    {
      title: '[Seed] CodeLab #33: Permutări',
      prompt: 'Generează toate permutările unei liste de numere.',
      starterCode: 'def permutari(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    for perm in permutari(lst):\n        print(" ".join(map(str, perm)))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Toate permutările, fiecare pe o linie, elemente separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #34: Validare parolă',
      prompt: 'Verifică dacă o parolă este validă: minim 8 caractere, cel puțin o literă mare, o literă mică, o cifră și un caracter special.',
      starterCode: 'def parola_valida(parola):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    parola = input()\n    print("DA" if parola_valida(parola) else "NU")',
      difficulty: 'Medium',
      inputSpec: 'Un șir reprezentând parola.',
      outputSpec: '"DA" dacă este validă, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #35: Compresia șirului',
      prompt: 'Comprimă un șir: "aaabbc" -> "a3b2c1". Dacă compresia nu este mai scurtă, returnează șirul original.',
      starterCode: 'def comprima(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(comprima(s))',
      difficulty: 'Medium',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Șirul comprimat sau original dacă compresia nu este mai scurtă.'
    },
    {
      title: '[Seed] CodeLab #36: Găsirea perechilor cu sumă dată',
      prompt: 'Găsește toate perechile de numere dintr-o listă care au suma egală cu un număr dat.',
      starterCode: 'def perechi_cu_suma(lst, suma):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    suma = int(input())\n    perechi = perechi_cu_suma(lst, suma)\n    for a, b in perechi:\n        print(f"{a} {b}")',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele. Ultima linie: suma țintă.',
      outputSpec: 'Perechile (a, b) cu a + b = suma, fiecare pe o linie.'
    },
    {
      title: '[Seed] CodeLab #37: Cel mai lung subșir fără caractere repetate',
      prompt: 'Găsește lungimea celui mai lung subșir dintr-un șir care nu conține caractere repetate.',
      starterCode: 'def subșir_fără_repetări(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(subșir_fără_repetări(s))',
      difficulty: 'Medium',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Lungimea celui mai lung subșir fără repetări.'
    },
    {
      title: '[Seed] CodeLab #38: Sortare după frecvență',
      prompt: 'Sortează elementele unei liste după frecvența lor (cel mai frecvent primul).',
      starterCode: 'def sorteaza_dupa_frecventa(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(sorteaza_dupa_frecventa(lst))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Lista sortată după frecvență, elemente separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #39: Validare număr de telefon',
      prompt: 'Verifică dacă un număr de telefon românesc este valid (format: +40XXXXXXXXXX sau 0XXXXXXXXX).',
      starterCode: 'def telefon_valid(telefon):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    telefon = input()\n    print("DA" if telefon_valid(telefon) else "NU")',
      difficulty: 'Medium',
      inputSpec: 'Un șir reprezentând numărul de telefon.',
      outputSpec: '"DA" dacă este valid, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #40: Găsirea celui de-al k-lea element',
      prompt: 'Găsește al k-lea cel mai mare element dintr-o listă (fără să sortezi întreaga listă).',
      starterCode: 'def al_k_lea_element(lst, k):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    k = int(input())\n    print(al_k_lea_element(lst, k))',
      difficulty: 'Medium',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele. Ultima linie: k.',
      outputSpec: 'Al k-lea cel mai mare element.'
    }
  ];

  // 20 probleme HARD
  const hardProblems = [
    {
      title: '[Seed] CodeLab #41: Problema rucsacului (Knapsack)',
      prompt: 'Rezolvă problema rucsacului 0/1: ai n obiecte cu greutăți și valori. Găsește valoarea maximă care poate fi transportată cu greutatea maximă W.',
      starterCode: 'def rucsac(greutati, valori, W):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    greutati = [int(input()) for _ in range(n)]\n    valori = [int(input()) for _ in range(n)]\n    W = int(input())\n    print(rucsac(greutati, valori, W))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: greutățile. Apoi n linii: valorile. Ultima linie: W.',
      outputSpec: 'Valoarea maximă care poate fi transportată.'
    },
    {
      title: '[Seed] CodeLab #42: Cel mai lung subșir crescător',
      prompt: 'Găsește lungimea celui mai lung subșir strict crescător dintr-o listă (nu neapărat continuu).',
      starterCode: 'def subșir_crescător(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(subșir_crescător(lst))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Lungimea celui mai lung subșir crescător.'
    },
    {
      title: '[Seed] CodeLab #43: Edit Distance (Levenshtein)',
      prompt: 'Calculează distanța de editare minimă între două șiruri (numărul minim de operații: inserare, ștergere, substituție).',
      starterCode: 'def distanta_editare(s1, s2):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s1 = input()\n    s2 = input()\n    print(distanta_editare(s1, s2))',
      difficulty: 'Hard',
      inputSpec: 'Două șiruri de caractere, câte unul pe linie.',
      outputSpec: 'Distanța de editare minimă.'
    },
    {
      title: '[Seed] CodeLab #44: Problema comis-voiajorului (TSP)',
      prompt: 'Găsește cel mai scurt drum care vizitează toate orașele exact o dată și se întoarce la start (versiune simplificată: maxim 10 orașe).',
      starterCode: 'def comis_voiajor(distante):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    distante = [[int(x) for x in input().split()] for _ in range(n)]\n    print(comis_voiajor(distante))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n (numărul de orașe). Următoarele n linii: matricea de distanțe.',
      outputSpec: 'Lungimea celui mai scurt drum.'
    },
    {
      title: '[Seed] CodeLab #45: Numărul de arbori de acoperire',
      prompt: 'Calculează numărul de arbori de acoperire minimi într-un graf (folosind teorema lui Kirchhoff).',
      starterCode: 'def numar_arbori(graf):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    graf = [[int(x) for x in input().split()] for _ in range(n)]\n    print(numar_arbori(graf))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n (numărul de noduri). Următoarele n linii: matricea de adiacență.',
      outputSpec: 'Numărul de arbori de acoperire minimi.'
    },
    {
      title: '[Seed] CodeLab #46: Problema sumei subset-urilor',
      prompt: 'Verifică dacă există un subset dintr-o listă care are suma egală cu un număr dat.',
      starterCode: 'def suma_subset(lst, suma):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    suma = int(input())\n    print("DA" if suma_subset(lst, suma) else "NU")',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele. Ultima linie: suma țintă.',
      outputSpec: '"DA" dacă există subset, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #47: Algoritmul lui Dijkstra',
      prompt: 'Implementează algoritmul lui Dijkstra pentru a găsi cea mai scurtă cale între două noduri într-un graf ponderat.',
      starterCode: 'def dijkstra(graf, start, end):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    graf = [[int(x) for x in input().split()] for _ in range(n)]\n    start = int(input())\n    end = int(input())\n    print(dijkstra(graf, start, end))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: matricea de adiacență. Ultimele 2 linii: nodul start și nodul end.',
      outputSpec: 'Distanța minimă de la start la end sau -1 dacă nu există cale.'
    },
    {
      title: '[Seed] CodeLab #48: Problema colorării grafurilor',
      prompt: 'Găsește numărul minim de culori necesare pentru a colora un graf astfel încât două noduri adiacente să nu aibă aceeași culoare.',
      starterCode: 'def colorare_graf(graf):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    graf = [[int(x) for x in input().split()] for _ in range(n)]\n    print(colorare_graf(graf))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: matricea de adiacență.',
      outputSpec: 'Numărul minim de culori necesare.'
    },
    {
      title: '[Seed] CodeLab #49: Problema reginelor (N-Queens)',
      prompt: 'Găsește numărul de soluții pentru problema reginelor pe o tablă de șah n×n.',
      starterCode: 'def regine(n):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    print(regine(n))',
      difficulty: 'Hard',
      inputSpec: 'Un număr întreg n (dimensiunea tablei, n <= 10).',
      outputSpec: 'Numărul de soluții.'
    },
    {
      title: '[Seed] CodeLab #50: Cel mai lung palindrom subșir (DP)',
      prompt: 'Găsește cel mai lung subșir palindrom dintr-un șir folosind programare dinamică.',
      starterCode: 'def palindrom_maxim_dp(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(palindrom_maxim_dp(s))',
      difficulty: 'Hard',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Cel mai lung subșir palindrom.'
    },
    {
      title: '[Seed] CodeLab #51: Problema coin change',
      prompt: 'Găsește numărul minim de monede necesare pentru a forma o sumă dată (fiecare monedă poate fi folosită de oricâte ori).',
      starterCode: 'def coin_change(monede, suma):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    monede = [int(input()) for _ in range(n)]\n    suma = int(input())\n    print(coin_change(monede, suma))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n (numărul de tipuri de monede). Următoarele n linii: valorile monedelor. Ultima linie: suma țintă.',
      outputSpec: 'Numărul minim de monede sau -1 dacă nu este posibil.'
    },
    {
      title: '[Seed] CodeLab #52: Problema subșirului comun cel mai lung',
      prompt: 'Găsește lungimea celui mai lung subșir comun (LCS) între două șiruri folosind programare dinamică.',
      starterCode: 'def lcs(s1, s2):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s1 = input()\n    s2 = input()\n    print(lcs(s1, s2))',
      difficulty: 'Hard',
      inputSpec: 'Două șiruri de caractere, câte unul pe linie.',
      outputSpec: 'Lungimea celui mai lung subșir comun.'
    },
    {
      title: '[Seed] CodeLab #53: Problema partiției',
      prompt: 'Verifică dacă o listă poate fi împărțită în două subset-uri cu sume egale.',
      starterCode: 'def partitie_egala(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print("DA" if partitie_egala(lst) else "NU")',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: '"DA" dacă este posibil, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #54: Problema word break',
      prompt: 'Verifică dacă un șir poate fi împărțit în cuvinte dintr-un dicționar dat.',
      starterCode: 'def word_break(s, dictionar):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    n = int(input())\n    dictionar = [input() for _ in range(n)]\n    print("DA" if word_break(s, dictionar) else "NU")',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: șirul. A doua linie: n (numărul de cuvinte). Următoarele n linii: cuvintele din dicționar.',
      outputSpec: '"DA" dacă este posibil, "NU" altfel.'
    },
    {
      title: '[Seed] CodeLab #55: Problema interclasării k liste sortate',
      prompt: 'Interclasează k liste sortate într-o singură listă sortată eficient.',
      starterCode: 'def interclaseaza_k_liste(liste):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    k = int(input())\n    liste = []\n    for _ in range(k):\n        n = int(input())\n        lst = [int(input()) for _ in range(n)]\n        liste.append(lst)\n    print(interclaseaza_k_liste(liste))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: k. Pentru fiecare listă: n (dimensiunea) și apoi n elemente.',
      outputSpec: 'Lista interclasată, elemente separate prin spațiu.'
    },
    {
      title: '[Seed] CodeLab #56: Problema trap-ului de apă',
      prompt: 'Calculează câtă apă poate fi reținută între "ziduri" reprezentate de înălțimi într-un vector.',
      starterCode: 'def apa_trap(inaltimi):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    inaltimi = [int(input()) for _ in range(n)]\n    print(apa_trap(inaltimi))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: înălțimile.',
      outputSpec: 'Cantitatea totală de apă reținută.'
    },
    {
      title: '[Seed] CodeLab #57: Problema celei mai lungi secvențe consecutive',
      prompt: 'Găsește lungimea celei mai lungi secvențe consecutive de numere dintr-o listă nesortată.',
      starterCode: 'def secventa_consecutiva(lst):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    print(secventa_consecutiva(lst))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele listei.',
      outputSpec: 'Lungimea celei mai lungi secvențe consecutive.'
    },
    {
      title: '[Seed] CodeLab #58: Problema subșirului cu suma maximă (2D)',
      prompt: 'Găsește suma maximă a unui subșir dintr-o matrice 2D.',
      starterCode: 'def suma_maxima_2d(matrice):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    m = int(input())\n    matrice = [[int(x) for x in input().split()] for _ in range(n)]\n    print(suma_maxima_2d(matrice))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n (rânduri). A doua linie: m (coloane). Următoarele n linii: matricea.',
      outputSpec: 'Suma maximă a unui subșir.'
    },
    {
      title: '[Seed] CodeLab #59: Problema palindromului minim',
      prompt: 'Găsește numărul minim de inserări necesare pentru a transforma un șir într-un palindrom.',
      starterCode: 'def palindrom_minim(s):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    s = input()\n    print(palindrom_minim(s))',
      difficulty: 'Hard',
      inputSpec: 'Un șir de caractere.',
      outputSpec: 'Numărul minim de inserări.'
    },
    {
      title: '[Seed] CodeLab #60: Problema subset-urilor cu sumă dată',
      prompt: 'Numără câte subset-uri dintr-o listă au suma egală cu un număr dat.',
      starterCode: 'def numar_subset_uri(lst, suma):\n    # TODO: implementează funcția\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    lst = [int(input()) for _ in range(n)]\n    suma = int(input())\n    print(numar_subset_uri(lst, suma))',
      difficulty: 'Hard',
      inputSpec: 'Prima linie: n. Următoarele n linii: elementele. Ultima linie: suma țintă.',
      outputSpec: 'Numărul de subset-uri cu suma dată.'
    }
  ];

  // Problema specială pentru testarea anti-copiat
  const antiCopyTestProblem = {
    title: '[Seed] CodeLab #TEST: Test Anti-Copiat',
    prompt: '⚠️ PROBLEMĂ SPECIALĂ PENTRU TESTARE ⚠️\n\nAceastă problemă este destinată testării sistemului anti-copiat. Scrie codul TĂU, nu copia! Dacă copiezi, vei primi penalizare.\n\nProblema: Scrie o funcție care calculează suma pătratelor primelor n numere naturale.\nExemplu: pentru n=3, rezultatul este 1² + 2² + 3² = 14.',
    starterCode: 'def suma_patrate(n):\n    # TODO: Scrie codul TĂU aici!\n    # Nu copia codul din altă sursă!\n    pass\n\nif __name__ == "__main__":\n    n = int(input())\n    print(suma_patrate(n))',
    difficulty: 'Medium',
    inputSpec: 'Un număr întreg n (1 <= n <= 100).',
    outputSpec: 'Suma pătratelor primelor n numere naturale.'
  };

  // Combinăm toate problemele
  const allProblems = [
    ...easyProblems.map(p => ({ ...p, language: 'PYTHON' as const, lessonId: lessons[0].id, status: 'PUBLISHED' })),
    ...mediumProblems.map(p => ({ ...p, language: 'PYTHON' as const, lessonId: lessons[1].id, status: 'PUBLISHED' })),
    ...hardProblems.map(p => ({ ...p, language: 'PYTHON' as const, lessonId: lessons[4].id, status: 'PUBLISHED' })),
    { ...antiCopyTestProblem, language: 'PYTHON' as const, lessonId: lessons[0].id, status: 'PUBLISHED' }
  ];

  await prisma.codingExercise.createMany({
    data: allProblems,
    skipDuplicates: true
  });

  await prisma.badge.createMany({
    data: (() => {
      const badges: any[] = [
        // Legacy XP badges (kept for compatibility)
        { code: 'rookie', name: 'Rookie', description: 'Earn 100 XP', threshold: 100, category: 'MISC', tier: 1, criteria: 'XP_TOTAL', icon: '🧩', rarity: 'COMMON', animation: 'shine' },
        { code: 'scholar', name: 'Scholar', description: 'Earn 500 XP', threshold: 500, category: 'MISC', tier: 2, criteria: 'XP_TOTAL', icon: '📚', rarity: 'RARE', animation: 'shine' },
        { code: 'legend', name: 'Legend', description: 'Earn 1000 XP', threshold: 1000, category: 'MISC', tier: 3, criteria: 'XP_TOTAL', icon: '🏆', rarity: 'EPIC', animation: 'confetti' },

        // Weekly missions milestones (now claimed-based)
        { code: 'weekly_missions_7', name: 'Weekly Warrior I', description: 'Complete 7 weekly missions in total', threshold: 7, category: 'MISC', tier: 1, criteria: 'MISSIONS_CLAIMED', icon: '🛡️', rarity: 'COMMON', animation: 'shine' },
        { code: 'weekly_missions_28', name: 'Weekly Warrior II', description: 'Complete 28 weekly missions in total', threshold: 28, category: 'MISC', tier: 2, criteria: 'MISSIONS_CLAIMED', icon: '⚔️', rarity: 'RARE', animation: 'shine' },
        { code: 'weekly_missions_56', name: 'Weekly Warrior III', description: 'Complete 56 weekly missions in total', threshold: 56, category: 'MISC', tier: 3, criteria: 'MISSIONS_CLAIMED', icon: '👑', rarity: 'EPIC', animation: 'confetti' },

        // Existing project-specific badges (kept)
        { code: 'problems_solved_10', name: 'Problem Solver I', description: 'Rezolvă 10 probleme', threshold: 10, category: 'CODELAB', tier: 4, criteria: 'CODELAB_UNIQUE_SOLVED', icon: '🧠', rarity: 'COMMON', animation: 'shine' },
        { code: 'problems_solved_25', name: 'Problem Solver II', description: 'Rezolvă 25 probleme', threshold: 25, category: 'CODELAB', tier: 7, criteria: 'CODELAB_UNIQUE_SOLVED', icon: '🧠', rarity: 'RARE', animation: 'shine' },
        { code: 'problems_solved_50', name: 'Problem Solver III', description: 'Rezolvă 50 probleme', threshold: 50, category: 'CODELAB', tier: 10, criteria: 'CODELAB_UNIQUE_SOLVED', icon: '🧠', rarity: 'EPIC', animation: 'confetti' },
        { code: 'problems_solved_100', name: 'Problem Master', description: 'Rezolvă 100 probleme', threshold: 100, category: 'CODELAB', tier: 13, criteria: 'CODELAB_UNIQUE_SOLVED', icon: '🧠', rarity: 'LEGENDARY', animation: 'confetti' },

        { code: 'first_try_5', name: 'First Try Novice', description: 'Rezolvă 5 probleme din prima', threshold: 5, category: 'MISC', tier: 1, criteria: 'CODELAB_FIRST_TRY', icon: '✨', rarity: 'COMMON', animation: 'shine' },
        { code: 'first_try_15', name: 'First Try Expert', description: 'Rezolvă 15 probleme din prima', threshold: 15, category: 'MISC', tier: 2, criteria: 'CODELAB_FIRST_TRY', icon: '✨', rarity: 'RARE', animation: 'shine' },
        { code: 'first_try_30', name: 'First Try Master', description: 'Rezolvă 30 probleme din prima', threshold: 30, category: 'MISC', tier: 3, criteria: 'CODELAB_FIRST_TRY', icon: '✨', rarity: 'EPIC', animation: 'confetti' },

        { code: 'lessons_read_5', name: 'Bookworm I', description: 'Citește 5 cursuri', threshold: 5, category: 'MISC', tier: 1, criteria: 'LESSONS_READ', icon: '📖', rarity: 'COMMON', animation: 'shine' },
        { code: 'lessons_read_10', name: 'Bookworm II', description: 'Citește 10 cursuri', threshold: 10, category: 'MISC', tier: 2, criteria: 'LESSONS_READ', icon: '📖', rarity: 'RARE', animation: 'shine' },
        { code: 'lessons_read_25', name: 'Bookworm Master', description: 'Citește 25 cursuri', threshold: 25, category: 'MISC', tier: 3, criteria: 'LESSONS_READ', icon: '📖', rarity: 'EPIC', animation: 'confetti' }
      ];

      // CATEGORY 1: CODE LAB (Progression) - exact names/tiers
      const codeLab = [
        ['Hello World!', 1, '👋', 'COMMON', 'shine'],
        ['Syntax Survivor', 3, '🧩', 'COMMON', 'shine'],
        ['Script Kiddie', 5, '📝', 'COMMON', 'shine'],
        ['Indentation Intern', 10, '📐', 'COMMON', 'shine'],
        ['Loop Learner', 15, '🔁', 'RARE', 'shine'],
        ['Function Fanatic', 20, '🧠', 'RARE', 'shine'],
        ['Bug Squasher', 25, '🪲', 'RARE', 'shine'],
        ['Module Master', 30, '🧱', 'RARE', 'shine'],
        ['Class Commander', 40, '🏛️', 'EPIC', 'confetti'],
        ['Object Oriented', 50, '🧬', 'EPIC', 'confetti'],
        ['Library Legend', 60, '📚', 'EPIC', 'confetti'],
        ['Framework Founder', 75, '🏗️', 'EPIC', 'confetti'],
        ['System Architect', 100, '🛰️', 'LEGENDARY', 'confetti'],
        ['Algorithm Ace', 125, '🧮', 'LEGENDARY', 'confetti'],
        ['The Optimizer', 150, '⚡', 'LEGENDARY', 'confetti'],
        ['Binary Baron', 200, '0️⃣1️⃣', 'LEGENDARY', 'confetti'],
        ['Hex Hero', 250, '🧿', 'LEGENDARY', 'confetti'],
        ['Stack Overflow Proof', 300, '🧱', 'LEGENDARY', 'confetti'],
        ['Python Grandmaster', 400, '🐍', 'LEGENDARY', 'confetti']
      ] as const;

      codeLab.forEach(([name, threshold, icon, rarity, animation], idx) => {
        const code = `codelab_${idx + 1}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
        badges.push({
          code,
          name,
          description: `Complete ${threshold} unique Code Lab problems.`,
          threshold,
          category: 'CODELAB',
          tier: idx + 1,
          icon,
          rarity,
          animation,
          criteria: 'CODELAB_UNIQUE_SOLVED'
        });
      });
      badges.push({
        code: 'codelab_all_solved',
        name: 'The Singularity',
        description: 'All Code Lab problems solved.',
        threshold: 0,
        category: 'CODELAB',
        tier: 20,
        icon: '🕳️',
        rarity: 'LEGENDARY',
        animation: 'confetti',
        criteria: 'CODELAB_UNIQUE_SOLVED'
      });

      // CATEGORY 2: CONSISTENCY (Login Streaks) - exact names/tiers
      const days = (n: number) => n;
      const consistency = [
        ['Boot Sequence', days(1), '🔌'],
        ['Double Check', days(2), '✅'],
        ['Week Starter', days(3), '📅'],
        ['High Five', days(5), '🖐️'],
        ['Weekly Commit', days(7), '🧾'],
        ['Solid State', days(10), '💾'],
        ['Fortnight Coder', days(14), '🗓️'],
        ['Habit Builder', days(21), '🧱'],
        ['Monthly Monitor', days(30), '🖥️'],
        ['The Constant', days(45), '📈'],
        ['Cron Job', days(60), '⏱️'],
        ['Quarterly Quest', days(90), '🧭'],
        ['The Daemon', days(100), '👻'],
        ['Persistence Layer', days(120), '🗄️'],
        ['Semi-Annual Server', days(180), '🖧'],
        ['Uptime Record', days(200), '🏁'],
        ['Infinite Loop', days(270), '♾️'],
        ['Year of Code', days(365), '🧑‍💻'],
        ['Time Lord', days(548), '🕰️'],
        ['Immutable Legend', days(730), '🪨']
      ] as const;

      consistency.forEach(([name, threshold, icon], idx) => {
        badges.push({
          code: `consistency_${idx + 1}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`,
          name,
          description: `Log in ${threshold} days in a row.`,
          threshold,
          category: 'CONSISTENCY',
          tier: idx + 1,
          icon,
          rarity: idx < 6 ? 'COMMON' : idx < 12 ? 'RARE' : 'EPIC',
          animation: idx < 12 ? 'shine' : 'confetti',
          criteria: 'LOGIN_STREAK'
        });
      });

      // CATEGORY 3: SOCIAL (Networking) - exact names/tiers
      const social = [
        ['Localhost', 0, '🏠'],
        ['P2P Connection', 1, '🤝'],
        ['Small Network', 3, '🕸️'],
        ['LAN Party', 5, '🎮'],
        ['Handshake Protocol', 10, '🤝'],
        ['Subnet Mask', 15, '🎭'],
        ['Gateway', 20, '🚪'],
        ['Router', 25, '📡'],
        ['Switch Operator', 30, '🎚️'],
        ['Hub Node', 40, '🔗'],
        ['Load Balancer', 50, '⚖️'],
        ['Server Farm', 60, '🧑‍🌾'],
        ['Data Center', 70, '🏢'],
        ['Cloud Cluster', 80, '☁️'],
        ['The Internet', 90, '🌐'],
        ['Global Variable', 100, '🌍'],
        ['Hive Mind', 150, '🐝'],
        ['Social API', 200, '🧩'],
        ['Influencer', 300, '📣'],
        ['Network Effect', 500, '🧠']
      ] as const;
      social.forEach(([name, threshold, icon], idx) => {
        badges.push({
          code: `social_${idx + 1}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`,
          name,
          description: threshold === 0 ? 'Starter badge.' : `Add ${threshold} friends.`,
          threshold,
          category: 'SOCIAL',
          tier: idx + 1,
          icon,
          rarity: idx < 6 ? 'COMMON' : idx < 12 ? 'RARE' : idx < 17 ? 'EPIC' : 'LEGENDARY',
          animation: idx < 12 ? 'shine' : 'confetti',
          criteria: 'FRIENDS_COUNT'
        });
      });

        // Convenience alias for starter badge used by AuthService.register
        // NOTE: This is intentionally duplicated in naming, but with a distinct code.
        badges.push({
          code: 'social_localhost',
          name: 'Localhost',
          description: 'Starter badge.',
          threshold: 0,
          category: 'SOCIAL',
          tier: 0,
          icon: '🏠',
          rarity: 'COMMON',
          animation: 'shine',
          criteria: 'FRIENDS_COUNT'
        });

      // CATEGORY 4: CHALLENGES (Competitive) - exact names/tiers
      badges.push(
        { code: 'challenge_the_challenger', name: 'The Challenger', description: 'First Challenge Accepted', threshold: 1, category: 'CHALLENGES', tier: 1, icon: '⚔️', rarity: 'COMMON', animation: 'shine', criteria: 'CHALLENGE_ACCEPTED' },
        { code: 'challenge_first_blood', name: 'First Blood', description: 'First Win', threshold: 1, category: 'CHALLENGES', tier: 2, icon: '🩸', rarity: 'COMMON', animation: 'shine', criteria: 'CHALLENGE_WON' },
        { code: 'challenge_arena_amateur', name: 'Arena Amateur', description: 'Accept 5', threshold: 5, category: 'CHALLENGES', tier: 3, icon: '🥊', rarity: 'COMMON', animation: 'shine', criteria: 'CHALLENGE_ACCEPTED' },
        { code: 'challenge_bronze_brawler', name: 'Bronze Brawler', description: 'Win 3', threshold: 3, category: 'CHALLENGES', tier: 4, icon: '🥉', rarity: 'COMMON', animation: 'shine', criteria: 'CHALLENGE_WON' },
        { code: 'challenge_duelist', name: 'Duelist', description: 'Accept 10', threshold: 10, category: 'CHALLENGES', tier: 5, icon: '🤺', rarity: 'RARE', animation: 'shine', criteria: 'CHALLENGE_ACCEPTED' },
        { code: 'challenge_silver_striker', name: 'Silver Striker', description: 'Win 5', threshold: 5, category: 'CHALLENGES', tier: 6, icon: '🥈', rarity: 'RARE', animation: 'shine', criteria: 'CHALLENGE_WON' },
        { code: 'challenge_battle_hardened', name: 'Battle Hardened', description: 'Accept 20', threshold: 20, category: 'CHALLENGES', tier: 7, icon: '🛡️', rarity: 'RARE', animation: 'shine', criteria: 'CHALLENGE_ACCEPTED' },
        { code: 'challenge_gold_gladiator', name: 'Gold Gladiator', description: 'Win 10', threshold: 10, category: 'CHALLENGES', tier: 8, icon: '🥇', rarity: 'EPIC', animation: 'confetti', criteria: 'CHALLENGE_WON' },
        { code: 'challenge_veteran_warrior', name: 'Veteran Warrior', description: 'Accept 50', threshold: 50, category: 'CHALLENGES', tier: 9, icon: '🏹', rarity: 'EPIC', animation: 'confetti', criteria: 'CHALLENGE_ACCEPTED' },
        { code: 'challenge_platinum_pugilist', name: 'Platinum Pugilist', description: 'Win 20', threshold: 20, category: 'CHALLENGES', tier: 10, icon: '💠', rarity: 'EPIC', animation: 'confetti', criteria: 'CHALLENGE_WON' },
        { code: 'challenge_arena_master', name: 'Arena Master', description: 'Accept 100', threshold: 100, category: 'CHALLENGES', tier: 11, icon: '🏟️', rarity: 'LEGENDARY', animation: 'confetti', criteria: 'CHALLENGE_ACCEPTED' },
        { code: 'challenge_diamond_destroyer', name: 'Diamond Destroyer', description: 'Win 50', threshold: 50, category: 'CHALLENGES', tier: 12, icon: '💎', rarity: 'LEGENDARY', animation: 'confetti', criteria: 'CHALLENGE_WON' },
        { code: 'challenge_win_streak_3', name: 'Code Ninja', description: 'Win 3 in a row', threshold: 3, category: 'CHALLENGES', tier: 13, icon: '🥷', rarity: 'RARE', animation: 'shine', criteria: 'CHALLENGE_WIN_STREAK' },
        { code: 'challenge_win_streak_5', name: 'Unstoppable', description: 'Win 5 in a row', threshold: 5, category: 'CHALLENGES', tier: 14, icon: '🚂', rarity: 'EPIC', animation: 'confetti', criteria: 'CHALLENGE_WIN_STREAK' },
        { code: 'challenge_win_streak_10', name: 'Godlike', description: 'Win 10 in a row', threshold: 10, category: 'CHALLENGES', tier: 15, icon: '⚡', rarity: 'LEGENDARY', animation: 'confetti', criteria: 'CHALLENGE_WIN_STREAK' },
        { code: 'challenge_speed_demon', name: 'Speed Demon', description: 'Win in under 2 mins', threshold: 120, category: 'CHALLENGES', tier: 16, icon: '💨', rarity: 'RARE', animation: 'shine', criteria: 'CHALLENGE_WIN_TIME_SECONDS' },
        { code: 'challenge_underdog', name: 'Underdog', description: 'Win against a higher-level player', threshold: 0, category: 'CHALLENGES', tier: 17, icon: '🐶', rarity: 'RARE', animation: 'shine', criteria: 'CHALLENGE_UNDERDOG' },
        { code: 'challenge_clean_sweep', name: 'Clean Sweep', description: 'Win with 100% accuracy', threshold: 0, category: 'CHALLENGES', tier: 18, icon: '🧼', rarity: 'EPIC', animation: 'confetti', criteria: 'CHALLENGE_CLEAN_SWEEP' },
        { code: 'challenge_tournament_titan', name: 'Tournament Titan', description: 'Win a seasonal tournament', threshold: 0, category: 'CHALLENGES', tier: 19, icon: '🏆', rarity: 'LEGENDARY', animation: 'confetti', criteria: 'TODO_TOURNAMENT' },
        { code: 'challenge_apex_predator', name: 'Apex Predator', description: 'Top 1% win rate', threshold: 0, category: 'CHALLENGES', tier: 20, icon: '🦈', rarity: 'LEGENDARY', animation: 'confetti', criteria: 'TODO_WINRATE_PERCENTILE' }
      );

      // CATEGORY 5: SEASONAL LEADERBOARD - fixtures (some triggers TODO)
      const seasonal = [
        // Rank 1 series
        ['season_ruler', 'Season Ruler', 'Finished #1 once', 1, 'SEASON_RANK1_COUNT', 1, '👑', 'LEGENDARY'],
        ['golden_hat_trick', 'Golden Hat Trick', 'Finished #1 for 3 months total', 3, 'SEASON_RANK1_COUNT', 2, '🎩', 'LEGENDARY'],
        ['half_year_sovereign', 'Half-Year Sovereign', 'Finished #1 for 6 months total', 6, 'SEASON_RANK1_COUNT', 3, '🏰', 'LEGENDARY'],
        ['nine_tailed_fox', 'Nine-Tailed Fox', 'Finished #1 for 9 months total', 9, 'SEASON_RANK1_COUNT', 4, '🦊', 'LEGENDARY'],
        ['the_emperor', 'The Emperor', 'Finished #1 for 12 months total', 12, 'SEASON_RANK1_COUNT', 5, '👑', 'LEGENDARY'],
        // Rank 2 series
        ['silver_prince', 'Silver Prince', 'Finished #2 once', 1, 'SEASON_RANK2_COUNT', 6, '🥈', 'EPIC'],
        ['silver_trio', 'Silver Trio', 'Finished #2 for 3 months total', 3, 'SEASON_RANK2_COUNT', 7, '🥈', 'EPIC'],
        ['vice_admiral', 'Vice Admiral', 'Finished #2 for 6 months total', 6, 'SEASON_RANK2_COUNT', 8, '⚓', 'EPIC'],
        ['noble_serpent', 'Noble Serpent', 'Finished #2 for 9 months total', 9, 'SEASON_RANK2_COUNT', 9, '🐍', 'EPIC'],
        ['hand_of_the_king', 'The Hand of the King', 'Finished #2 for 12 months total', 12, 'SEASON_RANK2_COUNT', 10, '🖐️', 'EPIC'],
        // Rank 3 series
        ['bronze_baron', 'Bronze Baron', 'Finished #3 once', 1, 'SEASON_RANK3_COUNT', 11, '🥉', 'RARE'],
        ['third_pillar', 'Third Pillar', 'Finished #3 for 3 months total', 3, 'SEASON_RANK3_COUNT', 12, '🗿', 'RARE'],
        ['bronze_keeper', 'Bronze Keeper', 'Finished #3 for 6 months total', 6, 'SEASON_RANK3_COUNT', 13, '🔰', 'RARE'],
        ['rising_star', 'Rising Star', 'Finished #3 for 9 months total', 9, 'SEASON_RANK3_COUNT', 14, '⭐', 'EPIC'],
        ['foundation_stone', 'Foundation Stone', 'Finished #3 for 12 months total', 12, 'SEASON_RANK3_COUNT', 15, '🧱', 'EPIC'],
        // Special seasonal achievements
        ['top10_regular', 'Top 10 Regular', 'Finish in Top 10 for 3 months', 3, 'SEASON_TOP10_MONTHS', 16, '🔟', 'RARE'],
        ['top10_elite', 'Top 10 Elite', 'Finish in Top 10 for 6 months', 6, 'SEASON_TOP10_MONTHS', 17, '🏅', 'EPIC'],
        ['top100_survivor', 'Top 100 Survivor', 'Finish in Top 100 for 1 year', 12, 'SEASON_TOP100_MONTHS', 18, '💯', 'EPIC'],
        ['photofinish', 'Photofinish', 'Lose 1st place by less than 10 points', 0, 'SEASON_PHOTOFINISH', 19, '📸', 'RARE'],
        ['comeback_kid', 'Comeback Kid', 'Climb from bottom 50% to Top 3 in one season', 0, 'TODO_COMEBACK', 20, '🪃', 'LEGENDARY']
      ] as const;

      seasonal.forEach(([code, name, description, threshold, criteria, tier, icon, rarity]) => {
        badges.push({
          code: `season_${code}`,
          name,
          description,
          threshold,
          category: 'SEASONAL',
          tier,
          icon,
          rarity,
          animation: rarity === 'LEGENDARY' || rarity === 'EPIC' ? 'confetti' : 'shine',
          criteria
        });
      });

      return badges;
    })(),
    skipDuplicates: true
  });

  // Seed a default set of 7 weekly missions for the current week
  const startOfWeek = new Date();
  const day = startOfWeek.getDay(); // 0 = Sunday
  const diffToMonday = (day + 6) % 7; // days since Monday
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // Pick a couple of specific CodeLab problems to bind missions to
  const warmupExercise = await prisma.codingExercise.findFirst({
    where: { title: '[Seed] CodeLab #1: Suma a două numere' }
  });

  const dailyExercise = await prisma.codingExercise.findFirst({
    where: { title: '[Seed] CodeLab #4: Factorial' }
  });

  await prisma.weeklyMission.createMany({
    data: [
      {
        title: 'Warm-up: Solve 3 CodeLab problems',
        description: 'Începe săptămâna cu 3 exerciții Python în CodeLab.',
        goalType: 'CODING',
        goalValue: 3,
        rewardXP: 120,
        status: 'ACTIVE',
        startDate: startOfWeek,
        endDate: endOfWeek,
        creatorId: professor.id,
        codingExerciseId: warmupExercise?.id ?? null
      },
      {
        title: 'CodeLab Grinder: Solve 7 problems',
        description: 'Rezolvă 7 exerciții în CodeLab până la finalul săptămânii.',
        goalType: 'CODING',
        goalValue: 7,
        rewardXP: 220,
        status: 'ACTIVE',
        startDate: startOfWeek,
        endDate: endOfWeek,
        creatorId: professor.id
      },
      {
        title: 'Quiz Sprint: Finish 3 quizzes',
        description: 'Consolidează-ți teoria terminând cel puțin 3 quiz-uri.',
        goalType: 'QUIZZES',
        goalValue: 3,
        rewardXP: 180,
        status: 'ACTIVE',
        startDate: startOfWeek,
        endDate: endOfWeek,
        creatorId: professor.id
      },
      {
        title: 'XP Hunter: Earn 500 XP this week',
        description: 'Adună XP din probleme, quiz-uri și provocări.',
        goalType: 'XP',
        goalValue: 500,
        rewardXP: 250,
        status: 'ACTIVE',
        startDate: startOfWeek,
        endDate: endOfWeek,
        creatorId: professor.id
      },
      {
        title: 'Daily Python Habit (7 zile la rând)',
        description: 'Fă cel puțin o problemă de Python în fiecare zi și marchează-ți progresul.',
        goalType: 'DAILY_CODING',
        goalValue: 7,
        rewardXP: 300,
        status: 'ACTIVE',
        startDate: startOfWeek,
        endDate: endOfWeek,
        creatorId: professor.id,
        codingExerciseId: dailyExercise?.id ?? null
      },
      {
        title: 'Challenge Ready: Win 2 challenges',
        description: 'Intră în arena Challenges și câștigă 2 dueluri.',
        goalType: 'CHALLENGES',
        goalValue: 2,
        rewardXP: 250,
        status: 'ACTIVE',
        startDate: startOfWeek,
        endDate: endOfWeek,
        creatorId: professor.id
      },
      {
        title: 'Study Streak: 5 active days',
        description: 'Intră pe platformă și învață în cel puțin 5 zile diferite.',
        goalType: 'ACTIVE_DAYS',
        goalValue: 5,
        rewardXP: 200,
        status: 'ACTIVE',
        startDate: startOfWeek,
        endDate: endOfWeek,
        creatorId: professor.id
      }
    ],
    skipDuplicates: true
  });

  /**
   * Education (RO) — Procedural Programming (Clasa a IX-a)
   * Seed a starter set based on the teacher-provided ideas list.
   *
   * NOTE:
   * - These exercises are meant for professor-created assignments + the professor picker.
   * - Students do NOT see them in CodeLab list (CodingService filters to roadmap categories for STUDENT).
   * - Each exercise includes a single sample test case; the prompt tells students to use that stdin when submitting.
   */
  const seedEduExercise = async (payload: {
    title: string;
    category: string;
    prompt: string;
    inputSpec: string;
    outputSpec: string;
    stdin: string;
    expected: string;
    difficulty?: string;
  }) => {
    const exists = await prisma.codingExercise.findFirst({ where: { title: payload.title } });
    if (exists) return;

    await prisma.codingExercise.create({
      data: {
        lessonId: lessons[0].id,
        title: payload.title,
        prompt: `${payload.prompt}\n\n---\nIMPORTANT (evaluare): folosește exact stdin-ul din exemplu când trimiți soluția.\n`,
        starterCode:
          "import sys\n\n# Citește tot stdin-ul (spații/newlines) ca token-uri\n+data = sys.stdin.read().strip().split()\n+\n# TODO: implementează aici\n+\n",
        difficulty: payload.difficulty || 'Beginner',
        language: 'PYTHON',
        category: payload.category,
        inputSpec: payload.inputSpec,
        outputSpec: payload.outputSpec,
        testCases: [
          {
            stdin: payload.stdin,
            output: payload.expected
          }
        ],
        status: 'PUBLISHED'
      } as any
    });
  };

  const eduProblems: Array<Parameters<typeof seedEduExercise>[0]> = [
    // I. Sintaxă & I/O (idei)
    {
      title: '[Edu PP I/O] Hello World',
      category: 'edu:pp-syntax-io',
      prompt: 'Scrie un program care afișează exact textul: Hello World!',
      inputSpec: 'Nu există input.',
      outputSpec: 'Afișează: Hello World!',
      stdin: '',
      expected: 'Hello World!'
    },
    {
      title: '[Edu PP I/O] Suma a două numere',
      category: 'edu:pp-syntax-io',
      prompt: 'Citește două numere întregi și afișează suma lor.',
      inputSpec: 'Două numere întregi, pe linii separate.',
      outputSpec: 'Suma celor două numere.',
      stdin: '7\n5\n',
      expected: '12'
    },
    {
      title: '[Edu PP I/O] Media aritmetică (3 numere)',
      category: 'edu:pp-syntax-io',
      prompt: 'Citește trei numere întregi și afișează media aritmetică (ca număr întreg).',
      inputSpec: 'Trei numere întregi, pe linii separate.',
      outputSpec: 'Media aritmetică (întreagă) a celor trei numere.',
      stdin: '6\n9\n12\n',
      expected: '9'
    },
    {
      title: '[Edu PP I/O] Schimbarea valorilor (Swap)',
      category: 'edu:pp-syntax-io',
      prompt: 'Citește două numere și afișează-le în ordine inversă (swap).',
      inputSpec: 'Două numere întregi pe aceeași linie.',
      outputSpec: 'Cele două numere inversate, separate prin spațiu.',
      stdin: '10 20\n',
      expected: '20 10'
    },
    {
      title: '[Edu PP I/O] Conversie ore în secunde',
      category: 'edu:pp-syntax-io',
      prompt: 'Citește un număr de ore și afișează echivalentul în secunde.',
      inputSpec: 'Un număr întreg h (ore).',
      outputSpec: 'Numărul de secunde: h * 3600.',
      stdin: '2\n',
      expected: '7200'
    },
    {
      title: '[Edu PP I/O] Aria cercului (π = 3.14)',
      category: 'edu:pp-syntax-io',
      prompt: 'Citește raza r (număr întreg) și afișează aria cercului folosind π = 3.14. Afișează cu 2 zecimale.',
      inputSpec: 'Un număr întreg r.',
      outputSpec: 'Aria: 3.14 * r * r, cu 2 zecimale.',
      stdin: '2\n',
      expected: '12.56'
    },

    // II. Condiționale (IF) (idei)
    {
      title: '[Edu PP IF] Maximul a două numere',
      category: 'edu:pp-if',
      prompt: 'Citește două numere întregi și afișează maximul.',
      inputSpec: 'Două numere întregi pe aceeași linie.',
      outputSpec: 'Maximul celor două numere.',
      stdin: '7 5\n',
      expected: '7'
    },
    {
      title: '[Edu PP IF] Verificare par/impar',
      category: 'edu:pp-if',
      prompt: 'Citește un număr întreg și afișează "par" dacă este par, altfel "impar".',
      inputSpec: 'Un număr întreg n.',
      outputSpec: '"par" sau "impar".',
      stdin: '13\n',
      expected: 'impar'
    },
    {
      title: '[Edu PP IF] An bisect',
      category: 'edu:pp-if',
      prompt: 'Citește un an și afișează "DA" dacă este bisect, altfel "NU". (Regula: divizibil cu 400 sau divizibil cu 4 și nedivizibil cu 100).',
      inputSpec: 'Un număr întreg an.',
      outputSpec: '"DA" sau "NU".',
      stdin: '2000\n',
      expected: 'DA'
    },
    {
      title: '[Edu PP IF] Validare dată calendaristică',
      category: 'edu:pp-if',
      prompt: 'Citește zi luna an și afișează "VALID" dacă data există în calendar, altfel "INVALID".',
      inputSpec: 'Trei întregi: zi luna an.',
      outputSpec: '"VALID" sau "INVALID".',
      stdin: '29 2 2024\n',
      expected: 'VALID'
    },
    {
      title: '[Edu PP IF] Calcul de discount',
      category: 'edu:pp-if',
      prompt: 'Citește prețul întreg P și discount-ul procentual D (0..100). Afișează prețul final (întreg).',
      inputSpec: 'P pe prima linie, D pe a doua linie.',
      outputSpec: 'P_final = P * (100 - D) / 100 (întreg).',
      stdin: '100\n15\n',
      expected: '85'
    },
    {
      title: '[Edu PP IF] Tipul de triunghi',
      category: 'edu:pp-if',
      prompt: 'Citește trei laturi a b c și afișează tipul: "echilateral", "isoscel", "oarecare" sau "invalid".',
      inputSpec: 'Trei întregi a b c.',
      outputSpec: 'Un cuvânt din lista de mai sus.',
      stdin: '3 3 3\n',
      expected: 'echilateral'
    },

    // III. Bucle (For/While) (idei)
    {
      title: '[Edu PP Loops] Afișarea numerelor 1..N',
      category: 'edu:pp-loops',
      prompt: 'Citește N și afișează numerele de la 1 la N, separate prin spațiu.',
      inputSpec: 'Un întreg N.',
      outputSpec: '1 2 3 ... N',
      stdin: '5\n',
      expected: '1 2 3 4 5'
    },
    {
      title: '[Edu PP Loops] Suma primelor N numere',
      category: 'edu:pp-loops',
      prompt: 'Citește N și afișează suma 1 + 2 + ... + N.',
      inputSpec: 'Un întreg N.',
      outputSpec: 'Suma primelor N numere naturale.',
      stdin: '10\n',
      expected: '55'
    },
    {
      title: '[Edu PP Loops] Factorial (n!)',
      category: 'edu:pp-loops',
      prompt: 'Citește n și afișează n! (factorial).',
      inputSpec: 'Un întreg n (n ≥ 0).',
      outputSpec: 'n! (factorial).',
      stdin: '5\n',
      expected: '120'
    },
    {
      title: '[Edu PP Loops] Putere fără operatorul **',
      category: 'edu:pp-loops',
      prompt: 'Citește a și n și afișează a^n folosind doar înmulțiri repetate.',
      inputSpec: 'Două întregi: a n.',
      outputSpec: 'a^n.',
      stdin: '2 10\n',
      expected: '1024'
    },
    {
      title: '[Edu PP Loops] Primele N pătrate perfecte',
      category: 'edu:pp-loops',
      prompt: 'Citește N și afișează primele N pătrate perfecte (1^2, 2^2, ...), separate prin spațiu.',
      inputSpec: 'Un întreg N.',
      outputSpec: 'N pătrate perfecte, separate prin spațiu.',
      stdin: '5\n',
      expected: '1 4 9 16 25'
    },

    // IV. Prelucrarea Numerelor (idei)
    {
      title: '[Edu PP Numbers] Suma cifrelor',
      category: 'edu:pp-numbers',
      prompt: 'Citește un număr n și afișează suma cifrelor sale.',
      inputSpec: 'Un întreg n.',
      outputSpec: 'Suma cifrelor.',
      stdin: '12345\n',
      expected: '15'
    },
    {
      title: '[Edu PP Numbers] Cifra maximă',
      category: 'edu:pp-numbers',
      prompt: 'Citește un număr n și afișează cea mai mare cifră din el.',
      inputSpec: 'Un întreg n.',
      outputSpec: 'Cifra maximă.',
      stdin: '59028\n',
      expected: '9'
    },
    {
      title: '[Edu PP Numbers] Oglinditul unui număr',
      category: 'edu:pp-numbers',
      prompt: 'Citește un număr n și afișează numărul obținut prin inversarea cifrelor (oglindit).',
      inputSpec: 'Un întreg n.',
      outputSpec: 'Numărul oglindit (fără zerouri la început).',
      stdin: '12340\n',
      expected: '4321'
    },
    {
      title: '[Edu PP Numbers] Verificare palindrom',
      category: 'edu:pp-numbers',
      prompt: 'Citește un număr n și afișează "DA" dacă este palindrom, altfel "NU".',
      inputSpec: 'Un întreg n.',
      outputSpec: '"DA" sau "NU".',
      stdin: '12321\n',
      expected: 'DA'
    },
    {
      title: '[Edu PP Numbers] CMMDC (Euclid)',
      category: 'edu:pp-numbers',
      prompt: 'Citește două numere a și b și afișează CMMDC(a, b) folosind algoritmul lui Euclid.',
      inputSpec: 'Două întregi a b.',
      outputSpec: 'CMMDC(a, b).',
      stdin: '48 18\n',
      expected: '6'
    },
    {
      title: '[Edu PP Numbers] Test de primalitate',
      category: 'edu:pp-numbers',
      prompt: 'Citește un număr n și afișează "DA" dacă este prim, altfel "NU".',
      inputSpec: 'Un întreg n (n ≥ 1).',
      outputSpec: '"DA" sau "NU".',
      stdin: '29\n',
      expected: 'DA'
    },
    {
      title: '[Edu PP Numbers] Ciurul lui Eratostene (primi ≤ N)',
      category: 'edu:pp-numbers',
      prompt: 'Citește N și afișează toate numerele prime ≤ N, separate prin spațiu.',
      inputSpec: 'Un întreg N (N ≥ 2).',
      outputSpec: 'Toate numerele prime ≤ N, separate prin spațiu.',
      stdin: '20\n',
      expected: '2 3 5 7 11 13 17 19'
    },

    // V. Liste/Vectori (idei)
    {
      title: '[Edu PP Lists] Citire și afișare listă',
      category: 'edu:pp-lists',
      prompt: 'Citește n și apoi n numere. Afișează lista exact în aceeași ordine (separate prin spațiu).',
      inputSpec: 'n pe prima linie, apoi n numere pe a doua linie.',
      outputSpec: 'Lista, în aceeași ordine.',
      stdin: '5\n1 2 3 4 5\n',
      expected: '1 2 3 4 5'
    },
    {
      title: '[Edu PP Lists] Căutare element (poziție 1-based)',
      category: 'edu:pp-lists',
      prompt: 'Citește n, lista de n numere, apoi x. Afișează poziția (1-based) a lui x în listă sau 0 dacă nu există.',
      inputSpec: 'n, apoi n numere, apoi x.',
      outputSpec: 'Poziția 1-based sau 0.',
      stdin: '5\n1 4 7 9 11\n7\n',
      expected: '3'
    },
    {
      title: '[Edu PP Lists] Minim și maxim în listă',
      category: 'edu:pp-lists',
      prompt: 'Citește n și lista. Afișează minimul și maximul, separate prin spațiu.',
      inputSpec: 'n, apoi n numere.',
      outputSpec: 'min max',
      stdin: '6\n3 8 1 9 2 7\n',
      expected: '1 9'
    },
    {
      title: '[Edu PP Lists] Media elementelor pare',
      category: 'edu:pp-lists',
      prompt: 'Citește n și lista. Afișează media aritmetică (întreagă) a elementelor pare. Dacă nu există, afișează 0.',
      inputSpec: 'n, apoi n numere.',
      outputSpec: 'Media (întreagă) a elementelor pare sau 0.',
      stdin: '6\n1 2 3 4 6 9\n',
      expected: '4'
    },
    {
      title: '[Edu PP Lists] Inversarea unei liste',
      category: 'edu:pp-lists',
      prompt: 'Citește n și lista. Afișează elementele în ordine inversă, separate prin spațiu.',
      inputSpec: 'n, apoi n numere.',
      outputSpec: 'Lista inversată.',
      stdin: '4\n10 20 30 40\n',
      expected: '40 30 20 10'
    },
    {
      title: '[Edu PP Lists] Sortare prin selecție',
      category: 'edu:pp-lists',
      prompt: 'Citește n și lista. Sortează crescător folosind selection sort și afișează lista.',
      inputSpec: 'n, apoi n numere.',
      outputSpec: 'Lista sortată crescător.',
      stdin: '5\n5 1 4 2 3\n',
      expected: '1 2 3 4 5'
    },
    {
      title: '[Edu PP Lists] Frecvența cifrelor (0..9) într-o listă',
      category: 'edu:pp-lists',
      prompt: 'Citește n și apoi n cifre (0..9). Afișează frecvențele pentru 0..9, separate prin spațiu.',
      inputSpec: 'n, apoi n valori între 0 și 9.',
      outputSpec: '10 numere: frecvențele pentru 0..9.',
      stdin: '10\n1 2 1 3 3 3 0 9 9 9\n',
      expected: '1 2 1 3 0 0 0 0 0 3'
    }
  ];

  for (const p of eduProblems) {
    // eslint-disable-next-line no-await-in-loop
    await seedEduExercise(p);
  }

  await prisma.friendship.createMany({
    data: [
      { requester: students[0].id, addressee: students[1].id, status: 'accepted' },
      { requester: students[1].id, addressee: students[2].id, status: 'accepted' }
    ],
    skipDuplicates: true
  });

  console.log('✅ Database seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

