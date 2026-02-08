import { Brain, Boxes, Code2, Database, Network } from 'lucide-react';

export type RoadmapModule = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
};

export const ROADMAP_MODULES: RoadmapModule[] = [
  {
    slug: 'procedural-programming',
    title: 'Procedural Programming',
    subtitle: 'Fundamente',
    description:
      'Învață bazele: variabile, condiții, bucle, funcții și input/output. Aici construiești “reflexele” de programator.',
    icon: Code2
  },
  {
    slug: 'object-oriented',
    title: 'Object Oriented (OOP)',
    subtitle: 'Modelare',
    description:
      'Modelează lumea reală în cod: clase, obiecte, încapsulare, moștenire și polimorfism. Construiești sisteme, nu doar soluții.',
    icon: Boxes
  },
  {
    slug: 'data-structures',
    title: 'Data Structures',
    subtitle: 'Organizare',
    description:
      'Stăpânește structuri de date: liste, stive, cozi, seturi, dicționare, arbori. Datele bine organizate înseamnă cod eficient.',
    icon: Boxes
  },
  {
    slug: 'algorithms-logic',
    title: 'Algorithms & Logic',
    subtitle: 'Eficiență',
    description:
      'Gândește ca un problem-solver: sorting, searching, greedy, recursivitate, complexitate. Treci de la “merge” la “merge rapid”.',
    icon: Brain
  },
  {
    slug: 'databases-sql',
    title: 'Databases & SQL',
    subtitle: 'Persistență',
    description:
      'Lucrează cu date persistente: SQL, join-uri, agregări, modele relaționale. Înveți cum se construiesc aplicații reale.',
    icon: Database
  },
  {
    slug: 'software-architecture',
    title: 'Software Architecture',
    subtitle: 'Mastery',
    description:
      'Arhitectură și gândire de sistem: separarea responsabilităților, design patterns, scalare, mentenabilitate. Nivel “engineer”.',
    icon: Network
  }
];




