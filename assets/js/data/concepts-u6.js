/**
 * Beat scripts for Unit VI — normalisation, transactions, concurrency,
 * recovery and security. The heaviest single answers in the paper.
 */

export const CONCEPTS_U6 = [
  {
    id: "c6-1",
    unit: "u6",
    title: "The HOD is written on every student's row",
    syllabusTag: "UNIT-VI · functional dependencies",
    hook: "The department gets a new head. You must update one fact in three hundred rows, and the clerk who does it will miss four.",
    beats: [
      {
        kind: "problem",
        text: "In Student(roll, name, dept, dept_hod) the head's name is repeated for every student in the department. It is one fact stored many times, so it can be updated inconsistently, and it must be updated everywhere to remain true. Nothing in the design says the HOD depends on the department rather than on the student, so nothing prevents the table from disagreeing with itself.",
      },
      {
        kind: "failure",
        text: "The obvious fix is a rule that the HOD is updated for every row in the department. It fails on the same ground as any hand-maintained rule: it is not enforced, the anomaly returns with the next clerk, and no query can find the rows that were missed.",
      },
      {
        kind: "mechanism",
        text: "Write the dependency down. X → Y means that any two tuples agreeing on X must agree on Y. Here roll → dept and dept → dept_hod. Armstrong's axioms — reflexivity, augmentation, transitivity — let you derive the rest: by transitivity roll → dept_hod. The closure X+ is every attribute derivable from X, and a candidate key is an X whose closure is the whole relation. A minimal cover removes extraneous attributes and redundant dependencies, leaving the smallest set that implies all the rest. Two shapes of bad dependency follow: a partial dependency, where an attribute depends on part of a composite key, and a transitive one, where a non-key attribute depends on another non-key attribute.",
        figure: {
          type: "table",
          caption: "Three kinds of dependency, told apart by what the left side is.",
          columns: ["Dependency", "Left side", "Example", "Verdict"],
          rows: [
            ["Full", "Whole candidate key", "roll → name", "Fine"],
            ["Partial", "Part of a composite key", "(roll, course) → name, via roll", "Violates 2NF"],
            ["Transitive", "A non-key attribute", "roll → dept → dept_hod", "Violates 3NF"],
          ],
          mark: [{ r: 1, c: 3, tone: "miss" }, { r: 2, c: 3, tone: "miss" }],
        },
      },
      {
        kind: "cost",
        text: "Computing a closure is exponential in the number of attributes for the naive algorithm, so real tools use linear-time approximations. More importantly, the dependency set is a judgement: real schemas have dozens of dependencies, some of them only true in the current data, and choosing which to declare is a design decision that no algorithm makes for you.",
      },
    ],
    gate: {
      id: "g6-1",
      prompt:
        "Given roll → dept and dept → dept_hod, does roll → dept_hod hold?",
      options: [
        {
          text: "No — the head depends on the department, not the student.",
          correct: false,
          why: "The dependency is about values agreeing, not about causation. Transitivity still derives it.",
        },
        {
          text: "Yes — by transitivity.",
          correct: true,
          why: "Two tuples with the same roll have the same dept, hence the same HOD. That is exactly Armstrong's transitivity rule.",
        },
        {
          text: "Only if dept is a candidate key.",
          correct: false,
          why: "That condition concerns BCNF, not whether the dependency can be derived.",
        },
        {
          text: "Only if the relation is already in 3NF.",
          correct: false,
          why: "The dependency holds in the data regardless of the normal form; it is precisely what violates 3NF.",
        },
      ],
    },
    items: [
      {
        id: "i6-1-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Write short notes on functional dependency, including Armstrong's axioms and the closure of a set of attributes.",
        rubric: [
          {
            label: "Defines X → Y: tuples agreeing on X must agree on Y.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "States reflexivity, augmentation and transitivity, correctly.",
            marks: 2,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Closure X+ as the set of all attributes derivable from X, and the use of closure to find candidate keys.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "A functional dependency X → Y holds when any two tuples that agree on all attributes of X also agree on Y. Armstrong's axioms generate every dependency implied by a given set: reflexivity, where Y ⊆ X gives X → Y; augmentation, where X → Y gives XZ → YZ; and transitivity, where X → Y and Y → Z give X → Z. The closure X+ is the set of attributes functionally determined by X under the given set; X is a candidate key exactly when X+ is the whole relation and no proper subset of X has that property.",
      },
      {
        id: "i6-1-2",
        kind: "practice",
        marks: 4,
        prompt:
          "R(A, B, C, D) with FDs A → B, B → C, and (A, D) → E is not part of R. Find the candidate key of R(A, B, C, D) and justify it.",
        rubric: [
          {
            label: "Computes the closure of A: A+ = {A, B, C}, which is not all of R.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Adds D: (A, D)+ = {A, B, C, D}, so (A, D) is a super key.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Checks minimality: neither A nor D alone determines all attributes, so (A, D) is the only candidate key.",
            marks: 0.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "A+ = {A, B, C} using A → B and B → C, which does not cover D, so A is not a key. (A, D)+ = {A, D, B, C} = R, so (A, D) is a super key. Neither A+ nor D+ covers R, so it is minimal. The only candidate key is (A, D).",
      },
      {
        id: "i6-1-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Distinguish a partial dependency from a transitive dependency, with one example of each.",
        rubric: [
          {
            label: "Partial: a non-prime attribute depends on part of a composite candidate key.",
            marks: 1.5,
            tag: "partial-vs-transitive",
            beat: 2,
          },
          {
            label: "Transitive: a non-prime attribute depends on another non-prime attribute.",
            marks: 1.5,
            tag: "partial-vs-transitive",
            beat: 2,
          },
        ],
        model:
          "A partial dependency exists when a non-prime attribute depends on only part of a composite candidate key, as in ENROLS(roll, course, student_name) where roll alone determines student_name. A transitive dependency exists when a non-prime attribute depends on another non-prime attribute, as in STUDENT(roll, dept, dept_hod) where dept_hod depends on dept, which is not a key. The first is removed by 2NF, the second by 3NF.",
      },
    ],
  },

  {
    id: "c6-2",
    unit: "u6",
    title: "Three normal forms, three specific anomalies",
    syllabusTag: "UNIT-VI · normal forms up to 3NF",
    hook: "The subjects column holds Physics, Chemistry, Maths in one cell. Splitting it into three columns works until a student takes four.",
    beats: [
      {
        kind: "problem",
        text: "A repeating group in one cell makes the data unqueryable: you cannot count how many students take Physics without parsing strings, and a fourth subject has nowhere to go. Below that sit two more anomalies: a fact about a student repeated once per course they take, and a fact about a department repeated once per student.",
      },
      {
        kind: "failure",
        text: "The obvious fix for the repeating group is more columns — sub1, sub2, sub3. It fails the moment a student takes four subjects, and it forces every query to consider three columns where one table row would do.",
      },
      {
        kind: "mechanism",
        text: "Each normal form removes one specific anomaly. 1NF: every attribute holds a single atomic value, no repeating groups. 2NF: in 1NF, and no non-prime attribute is partially dependent on a candidate key — this only bites when the key is composite. 3NF: in 2NF, and no non-prime attribute is transitively dependent on a key. BCNF: every determinant is a super key, which catches the case 3NF misses when there are overlapping candidate keys. In practice you test by asking, for each dependency, what is on the left: part of a key means 2NF, a non-key means 3NF, a non-superkey determinant means BCNF.",
        figure: {
          type: "table",
          caption: "The classic decomposition, worked on one relation.",
          columns: ["Step", "Relation", "Anomaly removed"],
          rows: [
            ["Unnormalised", "STUDENT(roll, name, {subjects})", "—"],
            ["1NF", "STUDENT(roll, name, subject)", "Repeating group"],
            ["2NF", "STUDENT(roll, name), TAKES(roll, subject)", "Partial dependency on roll"],
            ["3NF", "STUDENT(roll, name, dept), DEPT(dept, hod)", "Transitive dependency"],
            ["BCNF", "As above, when every determinant is a super key", "Anomaly from overlapping keys"],
          ],
          mark: [{ r: 2, c: 2, tone: "hit" }, { r: 3, c: 2, tone: "hit" }],
        },
      },
      {
        kind: "cost",
        text: "Every normal form adds a relation and therefore a join. A 3NF schema answering a simple report may need four joins where the unnormalised table needed none, and that is a real cost on read-heavy systems. Deliberate denormalisation is legitimate — but it is a decision to accept a named anomaly, not a licence to ignore dependencies.",
      },
    ],
    gate: {
      id: "g6-2",
      prompt: "A relation is in 2NF if it is in 1NF and:",
      options: [
        {
          text: "It has no transitive dependency.",
          correct: false,
          why: "That is 3NF's condition.",
        },
        {
          text: "No non-prime attribute is partially dependent on a candidate key.",
          correct: true,
          why: "2NF removes partial dependencies — an attribute depending on part of a composite key.",
        },
        {
          text: "Every determinant is a super key.",
          correct: false,
          why: "That is BCNF.",
        },
        {
          text: "It has no multi-valued dependency.",
          correct: false,
          why: "That is 4NF, beyond this syllabus.",
        },
      ],
    },
    items: [
      {
        id: "i6-2-1",
        kind: "exit",
        marks: 7.5,
        prompt:
          "Define normal forms. Explain 1NF, 2NF, 3NF and BCNF with a suitable example.",
        rubric: [
          {
            label: "Defines normalisation as organising attributes into relations to remove redundancy and anomalies.",
            marks: 1,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "1NF with atomic values and no repeating groups, shown on an example.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "2NF defined against partial dependency, with the composite-key case shown.",
            marks: 1.5,
            tag: "partial-vs-transitive",
            beat: 2,
          },
          {
            label: "3NF defined against transitive dependency, with an example.",
            marks: 1.5,
            tag: "partial-vs-transitive",
            beat: 2,
          },
          {
            label: "BCNF defined as every determinant being a super key, and distinguished from 3NF.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
        ],
        model:
          "Normalisation is the process of decomposing relations so that redundancy and the resulting insertion, deletion and update anomalies are removed, each form removing one specific dependency. 1NF requires atomic values and no repeating groups, so a subjects list in one cell becomes one row per subject. 2NF requires no partial dependency, so in TAKES(roll, subject, student_name) the student_name, determined by roll alone, moves to STUDENT. 3NF requires no transitive dependency, so in STUDENT(roll, dept, dept_hod) the HOD, determined by dept, moves to DEPT. BCNF requires every determinant to be a super key; it is stricter than 3NF and catches relations with overlapping candidate keys where a non-superkey still determines an attribute.",
      },
      {
        id: "i6-2-2",
        kind: "practice",
        marks: 4,
        prompt:
          "Normalise ENROLS(roll, student_name, course, course_teacher) to 3NF, given roll → student_name and course → course_teacher.",
        rubric: [
          {
            label: "Identifies the composite key (roll, course) and that the relation is already in 1NF.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Removes partial dependencies to give STUDENT(roll, student_name) and COURSE(course, course_teacher).",
            marks: 2,
            tag: "partial-vs-transitive",
            beat: 2,
          },
          {
            label: "Leaves ENROLS(roll, course) with both attributes as foreign keys, and checks no transitive dependency remains.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "The key is (roll, course), so 1NF holds. Both student_name and course_teacher depend on part of that key, which are partial dependencies: STUDENT(roll, student_name) and COURSE(course, course_teacher) remove them. What remains is ENROLS(roll, course) with roll and course as a composite primary key and both as foreign keys. No non-prime attribute remains, so there is no transitive dependency and the decomposition is in 3NF.",
      },
      {
        id: "i6-2-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Explain normalisation with its advantages, and state one situation where denormalisation is justified.",
        rubric: [
          {
            label: "States the advantages: less redundancy, fewer update/insert/delete anomalies, better consistency and simpler constraints.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Justifies denormalisation for read-heavy reporting or to avoid a costly join, accepting a named anomaly.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "Normalisation removes redundancy by ensuring each fact is stored once, which eliminates the update anomaly where copies disagree, the insertion anomaly where a fact cannot be recorded without inventing a row, and the deletion anomaly where removing a row destroys an unrelated fact. It also makes constraints expressible. Denormalisation is justified when reads dominate and a join is the bottleneck — a reporting or analytics table — provided the duplication is documented and the anomaly it reintroduces is accepted knowingly.",
      },
    ],
  },

  {
    id: "c6-3",
    unit: "u6",
    title: "A decomposition that invents rows",
    syllabusTag: "UNIT-VI · decomposition, lossless join",
    hook: "You split a table to remove redundancy. The same query now returns more rows than before, and the extra rows are not errors — they are rows you created.",
    beats: [
      {
        kind: "problem",
        text: "Decomposition is not automatically safe. Split R(A, B, C) into R1(A, B) and R2(A, C) and rejoin them: if two tuples shared the same A value, the join pairs each B with each C, producing combinations that never existed. The information is not lost — it is invented, which is worse.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to decompose only on the primary key. It fails as a general rule, because the condition concerns the common attribute between the two fragments, not the original key, and a decomposition into three or more relations needs a test that checks them all.",
      },
      {
        kind: "mechanism",
        text: "Two properties must be checked. Lossless join: for a binary decomposition, the common attributes must be a super key of at least one fragment — then the natural join reconstructs exactly the original relation. For a general decomposition, the chase test decides it. Dependency preservation: the union of the dependencies projected onto each fragment must imply all the original dependencies, so that every constraint can still be checked without a join. The synthesis algorithm gives a 3NF decomposition that is both lossless and dependency preserving; a BCNF decomposition is lossless but may not preserve dependencies.",
        figure: {
          type: "compare",
          caption: "Two decompositions of R(A, B, C) with A → B and B → C.",
          good: {
            title: "R1(A, B), R2(B, C)",
            items: [
              "Common attribute B is a key of R2",
              "Natural join reconstructs R exactly",
              "Both dependencies preserved",
            ],
          },
          bad: {
            title: "R1(A, B), R2(A, C)",
            items: [
              "Common attribute A is a key of R1 — this one survives",
              "But B → C is not preserved in either fragment",
              "The constraint can no longer be checked without a join",
            ],
          },
        },
      },
      {
        kind: "cost",
        text: "You sometimes have to choose. BCNF gives the least redundancy but can lose a dependency, so the constraint must be enforced by a trigger or accepted as unenforceable. 3NF keeps every dependency but tolerates a little redundancy. There is no decomposition that gives both, in general — the choice is a design decision, not a computation.",
      },
    ],
    gate: {
      id: "g6-3",
      prompt:
        "R(A, B, C) is decomposed into R1(A, B) and R2(B, C). When is the join lossless?",
      options: [
        {
          text: "Always — a binary decomposition is always lossless.",
          correct: false,
          why: "It is not. The common attribute decides it.",
        },
        {
          text: "When the common attribute B is a key of at least one fragment.",
          correct: true,
          why: "Then each side matches at most one tuple, so no spurious combinations can form.",
        },
        {
          text: "When A is a key of the original relation.",
          correct: false,
          why: "The original key is not the test. The common attribute is.",
        },
        {
          text: "Never, unless the fragments are identical.",
          correct: false,
          why: "Lossless decompositions are the normal case when the test is met.",
        },
      ],
    },
    items: [
      {
        id: "i6-3-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain lossless join and dependency preservation in decomposition, and state which normal forms guarantee each.",
        rubric: [
          {
            label: "Lossless join: the natural join of the fragments reconstructs exactly the original relation, no spurious tuples.",
            marks: 1.5,
            tag: "unsafe-normalisation",
            beat: 2,
          },
          {
            label: "Binary test: the common attribute must be a super key of at least one fragment.",
            marks: 1.5,
            tag: "unsafe-normalisation",
            beat: 2,
          },
          {
            label: "Dependency preservation: projected dependencies imply the original set; 3NF synthesis gives both, BCNF may lose dependencies.",
            marks: 2,
            tag: "incomplete-list",
            beat: 3,
          },
        ],
        model:
          "A decomposition is lossless if the natural join of the fragments yields exactly the original relation, with no spurious tuples; for a binary split the test is that the common attributes form a super key of at least one fragment, and for a general split the chase test applies. Dependency preservation means the dependencies projected onto each fragment together imply every original dependency, so constraints can be checked within one relation. The 3NF synthesis algorithm guarantees both properties; a BCNF decomposition guarantees losslessness but may sacrifice dependency preservation.",
      },
      {
        id: "i6-3-2",
        kind: "practice",
        marks: 4,
        prompt:
          "R(A, B, C) with A → B and B → C. Decompose into R1(A, B) and R2(B, C) and show whether the decomposition is lossless and dependency preserving.",
        rubric: [
          {
            label: "Lossless: the common attribute B is a key of R2 (B → C), so the test is met.",
            marks: 2,
            tag: "unsafe-normalisation",
            beat: 2,
          },
          {
            label: "A → B is held in R1 and B → C in R2, so both are preserved.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Concludes the decomposition is in BCNF and safe on both counts.",
            marks: 0.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "The common attribute is B, and B → C makes B a key of R2, so the binary lossless test is satisfied and the join reconstructs R exactly. A → B is projected into R1 and B → C into R2, so the union of projected dependencies implies both originals and the decomposition is dependency preserving. Both fragments have a single non-trivial dependency with a superkey determinant, so both are in BCNF.",
      },
      {
        id: "i6-3-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Give an example where BCNF is reached but a dependency is lost, and say how the constraint is then enforced.",
        rubric: [
          {
            label: "Gives a correct case: R(A, B, C) with AB → C and C → B, where C → B is lost on decomposing to (A, C) and (B, C).",
            marks: 2,
            tag: "unsafe-normalisation",
            beat: 3,
          },
          {
            label: "States the remedy: enforce it with a trigger, an assertion, or accept the loss knowingly.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "Take R(A, B, C) with AB → C and C → B. The candidate keys are AB and AC, so C → B has a determinant that is not a super key, violating BCNF. Decomposing into (A, C) and (B, C) reaches BCNF, but AB → C cannot be projected into either fragment and is lost, so it can no longer be checked without joining. Such a constraint has to be enforced by a trigger or an assertion, or the schema stays in 3NF where the dependency is preserved.",
      },
    ],
  },

  {
    id: "c6-4",
    unit: "u6",
    title: "The money that left one account and arrived nowhere",
    syllabusTag: "UNIT-VI · transaction processing and ACID properties",
    hook: "Five thousand rupees leave account A and the machine dies before they reach account B. The debit is on disk; the credit never happened.",
    beats: [
      {
        kind: "problem",
        text: "A transfer is two writes. Between them the database is in a state that is wrong — money that belongs to nobody — and any reader during that window sees a total that does not add up. A crash inside the window makes the wrong state permanent.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to make the two writes fast, so the window is small. It fails because small is not zero: a crash in a one-millisecond window is still a lost five thousand rupees, and no amount of speed changes that.",
      },
      {
        kind: "mechanism",
        text: "A transaction is the unit of work, and ACID names what the system guarantees about it. Atomicity: either all of its writes happen or none, implemented by a log and undo. Consistency: it moves the database from one valid state to another, preserving declared constraints. Isolation: concurrent transactions produce a result equivalent to some serial order, implemented by locking or timestamps. Durability: once committed, the effect survives failure, implemented by writing the log record before acknowledging. A transaction moves through active, partially committed, committed, and on failure aborted — with rollback restoring the before-image.",
        figure: {
          type: "flow",
          caption: "A transfer, and where the guarantee has to hold.",
          steps: [
            { label: "BEGIN" },
            { label: "Read A; write A − 5000 (log the before-image)" },
            { label: "Write B + 5000 (log the before-image)", tone: "gate" },
            { label: "COMMIT — log record forced to disk, then acknowledge" },
            { label: "Crash before COMMIT → UNDO both writes; after → REDO both" },
          ],
        },
      },
      {
        kind: "cost",
        text: "Durability costs a synchronous write per commit, which is why commit is the slow part of a write-heavy workload. Isolation costs locks, which cost waiting and can produce deadlock. Every relaxation of isolation — read committed, repeatable read, snapshot — buys throughput by admitting a named anomaly, and the anomaly has to be one you can live with.",
      },
    ],
    gate: {
      id: "g6-4",
      prompt:
        "A crash occurs after the debit is written and before the credit. Which property guarantees the debit is undone?",
      options: [
        {
          text: "Atomicity.",
          correct: true,
          why: "Atomicity means all or nothing. The undo of the debit is exactly that guarantee being kept.",
        },
        {
          text: "Consistency.",
          correct: false,
          why: "Consistency concerns constraints being preserved, not the undoing of partial work.",
        },
        {
          text: "Isolation.",
          correct: false,
          why: "Isolation concerns concurrent transactions not seeing each other's intermediate state.",
        },
        {
          text: "Durability.",
          correct: false,
          why: "Durability protects work that has already committed. This transaction never committed.",
        },
      ],
    },
    items: [
      {
        id: "i6-4-1",
        kind: "exit",
        marks: 7.5,
        prompt:
          "Explain the ACID properties of a transaction and the usefulness of each, with a suitable example.",
        rubric: [
          {
            label: "Atomicity: all or nothing, with undo of a partially completed transfer.",
            marks: 1.5,
            tag: "wrong-isolation",
            beat: 2,
          },
          {
            label: "Consistency: the transaction moves the database between valid states, preserving constraints.",
            marks: 1.5,
            tag: "wrong-isolation",
            beat: 2,
          },
          {
            label: "Isolation: concurrent execution is equivalent to some serial order; names a symptom such as the lost update.",
            marks: 2,
            tag: "wrong-isolation",
            beat: 2,
          },
          {
            label: "Durability: committed effects survive failure, via the log written before commit.",
            marks: 1.5,
            tag: "wrong-isolation",
            beat: 2,
          },
          {
            label: "Each property tied to a mechanism, not merely defined.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "Atomicity guarantees that a transaction's writes all take effect or none do; if a transfer debits one account and the system fails before crediting the other, the debit is undone from the log, so no money is stranded. Consistency guarantees that a transaction moves the database from one valid state to another, so declared constraints such as a non-negative balance still hold afterwards. Isolation guarantees that concurrent transactions produce a result equivalent to some serial execution, so two simultaneous withdrawals cannot both read the same balance and both succeed. Durability guarantees that once a transaction commits, its effect survives a crash, because the log record is forced to disk before the commit is acknowledged.",
      },
      {
        id: "i6-4-2",
        kind: "practice",
        marks: 4,
        prompt:
          "List the states of a transaction and explain what can happen in the partially committed state.",
        rubric: [
          {
            label: "Names active, partially committed, committed, failed and aborted.",
            marks: 2,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Explains that in partially committed all statements have run but the log may not be on stable storage.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Notes that failure here leads to rollback with undo, not to a lost or duplicated effect.",
            marks: 0.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "A transaction passes through active, partially committed, committed, and either aborted or terminated after failure. In the partially committed state every statement has executed and the final writes may still be in buffers, with the commit record not yet on stable storage. If a failure occurs here the transaction is rolled back using the before-images in the log, so no partial effect survives — which is exactly the atomicity guarantee, applied to the last possible moment.",
      },
      {
        id: "i6-4-3",
        kind: "practice",
        marks: 3,
        prompt:
          "What is a lost update, and which ACID property is intended to prevent it?",
        rubric: [
          {
            label: "Describes two transactions reading the same value and both writing back, so one change disappears.",
            marks: 2,
            tag: "wrong-isolation",
            beat: 0,
          },
          {
            label: "Names isolation, and a mechanism such as an exclusive lock or a higher isolation level.",
            marks: 1,
            tag: "wrong-isolation",
            beat: 2,
          },
        ],
        model:
          "Two transactions each read the same balance, each compute a new value from it, and each write back; the second write overwrites the first, so one update vanishes with no error. Isolation prevents it, implemented by holding an exclusive lock from the read to the write, or by a sufficiently strict isolation level such as repeatable read or serialisable.",
      },
    ],
  },

  {
    id: "c6-5",
    unit: "u6",
    title: "Two clerks, one balance",
    syllabusTag: "UNIT-VI · locking techniques and concurrency control",
    hook: "Both clerks read a balance of one hundred. Both add fifty. Both write one fifty. The account gained fifty rupees that nobody deposited.",
    beats: [
      {
        kind: "problem",
        text: "Interleaved execution is not the same as serial execution, and the difference is invisible in the code. The lost update is the mildest symptom: dirty reads show uncommitted data that is later rolled back, non-repeatable reads let a value change inside one transaction, and phantoms let new rows appear in a range that was already read.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to lock only when writing. It fails because the damage is done at read time: both transactions have already read the old value before either lock is taken, so the lock protects the wrong interval.",
      },
      {
        kind: "mechanism",
        text: "Lock the data for the whole time it is in use. A shared lock allows concurrent readers; an exclusive lock allows one writer and excludes everyone. Two-phase locking requires every transaction to acquire all its locks in a growing phase before releasing any in a shrinking phase, which guarantees conflict serializability; strict 2PL holds exclusive locks until commit, which also prevents dirty reads. Serializability is checked with a precedence graph — a cycle means no serial order exists. Deadlock is handled by prevention, using timestamps with wait-die or wound-wait, or by detection with a wait-for graph and a chosen victim.",
        figure: {
          type: "table",
          caption: "Lock compatibility — the whole mechanism is this table.",
          columns: ["Held \\ Requested", "Shared", "Exclusive"],
          rows: [
            ["Shared", "Granted", "Wait"],
            ["Exclusive", "Wait", "Wait"],
          ],
          mark: [{ r: 0, c: 0, tone: "hit" }, { r: 0, c: 1, tone: "miss" }, { r: 1, c: 1, tone: "miss" }],
        },
      },
      {
        kind: "cost",
        text: "2PL prevents non-serialisable schedules but cannot prevent deadlock, because it says nothing about the order in which locks are requested. Strictness adds waiting: a lock held to commit blocks readers for the length of the transaction. Every step down the isolation ladder — serialisable, repeatable read, read committed, read uncommitted — trades a named anomaly for throughput.",
      },
    ],
    gate: {
      id: "g6-5",
      prompt: "Under two-phase locking, when may a transaction acquire a lock?",
      options: [
        {
          text: "At any time, as long as it eventually releases everything.",
          correct: false,
          why: "That is no protocol at all. The phase rule is the whole guarantee.",
        },
        {
          text: "Only during its growing phase, before it has released any lock.",
          correct: true,
          why: "All acquisitions precede all releases. That is what makes the schedule conflict serialisable.",
        },
        {
          text: "Only after it commits.",
          correct: false,
          why: "A transaction needs its locks before it can do the work that commit finalises.",
        },
        {
          text: "Never; locks are acquired by the scheduler on its behalf.",
          correct: false,
          why: "The scheduler grants them, but the protocol constrains when the transaction may ask.",
        },
      ],
    },
    items: [
      {
        id: "i6-5-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain locking techniques in concurrency control: lock modes, two-phase locking, and how deadlock is handled.",
        rubric: [
          {
            label: "Shared and exclusive locks, with the compatibility rule stated.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "2PL: growing phase acquires, shrinking phase releases, no acquisition after a release.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Strict 2PL holds exclusive locks to commit, preventing dirty reads.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Deadlock prevention (wait-die, wound-wait) or detection (wait-for graph, victim selection) described.",
            marks: 1,
            tag: "incomplete-list",
            beat: 2,
          },
        ],
        model:
          "A shared lock permits other readers but excludes writers; an exclusive lock excludes everyone. Two-phase locking requires a transaction to acquire all locks during a growing phase before releasing any during a shrinking phase, which guarantees that every schedule produced is conflict serialisable; in strict 2PL all exclusive locks are held until commit, which additionally prevents dirty reads. Deadlock is handled by prevention, using transaction timestamps so that an older transaction waits and a younger one dies, or by detection, building a wait-for graph, finding a cycle and aborting a chosen victim.",
      },
      {
        id: "i6-5-2",
        kind: "practice",
        marks: 4,
        prompt:
          "Show how a lost update arises from interleaved execution, then state the schedule change that prevents it.",
        rubric: [
          {
            label: "Gives the interleaving: T1 reads, T2 reads, T1 writes, T2 writes — T1's change is overwritten.",
            marks: 2,
            tag: "wrong-isolation",
            beat: 0,
          },
          {
            label: "Prevention: an exclusive lock from the read until the write, or a serialisable isolation level.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Notes that locking only at write time does not prevent it.",
            marks: 0.5,
            tag: "mechanism-missing",
            beat: 1,
          },
        ],
        model:
          "T1 reads balance 100, T2 reads balance 100, T1 writes 150, T2 writes 150: T1's increment is lost although both transactions reported success. Preventing it requires T1 to hold an exclusive lock on the row from its read until its write, so T2's read waits and it sees 150 rather than 100. Locking only at the write is too late, because both transactions have already read the value the lock was meant to protect.",
      },
      {
        id: "i6-5-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Why does two-phase locking not prevent deadlock, and what does the DBMS do when one occurs?",
        rubric: [
          {
            label: "2PL constrains phases, not the order in which different transactions request locks, so a cycle can form.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 3,
          },
          {
            label: "Detection via a wait-for graph; a victim is aborted and rolled back, releasing its locks.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "2PL guarantees serialisability by fixing when locks may be acquired and released, but it says nothing about which resources a transaction asks for in which order, so two transactions can each hold what the other needs and form a cycle. The DBMS detects this in a wait-for graph and aborts one transaction as the victim, rolling it back so that its locks are released and the other can proceed; prevention schemes such as wait-die avoid the cycle by ordering transactions on their timestamps.",
      },
    ],
  },

  {
    id: "c6-6",
    unit: "u6",
    title: "The disk dies at five to twelve",
    syllabusTag: "UNIT-VI · database recovery, security and authorization",
    hook: "Result day, 11:58. The disk fails. The last backup is from last night, and nobody can say which of this morning's entries were actually committed.",
    beats: [
      {
        kind: "problem",
        text: "A backup is a photograph of the past. Restoring it loses every transaction since it was taken — including the ones that committed and were reported as done. Without a record of what happened in between, the database cannot distinguish a transaction that committed from one that was half-written when the power failed.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to back up more often. It fails on two counts: the interval is never zero, so the loss is smaller but not absent; and a backup taken while transactions are in flight captures a state that is internally inconsistent, so restoring it may restore a half-applied transfer.",
      },
      {
        kind: "mechanism",
        text: "Recovery works from a log, not from a photograph. Write-ahead logging records the before-image and after-image of every change before the change reaches the database file, which makes undo possible and redo necessary. In deferred update, no database write happens before commit, so only redo is needed; in immediate update, writes may happen early, so both undo and redo are needed. A checkpoint flushes buffers and records the active transaction list, so recovery need not start from the beginning of time. ARIES runs three passes: analysis to rebuild the dirty page table and the active list, redo from the earliest dirty page to repeat history, and undo to roll back losers. Security is the other half: authentication establishes who you are, authorisation decides what you may do through GRANT and REVOKE, roles bundle privileges, views restrict what is visible, and encryption protects data at rest and in transit.",
        figure: {
          type: "flow",
          caption: "What recovery does with each kind of transaction after a crash.",
          steps: [
            { label: "Checkpoint taken — record the active list" },
            { label: "Crash occurs" },
            { label: "Analysis pass — which pages were dirty, which transactions were active", tone: "gate" },
            { label: "Redo — repeat history for every committed transaction" },
            { label: "Undo — roll back every uncommitted transaction, newest first" },
          ],
        },
      },
      {
        kind: "cost",
        text: "Every write pays for a log record, and every commit pays a forced write, so logging is a real cost on the write path. A checkpoint briefly stalls the system while buffers are flushed, which is why checkpoints are fuzzy rather than sharp. Encryption costs CPU on every read, and auditing costs storage — and a view-based restriction is only as strong as the definer's rights, so a badly built view leaks.",
      },
    ],
    gate: {
      id: "g6-6",
      prompt:
        "In the deferred-update scheme, are uncommitted changes written to the database before commit?",
      options: [
        {
          text: "Yes, which is why undo is required.",
          correct: false,
          why: "That is the immediate-update scheme, where undo is needed precisely for this reason.",
        },
        {
          text: "No — so only redo is needed during recovery.",
          correct: true,
          why: "Deferring writes to commit time means an uncommitted transaction left nothing in the database, so recovery only has to redo committed work.",
        },
        {
          text: "It depends on the buffer size.",
          correct: false,
          why: "The scheme is a design decision, not a function of buffer capacity.",
        },
        {
          text: "Always, because the log is a database write.",
          correct: false,
          why: "The log is not the database file. Writing the log first is exactly what makes deferral possible.",
        },
      ],
    },
    items: [
      {
        id: "i6-6-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain log-based recovery: write-ahead logging, deferred and immediate update, and the role of a checkpoint.",
        rubric: [
          {
            label: "Write-ahead logging: before-image and after-image recorded before the change reaches the database.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Deferred update needs only redo; immediate update needs both undo and redo.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Checkpoint flushes buffers and records the active list, so recovery starts from there rather than the beginning.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "In write-ahead logging, the log record holding the before-image and after-image of a change is written to stable storage before the change is written to the database file. With deferred update, no database write occurs until the transaction commits, so recovery only redoes committed transactions. With immediate update, changes may reach the database before commit, so recovery must undo uncommitted transactions as well as redo committed ones. A checkpoint forces the buffers to disk and records the list of active transactions, so after a crash recovery can begin at the checkpoint instead of replaying the whole log.",
      },
      {
        id: "i6-6-2",
        kind: "practice",
        marks: 4,
        prompt:
          "Explain database security and authorisation, naming four distinct mechanisms.",
        rubric: [
          {
            label: "Authentication — verifying identity — distinguished from authorisation.",
            marks: 1,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "GRANT and REVOKE with privileges on objects; roles to bundle them.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Views as a restriction mechanism, so a user sees only permitted columns or rows.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Encryption and auditing named as further controls.",
            marks: 0.5,
            tag: "incomplete-list",
            beat: 2,
          },
        ],
        model:
          "Authentication establishes identity, and authorisation then decides what that identity may do. Privileges are granted and revoked on objects with GRANT and REVOKE, and roles bundle a set of privileges so they can be assigned and audited as one unit. Views restrict what is visible: a user granted only a view cannot reach the columns it omits. Encryption protects data at rest and in transit, and auditing records who did what, which is the only way to detect misuse after the fact.",
      },
      {
        id: "i6-6-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Why is a checkpoint necessary if the log already records every change?",
        rubric: [
          {
            label: "Without a checkpoint, recovery must scan and possibly redo the entire log from the beginning.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "A checkpoint bounds the work: it fixes a point from which all pages are known to be on disk.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "The log alone would make recovery time grow with the age of the database, since every transaction since the beginning would have to be examined. A checkpoint records that all pages up to that moment are on stable storage, along with the list of active transactions, so redo can start from the earliest dirty page and undo need consider only the transactions active at that point.",
      },
    ],
  },
];
