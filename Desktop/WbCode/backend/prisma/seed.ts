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

  // Șterge toate exercițiile existente CodeLab
  await prisma.codingExercise.deleteMany({
    where: { title: { startsWith: '[Seed] CodeLab #' } }
  });

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
    data: [
      { code: 'rookie', name: 'Rookie', description: 'Earn 100 XP', threshold: 100 },
      { code: 'scholar', name: 'Scholar', description: 'Earn 500 XP', threshold: 500 },
      { code: 'legend', name: 'Legend', description: 'Earn 1000 XP', threshold: 1000 }
    ],
    skipDuplicates: true
  });

  await prisma.weeklyMission.createMany({
    data: [
      {
        title: 'Complete 3 quizzes',
        description: 'Stay consistent with quizzes this week',
        goalType: 'QUIZZES',
        goalValue: 3,
        rewardXP: 120,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        creatorId: professor.id
      }
    ]
  });

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

