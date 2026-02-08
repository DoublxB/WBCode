export type MaterialExample = {
  title: string;
  code: string;
  note?: string;
};

export type MaterialConcept = {
  explanation: string;
  examples: MaterialExample[];
};

export type MaterialSection = {
  id: string;
  title: string;
  whyItMatters?: string;
  concepts: MaterialConcept[];
  quickChecks?: string[];
  commonMistakes?: string[];
};

export type ModuleMaterials = {
  moduleSlug: string;
  prerequisites: string[];
  objectives: string[];
  sections: MaterialSection[];
  masteryChecklist: string[];
};

export const MODULE_MATERIALS: Record<string, ModuleMaterials> = {
  'procedural-programming': {
    moduleSlug: 'procedural-programming',
    prerequisites: ['Știi să folosești un calculator și ai noțiuni de matematică (operații, comparații).'],
    objectives: [
      'Să scrii programe simple corecte (I/O, condiții, bucle).',
      'Să alegi tipul de date potrivit și să eviți erori comune (overflow, inițializare).',
      'Să descompui o problemă în funcții și pași clari.'
    ],
    sections: [
      {
        id: 'io-types',
        title: '1) I/O și tipuri de date (fundamentul corectitudinii)',
        whyItMatters:
          'Majoritatea bug-urilor la început vin din citire/afișare greșită sau dintr-un tip de date nepotrivit (ex: int vs long long).',
        concepts: [
          {
            explanation:
              'În programare procedurală, un program primește date (input), le transformă (procesare) și produce rezultate (output). Pentru corectitudine, definește clar tipurile: numere întregi (int/long long), reale (double), caractere/șiruri (char/string). În C++: citești cu `cin`, afișezi cu `cout`.',
            examples: [
              {
                title: 'Exemplu: sumă și produs (tipuri potrivite)',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  long long a, b;\n  cin >> a >> b;\n  cout << (a + b) << \" \" << (a * b) << \"\\n\";\n  return 0;\n}\n`,
                note: 'Folosim `long long` ca să evităm overflow la produs.'
              }
            ]
          },
          {
            explanation:
              'Un detaliu „științific” util: tratează fiecare problemă ca un contract. Notează (mental) domeniul valorilor și alege tipul astfel încât să acopere domeniul. Dacă nu ești sigur, alege un tip mai larg (ex: `long long`) și validează rezultatul.',
            examples: [
              {
                title: 'Exemplu: citire și formatare pentru numere reale',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  double x;\n  cin >> x;\n  cout << fixed << setprecision(2) << x << \"\\n\";\n  return 0;\n}\n`,
                note: 'Formatarea te ajută să respecți cerința de output.'
              }
            ]
          }
        ],
        quickChecks: [
          'Ce tip folosești când valoarea poate ajunge la \(10^{12}\)?',
          'Cum afișezi un `double` cu 3 zecimale?'
        ],
        commonMistakes: ['Folosirea `int` pentru valori mari', 'Output fără spații/newline conform cerinței']
      },
      {
        id: 'conditions',
        title: '2) Condiții (if/else) și expresii logice',
        concepts: [
          {
            explanation:
              'O condiție decide ce ramură rulează. Folosește comparații (`<`, `<=`, `==`) și operatori logici (`&&`, `||`, `!`). Cheia este să scrii condiții clare și să acoperi toate cazurile (inclusiv limitele).',
            examples: [
              {
                title: 'Exemplu: maximul a 3 numere',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  long long a, b, c;\n  cin >> a >> b >> c;\n  long long mx = a;\n  if (b > mx) mx = b;\n  if (c > mx) mx = c;\n  cout << mx << \"\\n\";\n  return 0;\n}\n`
              }
            ]
          },
          {
            explanation:
              'Pentru probleme cu intervale, gândește „pe axe”: ce se întâmplă pentru valori sub limită, la limită, și peste limită. Testează mental 2–3 cazuri reprezentative înainte să scrii codul (minimizează erorile de logică).',
            examples: [
              {
                title: 'Exemplu: apartenență la interval [L, R]',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  long long x, L, R;\n  cin >> x >> L >> R;\n  cout << (L <= x && x <= R ? \"DA\" : \"NU\") << \"\\n\";\n  return 0;\n}\n`
              }
            ]
          }
        ],
        quickChecks: ['Care e diferența între `=` și `==`?', 'Ce înseamnă `!(a && b)`?'],
        commonMistakes: ['Confuzie `=` vs `==`', 'Lipsa cazului de egalitate la limită']
      },
      {
        id: 'loops',
        title: '3) Bucle (for/while) și invarianta (gândire corectă)',
        whyItMatters:
          'Invarianta este „adevărul” care rămâne corect după fiecare iterație; dacă o definești, scazi masiv șansele de bug.',
        concepts: [
          {
            explanation:
              'Buclele repetă o acțiune. În `for` știi de obicei numărul de pași; în `while` repeți până când o condiție devine falsă. O tehnică puternică: definește o invarianta (ex: „suma conține suma primelor i elemente”).',
            examples: [
              {
                title: 'Exemplu: sumă de N numere',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  long long s = 0;\n  for (int i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    s += x;\n  }\n  cout << s << \"\\n\";\n  return 0;\n}\n`,
                note: 'Invarianta: după i pași, s = suma primelor i numere citite.'
              }
            ]
          },
          {
            explanation:
              'La `while`, atenție la condiția de oprire: dacă nu progresezi (schimbi variabilele din condiție), riști buclă infinită. Verifică mereu că „te apropii” de oprire.',
            examples: [
              {
                title: 'Exemplu: număr de cifre ale unui număr',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  long long n;\n  cin >> n;\n  n = llabs(n);\n  if (n == 0) { cout << 1 << \"\\n\"; return 0; }\n  int cnt = 0;\n  while (n > 0) {\n    cnt++;\n    n /= 10;\n  }\n  cout << cnt << \"\\n\";\n  return 0;\n}\n`
              }
            ]
          }
        ]
      },
      {
        id: 'functions',
        title: '4) Funcții (decompunere și reutilizare)',
        concepts: [
          {
            explanation:
              'O funcție izolează o responsabilitate: primește parametri, returnează un rezultat. În probleme, funcțiile te ajută să structurezi: „citește”, „procesează”, „afișează”. În plus, testezi mai ușor bucăți mici.',
            examples: [
              {
                title: 'Exemplu: funcție pentru primalitate (naiv)',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nbool isPrime(long long n) {\n  if (n < 2) return false;\n  for (long long d = 2; d * d <= n; d++) {\n    if (n % d == 0) return false;\n  }\n  return true;\n}\n\nint main() {\n  long long x;\n  cin >> x;\n  cout << (isPrime(x) ? \"DA\" : \"NU\") << \"\\n\";\n  return 0;\n}\n`,
                note: 'Exemplu bun pentru a exersa parametri + return.'
              }
            ]
          }
        ],
        quickChecks: ['Când folosești `return`?', 'Ce se întâmplă dacă uiți să returnezi într-o funcție non-void?']
      }
    ],
    masteryChecklist: [
      'Aleg tipurile corect (int/long long/double) și justific domeniul.',
      'Scriu condiții care acoperă și limitele.',
      'Pot explica invarianta unei bucle.',
      'Pot scoate logică repetată în funcții.'
    ]
  },
  'object-oriented': {
    moduleSlug: 'object-oriented',
    prerequisites: ['Procedural Programming (variabile, funcții, bucle).'],
    objectives: [
      'Să modelezi probleme prin clase și obiecte.',
      'Să aplici încapsulare (date private + metode publice).',
      'Să folosești moștenire și polimorfism când au sens.'
    ],
    sections: [
      {
        id: 'classes-objects',
        title: '1) Clase și obiecte (modelarea datelor + comportament)',
        concepts: [
          {
            explanation:
              'O clasă este un „tip” definit de tine: descrie date (atribute) și operații (metode). Un obiect este o instanță concretă. Gândire practică: întreabă „ce date are?” și „ce poate face?”.',
            examples: [
              {
                title: 'Exemplu: clasa Point (punct 2D)',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Point {\npublic:\n  double x, y;\n\n  Point(double x_, double y_) : x(x_), y(y_) {}\n\n  double distToOrigin() const {\n    return sqrt(x * x + y * y);\n  }\n};\n\nint main() {\n  Point p(3, 4);\n  cout << fixed << setprecision(2) << p.distToOrigin() << \"\\n\";\n  return 0;\n}\n`
              }
            ]
          }
        ],
        commonMistakes: ['Confuzie între clasă (tip) și obiect (instanță)', 'Metode care modifică starea fără motiv (lipsă `const`)']
      },
      {
        id: 'encapsulation',
        title: '2) Încapsulare (siguranță și invarianti de obiect)',
        whyItMatters:
          'Încapsularea te ajută să păstrezi obiectul mereu într-o stare validă (invarianti), limitând accesul direct la date.',
        concepts: [
          {
            explanation:
              'Pune atributele `private` și expune operații prin metode. Astfel, controlezi cum se modifică datele și poți valida intrările.',
            examples: [
              {
                title: 'Exemplu: cont bancar cu validare',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Account {\nprivate:\n  long long balance = 0;\n\npublic:\n  explicit Account(long long initial) {\n    balance = max(0LL, initial);\n  }\n\n  long long getBalance() const { return balance; }\n\n  bool deposit(long long amount) {\n    if (amount <= 0) return false;\n    balance += amount;\n    return true;\n  }\n\n  bool withdraw(long long amount) {\n    if (amount <= 0 || amount > balance) return false;\n    balance -= amount;\n    return true;\n  }\n};\n\nint main() {\n  Account a(100);\n  a.withdraw(30);\n  cout << a.getBalance() << \"\\n\";\n  return 0;\n}\n`,
                note: 'Invarianta: balance >= 0 este mereu adevărat.'
              }
            ]
          }
        ]
      },
      {
        id: 'inheritance-polymorphism',
        title: '3) Moștenire și polimorfism (reutilizare controlată)',
        concepts: [
          {
            explanation:
              'Moștenirea exprimă relația „este un” (is-a). Polimorfismul apare când o metodă virtuală e redefinită în clase derivate și este apelată printr-un pointer/referință la bază.',
            examples: [
              {
                title: 'Exemplu: forme geometrice (aria ca metodă virtuală)',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nstruct Shape {\n  virtual ~Shape() = default;\n  virtual double area() const = 0;\n};\n\nstruct Rectangle : Shape {\n  double w, h;\n  Rectangle(double w_, double h_) : w(w_), h(h_) {}\n  double area() const override { return w * h; }\n};\n\nstruct Circle : Shape {\n  double r;\n  Circle(double r_) : r(r_) {}\n  double area() const override { return acos(-1.0) * r * r; }\n};\n\nint main() {\n  vector<unique_ptr<Shape>> v;\n  v.push_back(make_unique<Rectangle>(3, 4));\n  v.push_back(make_unique<Circle>(2));\n  double sum = 0;\n  for (auto &s : v) sum += s->area();\n  cout << fixed << setprecision(2) << sum << \"\\n\";\n  return 0;\n}\n`
              }
            ]
          }
        ],
        commonMistakes: ['Folosirea moștenirii când e mai potrivită compoziția', 'Uitarea destructorului virtual în baza polimorfă']
      }
    ],
    masteryChecklist: [
      'Pot defini o clasă cu constructor și metode `const`.',
      'Pot impune o invariantă prin încapsulare.',
      'Știu când are sens moștenirea vs compoziția.',
      'Înțeleg virtual/override și apelul polimorf.'
    ]
  },
  'data-structures': {
    moduleSlug: 'data-structures',
    prerequisites: ['Procedural Programming (bucle, funcții).'],
    objectives: [
      'Să alegi structura potrivită pentru operațiile cerute (căutare, inserare, ștergere).',
      'Să înțelegi costurile tipice (timp/memorie).',
      'Să folosești structuri standard în C++ (vector, stack, queue, set, map).'
    ],
    sections: [
      {
        id: 'arrays-vectors',
        title: '1) Vectori (array dinamic) și parcurgeri',
        concepts: [
          {
            explanation:
              'Un `vector` stochează elemente consecutiv în memorie, oferind acces rapid la index (\(O(1)\)). Este ideal când ai nevoie de parcurgere și acces aleator.',
            examples: [
              {
                title: 'Exemplu: citire, sortare, afișare',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  vector<long long> a(n);\n  for (auto &x : a) cin >> x;\n  sort(a.begin(), a.end());\n  for (auto x : a) cout << x << \" \";\n  cout << \"\\n\";\n  return 0;\n}\n`
              }
            ]
          }
        ]
      },
      {
        id: 'stack-queue',
        title: '2) Stivă și coadă (ordine LIFO / FIFO)',
        concepts: [
          {
            explanation:
              'Stiva (stack) este LIFO: ultimul intrat iese primul. Coadă (queue) este FIFO: primul intrat iese primul. Sunt utile în parsing, backtracking, BFS etc.',
            examples: [
              {
                title: 'Exemplu: verificare paranteze corecte',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  string s;\n  cin >> s;\n  stack<char> st;\n  for (char c : s) {\n    if (c == '(') st.push(c);\n    else if (c == ')') {\n      if (st.empty()) { cout << \"NU\\n\"; return 0; }\n      st.pop();\n    }\n  }\n  cout << (st.empty() ? \"DA\\n\" : \"NU\\n\");\n  return 0;\n}\n`
              }
            ]
          }
        ],
        commonMistakes: ['Nu tratezi cazul stivă goală înainte de pop', 'Nu verifici starea finală (stiva goală)']
      },
      {
        id: 'set-map',
        title: '3) Set/Map (căutare și unicitate)',
        concepts: [
          {
            explanation:
              '`set` păstrează elemente unice ordonate, iar `map` asociază chei unice cu valori. Operații tipice: inserare/căutare/ștergere în \(O(\\log n)\).',
            examples: [
              {
                title: 'Exemplu: frecvențe cu map',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  map<long long, int> freq;\n  for (int i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    freq[x]++;\n  }\n  for (auto &p : freq) {\n    cout << p.first << \":\" << p.second << \"\\n\";\n  }\n  return 0;\n}\n`
              }
            ]
          }
        ]
      }
    ],
    masteryChecklist: [
      'Aleg `vector` pentru acces la index și parcurgere rapidă.',
      'Folosesc `stack/queue` când ordinea contează (LIFO/FIFO).',
      'Folosesc `set/map` pentru unicitate și căutare eficientă.'
    ]
  },
  'algorithms-logic': {
    moduleSlug: 'algorithms-logic',
    prerequisites: ['Procedural Programming', 'Data Structures (vector, map/set).'],
    objectives: [
      'Să alegi algoritmul potrivit pentru o problemă (sorting/searching/greedy/recursiv).',
      'Să estimezi complexitatea (timp/memorie).',
      'Să construiești soluții robuste pe cazuri-limită.'
    ],
    sections: [
      {
        id: 'complexity',
        title: '1) Complexitate (de la „merge” la „merge rapid”)',
        concepts: [
          {
            explanation:
              'Complexitatea descrie cum crește timpul de execuție când crește n. Ideea practică: pentru n mare, \(O(n^2)\) poate fi prea lent, iar \(O(n \\log n)\) e de obicei ok.',
            examples: [
              {
                title: 'Exemplu: număr de perechi (diferența între O(n^2) și O(n))',
                code:
                  `// Număr de perechi i<j: O(1)\n// Rezultat = n*(n-1)/2\nlong long pairs(long long n){\n  return n*(n-1)/2;\n}\n`
              }
            ]
          }
        ],
        quickChecks: ['Când devine problematic \(n^2\) (ex: n=1e5)?', 'Ce înseamnă \(O(n \\log n)\)?']
      },
      {
        id: 'sorting-searching',
        title: '2) Sorting + Binary Search (pattern fundamental)',
        concepts: [
          {
            explanation:
              'După sortare, poți căuta eficient cu binary search. Pattern: sortezi, apoi folosești `lower_bound`/`upper_bound` pentru poziții și numărări.',
            examples: [
              {
                title: 'Exemplu: câte valori sunt în [L, R] după sortare',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n  int n; cin >> n;\n  vector<long long> a(n);\n  for(auto &x:a) cin>>x;\n  sort(a.begin(), a.end());\n  long long L,R; cin>>L>>R;\n  auto it1 = lower_bound(a.begin(), a.end(), L);\n  auto it2 = upper_bound(a.begin(), a.end(), R);\n  cout << (it2 - it1) << \"\\n\";\n}\n`
              }
            ]
          }
        ],
        commonMistakes: ['Uită să sorteze înainte de binary search', 'Folosește `upper_bound` în loc de `lower_bound` (sau invers)']
      },
      {
        id: 'recursion',
        title: '3) Recursivitate (definiție + bază + progres)',
        concepts: [
          {
            explanation:
              'Recursivitatea funcționează când o problemă se reduce natural la sub-probleme mai mici. Ai nevoie de: caz de bază (oprire) și progres (sub-problemă mai mică).',
            examples: [
              {
                title: 'Exemplu: factorial (cu atenție la overflow)',
                code:
                  `#include <bits/stdc++.h>\nusing namespace std;\n\nlong long fact(int n){\n  if(n<=1) return 1;\n  return n * fact(n-1);\n}\n\nint main(){\n  int n; cin>>n;\n  cout<<fact(n)<<\"\\n\";\n}\n`,
                note: 'Pentru n mare, factorialul depășește rapid `long long`.'
              }
            ]
          }
        ]
      }
    ],
    masteryChecklist: [
      'Pot estima rapid dacă \(O(n^2)\) e ok sau nu.',
      'Știu pattern-ul sortare + binary search.',
      'Scriu recursie cu caz de bază și progres clar.'
    ]
  },
  'databases-sql': {
    moduleSlug: 'databases-sql',
    prerequisites: ['Înțelegi tabele (rânduri/coloane) și chei (id).'],
    objectives: [
      'Să scrii interogări SELECT corecte (WHERE, ORDER BY, LIMIT).',
      'Să combini tabele cu JOIN.',
      'Să agregi date cu GROUP BY/HAVING.'
    ],
    sections: [
      {
        id: 'select-where',
        title: '1) SELECT + WHERE (filtrare corectă)',
        concepts: [
          {
            explanation:
              'Interogarea de bază: `SELECT coloane FROM tabel WHERE condiție`. Filtrarea e echivalentul unui `if` pe rânduri. Folosește operatori (`=`, `<`, `>`, `LIKE`) și atenție la NULL.',
            examples: [
              {
                title: 'Exemplu: elevi cu media >= 9',
                code:
                  `SELECT id, nume, media\nFROM elevi\nWHERE media >= 9\nORDER BY media DESC;\n`
              }
            ]
          }
        ],
        commonMistakes: ['Confuzie între WHERE și HAVING', 'Ignorarea valorilor NULL']
      },
      {
        id: 'joins',
        title: '2) JOIN (conectarea informațiilor)',
        concepts: [
          {
            explanation:
              'JOIN combină rânduri din tabele diferite pe baza unei relații (de obicei cheie străină). Cel mai folosit: `INNER JOIN` (doar potrivirile) și `LEFT JOIN` (păstrează tot din stânga).',
            examples: [
              {
                title: 'Exemplu: elevi și clasa lor',
                code:
                  `SELECT e.nume, c.nume AS clasa\nFROM elevi e\nJOIN clase c ON c.id = e.clasa_id;\n`
              }
            ]
          }
        ]
      },
      {
        id: 'group-by',
        title: '3) GROUP BY (agregare și statistici)',
        concepts: [
          {
            explanation:
              'Agregările (`COUNT`, `SUM`, `AVG`) se aplică pe grupuri. `GROUP BY` definește grupurile, iar `HAVING` filtrează grupurile (nu rândurile).',
            examples: [
              {
                title: 'Exemplu: număr de elevi pe clasă (cu HAVING)',
                code:
                  `SELECT c.nume AS clasa, COUNT(*) AS nr_elevi\nFROM elevi e\nJOIN clase c ON c.id = e.clasa_id\nGROUP BY c.nume\nHAVING COUNT(*) >= 10\nORDER BY nr_elevi DESC;\n`
              }
            ]
          }
        ]
      }
    ],
    masteryChecklist: [
      'Scriu SELECT/WHERE fără ambiguități.',
      'Folosesc JOIN corect pe chei.',
      'Înțeleg diferența WHERE vs HAVING.'
    ]
  },
  'software-architecture': {
    moduleSlug: 'software-architecture',
    prerequisites: ['OOP și proiecte mici în care ai simțit „haosul” codului.'],
    objectives: [
      'Să structurezi un proiect pe module/responsabilități.',
      'Să aplici principii (SRP, separarea straturilor).',
      'Să recunoști pattern-uri uzuale și anti-pattern-uri.'
    ],
    sections: [
      {
        id: 'separation',
        title: '1) Separarea responsabilităților (SRP)',
        concepts: [
          {
            explanation:
              'Principiul SRP: o unitate (funcție/clasă/modul) ar trebui să aibă un singur motiv de schimbare. Practic: separă citirea/validarea de logica de business și de afișare.',
            examples: [
              {
                title: 'Exemplu: funcții separate pentru citire/procesare/afișare',
                code:
                  `// PSEUDOCOD (C++)\nInput readInput();\nResult solve(const Input& in);\nvoid print(const Result& r);\n\nint main(){\n  auto in = readInput();\n  auto r = solve(in);\n  print(r);\n}\n`
              }
            ]
          }
        ],
        quickChecks: ['Ce se întâmplă dacă schimb formatul inputului? Ce părți ar trebui să se modifice?']
      },
      {
        id: 'layers',
        title: '2) Straturi (UI / logică / date)',
        concepts: [
          {
            explanation:
              'O arhitectură „prietenos de întreținut” separă UI-ul de reguli și de accesul la date. Astfel, poți testa logica fără UI și poți schimba baza de date fără să rescrii tot.',
            examples: [
              {
                title: 'Exemplu: dependențe într-o direcție (UI -> Service -> Repo)',
                code:
                  `// UI: apelează Service\n// Service: conține reguli\n// Repo: citește/scrie date\n\nclass UserRepo { /* load/save */ };\nclass UserService {\n  UserRepo& repo;\npublic:\n  explicit UserService(UserRepo& r): repo(r) {}\n  // reguli: validare, calcule etc.\n};\n`
              }
            ]
          }
        ]
      },
      {
        id: 'testing',
        title: '3) Testare (încredere și regresii)',
        concepts: [
          {
            explanation:
              'Testele îți dau feedback rapid. Strategie simplă: testează funcțiile pure (fără I/O) cu cazuri reprezentative + cazuri-limită.',
            examples: [
              {
                title: 'Exemplu: cazuri-limită pentru o funcție de interval',
                code:
                  `// Dacă solve(x, L, R) spune dacă x e în [L,R]\n// Teste: (x=L), (x=R), (x=L-1), (x=R+1)\n`
              }
            ]
          }
        ]
      }
    ],
    masteryChecklist: [
      'Pot separa I/O de logică.',
      'Pot desena un flux UI -> Service -> Data.',
      'Scriu 4-6 teste cu cazuri-limită pentru funcții-cheie.'
    ]
  }
};




