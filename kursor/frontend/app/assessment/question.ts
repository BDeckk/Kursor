type RIASEC = "R" | "I" | "A" | "S" | "E" | "C";

export const questions: { id: number; question: string; category: RIASEC }[] = [
  // Realistic (R)
  { id: 1, question: "I like to work on cars.", category: "R" },
  { id: 2, question: "I like to build things.", category: "R" },
  { id: 3, question: "I enjoy working outdoors.", category: "R" },
  { id: 4, question: "I like to repair machines.", category: "R" },
  { id: 5, question: "I enjoy using tools.", category: "R" },
  { id: 6, question: "I like to work with my hands.", category: "R" },
  { id: 7, question: "I prefer practical tasks over theoretical ones.", category: "R" },

  // Investigative (I)
  { id: 8, question: "I like to do puzzles.", category: "I" },
  { id: 9, question: "I enjoy solving math problems.", category: "I" },
  { id: 10, question: "I like to analyze data.", category: "I" },
  { id: 11, question: "I am curious about how things work.", category: "I" },
  { id: 12, question: "I like to conduct experiments.", category: "I" },
  { id: 13, question: "I enjoy researching new ideas.", category: "I" },
  { id: 14, question: "I prefer thinking deeply about problems.", category: "I" },

  // Artistic (A)
  { id: 15, question: "I like to draw, paint, or do crafts.", category: "A" },
  { id: 16, question: "I enjoy writing stories or poems.", category: "A" },
  { id: 17, question: "I like to play a musical instrument.", category: "A" },
  { id: 18, question: "I enjoy performing arts (acting, dancing, etc.).", category: "A" },
  { id: 19, question: "I like to design or decorate things.", category: "A" },
  { id: 20, question: "I enjoy expressing myself creatively.", category: "A" },
  { id: 21, question: "I prefer unstructured, creative activities.", category: "A" },

  // Social (S)
  { id: 22, question: "I like to help people solve their problems.", category: "S" },
  { id: 23, question: "I enjoy teaching others.", category: "S" },
  { id: 24, question: "I like to volunteer for community service.", category: "S" },
  { id: 25, question: "I enjoy working with children or the elderly.", category: "S" },
  { id: 26, question: "I am good at listening and supporting others.", category: "S" },
  { id: 27, question: "I like to work in groups.", category: "S" },
  { id: 28, question: "I prefer helping others rather than working with things.", category: "S" },

  // Enterprising (E)
  { id: 29, question: "I like to lead and persuade people.", category: "E" },
  { id: 30, question: "I enjoy public speaking.", category: "E" },
  { id: 31, question: "I like to sell products or ideas.", category: "E" },
  { id: 32, question: "I enjoy starting new projects or businesses.", category: "E" },
  { id: 33, question: "I like to compete and win.", category: "E" },
  { id: 34, question: "I enjoy convincing people of my viewpoint.", category: "E" },
  { id: 35, question: "I prefer taking risks to achieve success.", category: "E" },

  // Conventional (C)
  { id: 36, question: "I like to organize files and keep things in order.", category: "C" },
  { id: 37, question: "I enjoy working with numbers or financial records.", category: "C" },
  { id: 38, question: "I like to follow set procedures and rules.", category: "C" },
  { id: 39, question: "I enjoy clerical tasks like typing or filing.", category: "C" },
  { id: 40, question: "I like to keep detailed records.", category: "C" },
  { id: 41, question: "I enjoy routine, structured tasks.", category: "C" },
  { id: 42, question: "I prefer clear instructions over ambiguous tasks.", category: "C" },
];
