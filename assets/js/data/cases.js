/**
 * The ticket queue.
 *
 * One case per shift, mapped one-to-one onto the 26 chunks of the syllabus.
 * Each is a real fault an exam cell would actually raise: who reported it, what
 * breaks if it stays open, and which part of the syllabus is the toolset.
 *
 * The `boss` lines are what the manager says while walking down the aisle. They
 * are written per case, not per level, so the failure lands on the specific
 * thing you were meant to fix.
 */

export const FLOORS = [
  { id: "f1", numeral: "1", name: "Exam Cell", unit: "u1", blurb: "Where the registers live and the results go out." },
  { id: "f2", numeral: "2", name: "Records Office", unit: "u2", blurb: "Admissions, roll numbers, rooms, and the people who own them." },
  { id: "f3", numeral: "3", name: "Server Room", unit: "u3", blurb: "Two racks, no air conditioning, and a file that keeps growing." },
  { id: "f4", numeral: "4", name: "Query Desk", unit: "u4", blurb: "Where every department asks for a number and argues with the answer." },
  { id: "f5", numeral: "5", name: "The Vault", unit: "u6", blurb: "Normalisation, transactions, backups. One door, one key, no excuses." },
];

export const CASES = {
  /* ---------------- Floor 1 — Exam Cell (Unit I) ---------------- */
  "c1-1": {
    ticket: "#1041",
    reporter: "Exam Cell clerk, counter 2",
    subject: "Name mismatch across three registers",
    deadline: "Result publication, 4 hours",
    stake: "A student is fined under a name the college no longer uses. Three registers disagree and nobody can say which is right.",
    toolset: "Redundancy, controlled duplication, the single copy",
    boss: ["One name.", "It is in three files and you could not keep them equal."],
  },
  "c1-2": {
    ticket: "#1044",
    reporter: "Result entry supervisor",
    subject: "Two clerks overwrote each other; one row lost",
    deadline: "Before the 4pm moderation meeting",
    stake: "A mark was entered twice at the same time and one of the two entries vanished with no error shown.",
    toolset: "Concurrency control, integrity enforcement, catalogue",
    boss: ["Two people typed.", "One of them typed for nothing."],
  },
  "c1-3": {
    ticket: "#1047",
    reporter: "Library in-charge",
    subject: "Library staff can see students' phone numbers",
    deadline: "Today, before the privacy notice goes up",
    stake: "The library screen shows the full student record. Nobody needs the phone number to issue a book.",
    toolset: "External schema, views, the two mappings",
    boss: ["They only needed the roll number.", "You gave them everything."],
  },
  "c1-4": {
    ticket: "#1052",
    reporter: "Systems assistant",
    subject: "New disk installed; 200 old reports stopped running",
    deadline: "Before tomorrow's fee reconciliation",
    stake: "The table did not change. The way it is stored did. Two hundred programs noticed.",
    toolset: "Physical data independence, internal schema",
    boss: ["It was the same table.", "Same rows. Same columns. And everything fell over."],
  },
  "c1-5": {
    ticket: "#1055",
    reporter: "Accounts officer",
    subject: "Intern has full rights on the salary table",
    deadline: "Immediately",
    stake: "The new intern can read and edit salaries because the account was created with everything switched on.",
    toolset: "DCL, GRANT and REVOKE, DBA responsibilities",
    boss: ["I asked you to add a column.", "You handed over the payroll instead."],
  },

  /* ---------------- Floor 2 — Records Office (Unit II) ---------------- */
  "c2-1": {
    ticket: "#2011",
    reporter: "Admission clerk",
    subject: "Two phone numbers in one box",
    deadline: "Counselling starts at 9am",
    stake: "A parent wrote two numbers in the phone field. Now neither can be searched, and the third one has nowhere to go.",
    toolset: "Attribute types, multi-valued attributes, atomicity",
    boss: ["One box.", "You cannot search it and you cannot validate it."],
  },
  "c2-2": {
    ticket: "#2014",
    reporter: "Examination branch",
    subject: "Roll number renumbered; eleven tables broke",
    deadline: "End of day",
    stake: "One student changed branch and got a new roll number. Eleven tables keyed on it now point at a student who does not exist.",
    toolset: "Super key, candidate key, primary key, foreign key",
    boss: ["You keyed everything on a number that changes.", "Everything."],
  },
  "c2-3": {
    ticket: "#2018",
    reporter: "Hostel warden",
    subject: "Student address stored six times and counting",
    deadline: "Before the parent-teacher meeting",
    stake: "One student takes six courses, so her address is now in six rows, and two of them disagree with each other.",
    toolset: "Cardinality ratio, M:N relationships, participation",
    boss: ["How many courses does she take?", "That was the question you never asked."],
  },
  "c2-4": {
    ticket: "#2023",
    reporter: "Room allocation clerk",
    subject: "Two exams booked into room 101",
    deadline: "Timetable freeze, 6pm",
    stake: "Room 101 exists in Block A and Block B. The booking system thinks they are the same room and has double-booked both.",
    toolset: "Weak entities, partial keys, identifying relationships",
    boss: ["Which block?", "You never stored which block."],
  },
  "c2-5": {
    ticket: "#2027",
    reporter: "Establishment section",
    subject: "Clerk rows are two-thirds NULL",
    deadline: "Before the staff audit",
    stake: "Every clerk row carries a NULL salary and a NULL roll number. The table cannot say what the department knows.",
    toolset: "Specialisation, generalisation, inheritance, constraints",
    boss: ["Salary is for faculty.", "Your table cannot say that, so it says nothing."],
  },

  /* ---------------- Floor 3 — Server Room (Unit III) ---------------- */
  "c3-1": {
    ticket: "#3002",
    reporter: "Result lookup helpline",
    subject: "One roll number takes ten thousand block reads",
    deadline: "Results go live in 3 hours",
    stake: "The lookup reads every block on the disk to find one student, and times out under load on publication day.",
    toolset: "File organisation, blocking factor, cost in block accesses",
    boss: ["One student.", "Ten thousand reads to find one student."],
  },
  "c3-2": {
    ticket: "#3005",
    reporter: "Server room, overnight job",
    subject: "Old index file crawling after a year of inserts",
    deadline: "Before the midnight batch",
    stake: "The indexed sequential file was fast in January. A year of inserts has pushed everything into overflow chains.",
    toolset: "ISAM, prime and overflow areas, reorganisation",
    boss: ["It was fast last year.", "You never rebalanced it."],
  },
  "c3-3": {
    ticket: "#3009",
    reporter: "DBA on call",
    subject: "Index too deep; every lookup pays for it",
    deadline: "Tonight",
    stake: "The index is a tree with a node per block and a height that grows with the file. Every lookup pays the full height.",
    toolset: "B tree and B+ tree, order, splits, fanout",
    boss: ["A million rows in three reads.", "You built a tree that needs twenty."],
  },
  "c3-4": {
    ticket: "#3012",
    reporter: "Query desk",
    subject: "Equality lookup should be one read, not thirteen",
    deadline: "Before the fee counter opens",
    stake: "Exact-key lookups are being served by a sorted file and a binary search. The file does not need to be searched at all.",
    toolset: "Hashing, hash functions, buckets",
    boss: ["You knew the exact key.", "So why did you search?"],
  },
  "c3-5": {
    ticket: "#3016",
    reporter: "Server room, capacity review",
    subject: "Hash file doubled; every bucket overflowing",
    deadline: "Before admissions season",
    stake: "The file grew past its bucket count. Either the chains keep growing or the whole file gets rehashed overnight with the system down.",
    toolset: "Collision resolution, extendible and dynamic hashing",
    boss: ["The file doubled.", "Your bucket count did not."],
  },

  /* ---------------- Floor 4 — Query Desk (Unit IV) ---------------- */
  "c4-1": {
    ticket: "#4003",
    reporter: "Academic section",
    subject: "B.Sc and BSc counted as two programmes",
    deadline: "Before the programme census",
    stake: "One programme is reported as two because a trailing space and a capital letter were never constrained. The count is wrong and looks reasonable.",
    toolset: "Domains, atomic values, tuples, NULL",
    boss: ["The college has one programme.", "Your report says two."],
  },
  "c4-2": {
    ticket: "#4006",
    reporter: "Internal audit",
    subject: "Marks of minus five accepted; department code dangling",
    deadline: "Audit reply, tomorrow noon",
    stake: "The marks column takes any number. A department code points at a department that was deleted last year, and the report still prints it.",
    toolset: "Domain, key, entity integrity, referential integrity",
    boss: ["Minus five.", "And a department that does not exist."],
  },
  "c4-3": {
    ticket: "#4009",
    reporter: "Dean's office",
    subject: "'Scored above sixty under Dr Rao' returns three different answers",
    deadline: "Before the academic council",
    stake: "Three people wrote the query three ways and got three numbers. Nobody can prove which one is the question that was asked.",
    toolset: "Selection, projection, join, closure",
    boss: ["Three answers.", "Nobody can say which question was asked."],
  },
  "c4-4": {
    ticket: "#4013",
    reporter: "Sports office",
    subject: "Team lists return 41 names for 38 students",
    deadline: "Before the inter-college entry",
    stake: "Cricket or quiz returns 41 rows because three students are in both teams and the duplicate was never removed.",
    toolset: "UNION, INTERSECT, MINUS, union compatibility",
    boss: ["Forty-one names.", "Thirty-eight students. Where did the other three come from?"],
  },
  "c4-5": {
    ticket: "#4017",
    reporter: "Course coordinator",
    subject: "'Average per course' query errors out",
    deadline: "Today",
    stake: "The condition on the average was put in WHERE, which runs before any group exists. The statement fails and the report is late.",
    toolset: "Logical evaluation order, GROUP BY, HAVING, joins",
    boss: ["The average did not exist yet.", "You filtered on it anyway."],
  },

  /* ---------------- Floor 5 — The Vault (Unit VI) ---------------- */
  "c6-1": {
    ticket: "#5002",
    reporter: "Establishment section",
    subject: "HOD name repeated on three hundred rows",
    deadline: "Before the new head takes charge",
    stake: "The department gets a new head tomorrow. One fact lives on three hundred student rows and four of them will be missed.",
    toolset: "Functional dependency, Armstrong's axioms, closure",
    boss: ["One fact.", "Three hundred rows. Four will be wrong by Monday."],
  },
  "c6-2": {
    ticket: "#5006",
    reporter: "Academic section",
    subject: "Repeating subject groups in one cell",
    deadline: "Before subject registration",
    stake: "Subjects are typed into one cell separated by commas. Counting how many students take Physics means parsing a string.",
    toolset: "1NF, 2NF, 3NF, partial and transitive dependency",
    boss: ["How many take Physics?", "You cannot answer that, and it is your own table."],
  },
  "c6-3": {
    ticket: "#5009",
    reporter: "Query desk",
    subject: "After the split, the same query returns more rows",
    deadline: "Before the fee report",
    stake: "A table was decomposed to remove redundancy. Rejoining it now produces combinations that never existed, and the report is inflated.",
    toolset: "Lossless join, dependency preservation, decomposition",
    boss: ["You invented rows.", "Not lost them. Invented them."],
  },
  "c6-4": {
    ticket: "#5013",
    reporter: "Accounts officer",
    subject: "Five thousand rupees left one account and arrived nowhere",
    deadline: "Reconciliation, this evening",
    stake: "The machine died between the debit and the credit. The debit is on disk, the credit never happened, and the total does not add up.",
    toolset: "Transactions, ACID, log and rollback",
    boss: ["The money left.", "You cannot say where it went."],
  },
  "c6-5": {
    ticket: "#5016",
    reporter: "Fee counter",
    subject: "Two clerks, one balance, one update lost",
    deadline: "Before the counter closes",
    stake: "Both clerks read the same balance, both added a payment, both saved. One payment vanished and both of them think it worked.",
    toolset: "Locking, two-phase locking, serializability, deadlock",
    boss: ["Both of them said it worked.", "One of them is lying, and it is not the clerk."],
  },
  "c6-6": {
    ticket: "#5020",
    reporter: "Nobody. It is 11:58 on result day.",
    subject: "Disk failed; last backup is from last night",
    deadline: "Results, 12 noon",
    stake: "The disk is gone, the backup is a day old, and nobody can say which of this morning's entries actually committed.",
    toolset: "Write-ahead logging, checkpoints, recovery, authorisation",
    boss: ["Twelve noon.", "The results are due at twelve noon."],
  },
};

export function caseFor(conceptId) {
  return CASES[conceptId] || null;
}

export function floorFor(unitId) {
  return FLOORS.find((f) => f.unit === unitId) || FLOORS[0];
}
