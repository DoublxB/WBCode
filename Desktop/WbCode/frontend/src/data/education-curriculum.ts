export type EducationSubtopic = {
  id: string;
  title: string;
  targetProblems: number;
  /**
   * Preferred matching: CodingExercise.category tags.
   * If present, UI counts/filtering will use these instead of keywords.
   */
  matchCategories?: string[];
  /**
   * Used to match existing CodingExercise.category/title.
   * Keep these short, lowercase keywords.
   */
  matchKeywords: string[];
};

export type EducationTrack = {
  id: string;
  title: string;
  grade: string;
  focus: string;
  totalTargetProblems: number;
  subtopics: EducationSubtopic[];
};

/**
 * Curriculum (RO) – used in professor UI for picking existing problems and tracking coverage.
 * NOTE: This is display + filtering only; it does not enforce counts.
 */
export const EDUCATION_CURRICULUM: EducationTrack[] = [
  {
    id: 'pp-ix',
    title: 'Programare Procedurală',
    grade: 'Clasa a IX-a',
    focus: 'Fundamentele logicii și sintaxei Python.',
    totalTargetProblems: 170,
    subtopics: [
      {
        id: 'pp-syntax-io',
        title: 'Sintaxă și Operatori (Input/Output)',
        targetProblems: 15,
        matchCategories: ['edu:pp-syntax-io'],
        matchKeywords: ['io', 'input', 'output', 'operator', 'operat', 'afiseaza', 'afișează', 'citește', 'citeste']
      },
      {
        id: 'pp-if-else',
        title: 'Structura Alternativă (if/else)',
        targetProblems: 25,
        matchCategories: ['edu:pp-if'],
        matchKeywords: ['conditie', 'condiție', 'compar', 'egal', 'bisect', 'triunghi', 'discount']
      },
      {
        id: 'pp-loops',
        title: 'Structuri Repetitive (for/while)',
        targetProblems: 40,
        matchCategories: ['edu:pp-loops'],
        matchKeywords: ['bucle', 'for', 'while', 'iter', 'repet']
      },
      {
        id: 'pp-numbers',
        title: 'Prelucrarea numerelor (cifre, divizibilitate, numere prime)',
        targetProblems: 40,
        matchCategories: ['edu:pp-numbers'],
        matchKeywords: ['cifre', 'diviz', 'prime', 'numar', 'număr', 'cmmdc', 'palindrom', 'ciur']
      },
      {
        id: 'pp-lists',
        title: 'Liste/Vectori (unidimensionale)',
        targetProblems: 50,
        matchCategories: ['edu:pp-lists'],
        matchKeywords: ['list', 'lista', 'vector', 'array', 'sort', 'frecvent']
      }
    ]
  },
  {
    id: 'ds-x-xi',
    title: 'Structuri de Date',
    grade: 'Clasa a X-a & XI-a',
    focus: 'Organizarea datelor în memorie.',
    totalTargetProblems: 140,
    subtopics: [
      { id: 'ds-strings', title: 'Șiruri de caractere (String manipulation)', targetProblems: 30, matchKeywords: ['string', 'sir', 'substring', 'palindrom'] },
      { id: 'ds-matrices', title: 'Tablouri Bidimensionale (Matrice)', targetProblems: 40, matchKeywords: ['matrice', 'matrix', '2d', 'bidim'] },
      { id: 'ds-dicts-sets', title: 'Dicționare și Seturi (Specific Python)', targetProblems: 25, matchKeywords: ['dict', 'dictionary', 'set', 'hash', 'map'] },
      { id: 'ds-dynamic', title: 'Structuri de date dinamice (Liste înlănțuite, Stive, Cozi)', targetProblems: 25, matchKeywords: ['lista inlant', 'linked', 'stack', 'queue', 'stiva', 'coada'] },
      { id: 'ds-trees', title: 'Arbori (Binari, de Căutare)', targetProblems: 20, matchKeywords: ['arbore', 'tree', 'bst', 'binary'] }
    ]
  },
  {
    id: 'oop-xi',
    title: 'Programare Orientată pe Obiect - OOP',
    grade: 'Clasa a XI-a',
    focus: 'Modelarea sistemelor complexe.',
    totalTargetProblems: 55,
    subtopics: [
      { id: 'oop-basics', title: 'Clase și Obiecte (Instanțiere, __init__)', targetProblems: 15, matchKeywords: ['class', 'object', '__init__', 'instanti'] },
      { id: 'oop-encapsulation', title: 'Încapsulare și Proprietăți (@property)', targetProblems: 10, matchKeywords: ['encaps', 'property', '@property', 'getter', 'setter'] },
      { id: 'oop-inheritance', title: 'Moștenire și Compoziție', targetProblems: 15, matchKeywords: ['inherit', 'mosten', 'composition', 'compoz'] },
      { id: 'oop-polymorphism', title: 'Polimorfism și Metode Speciale (Dunder methods)', targetProblems: 10, matchKeywords: ['polym', 'dunder', '__str__', '__repr__', '__lt__'] },
      { id: 'oop-refactor', title: 'Proiecte de Refactoring (Procedural -> OOP)', targetProblems: 5, matchKeywords: ['refactor', 'oop', 'design', 'class'] }
    ]
  },
  {
    id: 'algo-xi',
    title: 'Algoritmică',
    grade: 'Clasa a XI-a',
    focus: 'Optimizarea și tehnici avansate de rezolvare.',
    totalTargetProblems: 130,
    subtopics: [
      { id: 'algo-recursion', title: 'Recursivitate', targetProblems: 20, matchKeywords: ['recurs', 'recursion'] },
      { id: 'algo-search-sort', title: 'Căutare și Sortare Avansată (Binary Search, QuickSort, MergeSort)', targetProblems: 25, matchKeywords: ['binary search', 'quicksort', 'mergesort', 'sort', 'search'] },
      { id: 'algo-greedy-dp', title: 'Metoda Greedy și Programare Dinamică', targetProblems: 30, matchKeywords: ['greedy', 'dp', 'dinamic', 'dynamic programming'] },
      { id: 'algo-backtracking', title: 'Metoda Backtracking', targetProblems: 25, matchKeywords: ['backtracking', 'bt'] },
      { id: 'algo-graphs', title: 'Algoritmi pe Grafuri (Parcurgeri, Drum minim)', targetProblems: 30, matchKeywords: ['graf', 'graph', 'bfs', 'dfs', 'dijkstra'] }
    ]
  },
  {
    id: 'db-xii',
    title: 'Baze de Date',
    grade: 'Clasa a XII-a',
    focus: 'Gestiunea datelor persistente.',
    totalTargetProblems: 85,
    subtopics: [
      { id: 'db-ddl', title: 'Crearea Tabelelor și Tipuri de Date (DDL)', targetProblems: 10, matchKeywords: ['ddl', 'create table', 'alter', 'schema'] },
      { id: 'db-select', title: 'Interogări Simple (SELECT, WHERE, ORDER BY)', targetProblems: 20, matchKeywords: ['select', 'where', 'order by'] },
      { id: 'db-joins', title: 'Relații și Join-uri (INNER, LEFT, RIGHT)', targetProblems: 25, matchKeywords: ['join', 'inner join', 'left join', 'right join'] },
      { id: 'db-group', title: 'Agregări și Grupări (GROUP BY, HAVING)', targetProblems: 20, matchKeywords: ['group by', 'having', 'count', 'sum', 'avg'] },
      { id: 'db-design', title: 'Proiecte de design (Modelarea unei baze de date de la zero)', targetProblems: 10, matchKeywords: ['design', 'model', 'er', 'normalizare'] }
    ]
  }
];


