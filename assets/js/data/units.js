/**
 * The syllabus map is the single source of scope (FR-3).
 * Changing what is examinable is a change to this file and nothing else.
 *
 * Source: C.C.S. University, Meerut — B.C.A. Semester V, BCA-501 Introduction to DBMS.
 * Units I, II, III, IV and VI are mapped. Unit V (EER to relational mapping) is
 * deliberately absent, so the item selector cannot reach it in default mode.
 */

export const SUBJECT = {
  code: "BCA-501",
  title: "Introduction to DBMS",
  programme: "B.C.A. Semester V",
  university: "C.C.S. University, Meerut",
  papers: "Dec 2023 · Dec 2024 · Dec 2025",
};

/**
 * examWeight is derived from how often each unit was examined in the three
 * verified papers, not assigned by feel. Counts are recorded beside it.
 */
export const UNITS = [
  {
    id: "u1",
    numeral: "I",
    title: "Introduction",
    syllabus:
      "Characteristics of database approach, data models, DBMS architecture and data independence.",
    examWeight: 1.0,
    paperHits: 20,
    weightBasis:
      "20 question-parts across Dec 2023/24/25 — the most examined unit in the paper.",
  },
  {
    id: "u2",
    numeral: "II",
    title: "E-R Modelling",
    syllabus:
      "Entity types, entity set, attribute and key, relationships, relation types, roles and structural constraints, weak entities, enhanced E-R and object modelling, sub classes, super classes, inheritance, specialisation and generalisation.",
    examWeight: 0.9,
    paperHits: 14,
    weightBasis:
      "14 question-parts, and an ER diagram is set in all three papers — the highest-value drawing question.",
  },
  {
    id: "u3",
    numeral: "III",
    title: "File Organisation",
    syllabus:
      "Indexed sequential access files, implementation using B and B++ trees, hashing, hashing functions, collision resolution, extendible hashing, dynamic hashing approach, implementation and performance.",
    examWeight: 0.35,
    paperHits: 1,
    weightBasis:
      "1 question-part in three years (Dec 2025, Q2). Low frequency, but the only question in the paper nobody can bluff.",
  },
  {
    id: "u4",
    numeral: "IV",
    title: "Relational Data Model and SQL",
    syllabus:
      "Relational model concepts, relational constraints, relational algebra. SQL queries, programming using SQL.",
    examWeight: 0.7,
    paperHits: 6,
    weightBasis:
      "6 question-parts, including relational algebra and set operators in Dec 2024.",
  },
  {
    id: "u6",
    numeral: "VI",
    title: "Normalisation, Transactions and Security",
    syllabus:
      "Data Normalization: functional dependencies, normal forms up to 3rd normal form. Concurrency control: transaction processing, locking techniques, database recovery, security and authorization, recovery techniques.",
    examWeight: 0.85,
    paperHits: 5,
    weightBasis:
      "5 question-parts, but each is worth 15 marks — normalisation and ACID are the two heaviest single answers in the paper.",
  },
];

/**
 * Controlled vocabulary for misconception tags (FR-6). A mistake entry must
 * name one of these; free text is not allowed, so that entries can be counted.
 */
export const MISCONCEPTIONS = {
  "redundancy-not-named":
    "Saw the symptom but did not name the underlying redundancy.",
  "mechanism-missing":
    "Named the concept but not the mechanism that makes it work.",
  "definition-only":
    "Reproduced a definition without using it on the case given.",
  "key-confusion":
    "Confused super key, candidate key and primary key.",
  "constraint-mix":
    "Attributed a rule to the wrong constraint class.",
  "notation-slip":
    "Relational algebra or SQL notation used incorrectly.",
  "partial-vs-transitive":
    "Confused a partial dependency with a transitive one.",
  "no-example":
    "Answered in the abstract with no example, in a question that asks for one.",
  "cost-not-stated":
    "Described the benefit but not what it costs, where the question asked for both.",
  "cardinality-unstated":
    "Omitted the cardinality or participation constraint that decides the design.",
  "order-of-evaluation":
    "Assumed clauses run in the order they are written.",
  "unsafe-normalisation":
    "Normalised without checking the decomposition was lossless.",
  "wrong-isolation":
    "Attributed a concurrency symptom to the wrong ACID property.",
  "incomplete-list":
    "List question answered with fewer items than the marks require.",
};

/** Publish gate (AC-7.2): a concept cannot appear without all of these. */
export const PUBLISH_RULES = {
  requireSyllabusTag: true,
  minPredictionGates: 1,
  minRubricItems: 3,
  minBeats: 4,
  requiredBeatOrder: ["problem", "failure", "mechanism", "cost"],
};

export const SCHEDULE = {
  /** FR-3: review at approximately 1, 3 and 10 days, then open-ended. */
  intervalsDays: [1, 3, 10, 30],
  /** AC-3.5 / AC-6.3: nothing is mastered or resolved inside this window. */
  delayedPassDays: 7,
  /** FR-3: at least 30% of a chapter retrieval set is interleaved. */
  interleaveRatio: 0.3,
  /** FR-5: a unit verdict is suppressed below this many attempts (AC-5.3). */
  minCalibrationSample: 8,
  /** FR-5: over-confidence above this gap raises review frequency. */
  overconfidenceGap: 0.2,
};
