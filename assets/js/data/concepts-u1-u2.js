/**
 * Beat scripts for Unit I and Unit II.
 *
 * Every concept follows FR-1: problem, why the obvious fix fails, [prediction
 * gate], mechanism, cost. The gate is stored separately and rendered between
 * the failure and the mechanism beat — the player will not render a mechanism
 * before a gate has been answered or explicitly skipped (AC-1.2, AC-1.4).
 *
 * Figure primitives are drawn only from: compare, flow, table, tree, layers,
 * code. There is no bespoke diagram per concept (FR-7).
 */

export const CONCEPTS_U1_U2 = [
  /* ======================================================================
     UNIT I — INTRODUCTION
     ====================================================================== */
  {
    id: "c1-1",
    unit: "u1",
    title: "One correction, three files",
    syllabusTag: "UNIT-I · characteristics of the database approach",
    hook: "A student corrects the spelling of her surname. Three weeks later the library still fines her under the old one.",
    beats: [
      {
        kind: "problem",
        text: "A college keeps the same student in three files: admission, library and examination. The name is typed into each. When it is corrected in admission only, the three files now describe two different people, and no file knows that it disagrees with the others.",
        figure: {
          type: "table",
          caption: "The same fact, stored three times, drifting apart.",
          columns: ["File", "Roll", "Name", "Written"],
          rows: [
            ["admission.dat", "23/441", "Anjali Verma", "12 Aug"],
            ["library.dat", "23/441", "Anjali Verma", "12 Aug"],
            ["exam.dat", "23/441", "Anjali Varma", "29 Aug"],
          ],
          mark: [{ r: 2, c: 2, tone: "miss" }],
        },
      },
      {
        kind: "failure",
        text: "The obvious fix is a rule: every clerk must update all three files. It fails because the rule is enforced by people and by procedure, not by the data. Nothing stops a fourth file being created next year, nothing detects the disagreement afterwards, and the rule cannot answer the only question that matters — which copies are wrong right now?",
      },
      {
        kind: "mechanism",
        text: "Store the name once. Every other file holds only the roll number and refers to the single copy. The value now has one home, so a correction is one write and every reader sees the same value. This is what a database means by controlled redundancy: duplication is not banned, but it is owned by the system rather than by whoever typed last.",
        figure: {
          type: "compare",
          caption: "Where the single fact lives decides whether it can disagree with itself.",
          good: {
            title: "One copy, referenced by key",
            items: [
              "students(roll, name) — name exists once",
              "fines(roll, amount) — holds roll only",
              "A correction is one UPDATE",
            ],
          },
          bad: {
            title: "Three copies, kept in step by hand",
            items: [
              "name in admission, library, exam",
              "Agreement depends on the clerk",
              "No query can list the disagreements",
            ],
          },
        },
      },
      {
        kind: "cost",
        text: "A DBMS is another process to install, tune, back up and pay for. The single copy is also a single point of damage: a careless DELETE now breaks every application at once, which is why authorisation, recovery and backups stop being optional. For one user and one file, a plain file is still the cheaper engineering answer.",
      },
    ],
    gate: {
      id: "g1-1",
      prompt:
        "Next year the college adds a fourth copy of the student name. Which guarantee breaks first?",
      options: [
        {
          text: "Disk space runs out sooner.",
          correct: false,
          why: "A name is a few bytes; this is not what redundancy costs you first.",
        },
        {
          text: "The assurance that all copies of the name agree.",
          correct: true,
          why: "Redundancy is only tolerable when the system enforces agreement. A hand-kept fourth copy has no enforcer.",
        },
        {
          text: "Queries become slower to type.",
          correct: false,
          why: "Typing speed is not a property of the data model.",
        },
        {
          text: "Backups take longer to schedule.",
          correct: false,
          why: "Backup duration is an operational detail, not the guarantee at stake.",
        },
      ],
    },
    items: [
      {
        id: "i1-1-1",
        kind: "exit",
        marks: 5,
        prompt:
          "A college keeps a student's name in three separate files. Name the specific failure this causes and state the one structural change that removes it.",
        rubric: [
          {
            label: "Names data redundancy — the same fact stored in more than one file.",
            marks: 1,
            tag: "redundancy-not-named",
            beat: 0,
          },
          {
            label:
              "Names the consequence as inconsistency or an update anomaly: the copies can disagree, and a correction in one place leaves the others stale.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 1,
          },
          {
            label:
              "States the change: store the value once and reference it from the other files by a key such as roll number.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "The name is redundant: it exists in three files with no mechanism keeping them equal, so any update to one produces inconsistent copies, and a query cannot tell which copy is right. The fix is to hold the name once in a student relation and let the library and examination files carry only the roll number as a foreign key. Every reader then resolves the same single value.",
      },
      {
        id: "i1-1-2",
        kind: "practice",
        marks: 3,
        prompt:
          "Why does a written procedure — always update every copy — not solve the redundancy problem?",
        rubric: [
          {
            label: "Says the rule is enforced outside the data, by people or process.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 1,
          },
          {
            label: "Says there is no detection: nothing reports copies that already disagree.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 1,
          },
          {
            label: "Notes the rule does not survive a new file or a new writer appearing later.",
            marks: 1,
            tag: "incomplete-list",
            beat: 1,
          },
        ],
        model:
          "The rule lives outside the data, so it is only as reliable as the person following it. It gives no way to detect copies that already disagree, and it must be re-taught every time a new file or application is added. A constraint enforced by the system applies to every writer automatically.",
      },
      {
        id: "i1-1-3",
        kind: "practice",
        marks: 2,
        prompt:
          "Give one situation in which a plain file, not a DBMS, is the better engineering choice, and say why.",
        rubric: [
          {
            label: "Gives a plausible case: single writer, single purpose, tiny data, or no concurrency.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 3,
          },
          {
            label: "Justifies it on cost — installation, administration, or the risk of one damaged copy.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "A single-user utility that logs readings and is read by one program: there is no concurrency, no sharing and no second writer to disagree with, so the DBMS buys nothing and costs installation, tuning and backup effort. The overhead only pays for itself once several programs or users share the data.",
      },
    ],
  },

  {
    id: "c1-2",
    unit: "u1",
    title: "What a DBMS adds that a file cannot",
    syllabusTag: "UNIT-I · characteristics of the database approach",
    hook: "Two clerks open the same result record at four in the afternoon on result day. Both save. One of the two entries disappears without an error.",
    beats: [
      {
        kind: "problem",
        text: "Both clerks read the record, both change a different field, both write the whole record back. The second write overwrites the first clerk's field with the value she read before it changed. Neither saw an error; the data is simply wrong now, and only one of the two people knows a change was made.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to ask the operating system to lock the file. It fails because an OS lock is on bytes, not on meaning: a lock on the byte range holding marks also blocks a clerk editing the address, and it cannot express the rule that two readers may share a record but two writers may not. The other common fix, a policy that only one person works at a time, is not a mechanism at all.",
      },
      {
        kind: "mechanism",
        text: "A DBMS adds five things a file system does not: a self-describing catalogue, so the structure is stored with the data rather than inside each program; program-data independence, so programs stop knowing the layout; concurrency control that treats a record as a logical unit and can distinguish shared from exclusive access; integrity constraints checked on every write by the system; and views, so each user sees only their own columns. Together these are what the syllabus calls the characteristics of the database approach.",
        figure: {
          type: "layers",
          caption: "Five properties, each replacing something a file system leaves to the application.",
          layers: [
            { name: "Catalogue", detail: "Schema stored as data — programs read it, they do not hard-code it." },
            { name: "Independence", detail: "Change storage or add a column without rewriting every program." },
            { name: "Concurrency", detail: "Shared and exclusive access to a logical record, not a byte range." },
            { name: "Integrity", detail: "Constraints enforced by the system on every writer, not by each program." },
            { name: "Views", detail: "Each user is shown the columns they are entitled to see." },
          ],
        },
      },
      {
        kind: "cost",
        text: "Every one of those properties is overhead on the write path: the catalogue is consulted, constraints are evaluated, locks are taken and released. A single-row insert into a small table is measurably slower than appending a line to a file. You also now need someone to own the schema, the grants and the backups.",
      },
    ],
    gate: {
      id: "g1-2",
      prompt:
        "Which of these does a DBMS actually guarantee, that a shared file system cannot?",
      options: [
        {
          text: "That two writers never silently overwrite each other's changes.",
          correct: true,
          why: "That is concurrency control on a logical unit. A file system can lock bytes, not meaning.",
        },
        {
          text: "That the data is correct.",
          correct: false,
          why: "It can enforce declared constraints. It cannot know that a marks value of 90 is a typo for 09.",
        },
        {
          text: "That disks never fail.",
          correct: false,
          why: "Recovery limits the damage of failure; it does not prevent it.",
        },
        {
          text: "That every query is fast.",
          correct: false,
          why: "A DBMS gives you the tools to make a query fast. A bad query plan still reads the whole table.",
        },
      ],
    },
    items: [
      {
        id: "i1-2-1",
        kind: "exit",
        marks: 5,
        prompt:
          "State any five characteristics of the database approach, and for each say in one line what problem it removes.",
        rubric: [
          {
            label: "Lists at least five correct characteristics (self-describing catalogue, insulation of programs from data, multiple views, sharing with concurrency control, integrity constraints, controlled redundancy, backup and recovery).",
            marks: 3,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Pairs each with the problem it removes rather than restating it.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
        ],
        model:
          "Self-describing catalogue — programs no longer hard-code the layout. Insulation of programs from data — a storage change does not force a rewrite. Multiple views — each user sees only their columns. Sharing with concurrency control — two writers cannot silently overwrite each other. Integrity constraints — every writer is checked, not just the careful one. Controlled redundancy — duplication is owned by the system instead of by the last clerk.",
      },
      {
        id: "i1-2-2",
        kind: "practice",
        marks: 4,
        prompt:
          "Two clerks update the same record at the same time and one change is lost. Explain the sequence that produces the loss, and state what a DBMS does instead.",
        rubric: [
          {
            label: "Describes read-modify-write: both read the old value, both write the whole record, the later write wins.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 0,
          },
          {
            label: "States that the DBMS locks the record exclusively for a writer and blocks or aborts the second.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "Both transactions read the record, each modifies a different field in memory, and each writes back the entire record. The second write carries the stale value of the first clerk's field, so that change is lost with no error raised. A DBMS makes the unit of locking the logical record, grants an exclusive lock to the first writer, and makes the second wait or abort, so the two updates are serialised.",
      },
      {
        id: "i1-2-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Name three costs a DBMS imposes that a file-based system does not.",
        rubric: [
          {
            label: "Gives any three of: overhead on the write path, administration effort, hardware or licence cost, the risk of one damaged copy breaking all applications.",
            marks: 2,
            tag: "cost-not-stated",
            beat: 3,
          },
          {
            label: "Explains at least one of them, rather than only naming it.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "Writes are slower because the catalogue is consulted and constraints and locks are handled on every statement. It needs an administrator to own the schema, grants and backups. And concentrating the data concentrates the risk: one corrupt relation can break every application at once, where three separate files would fail independently.",
      },
    ],
  },

  {
    id: "c1-3",
    unit: "u1",
    title: "Three levels, two mappings",
    syllabusTag: "UNIT-I · DBMS architecture",
    hook: "The library must not see a student's phone number. The examination cell needs marks but not the address. Admissions needs everything. It is one table.",
    beats: [
      {
        kind: "problem",
        text: "There is one physical table. Three departments need three different shapes of it, and one of them must be denied a column. If everyone is handed the same table, the restriction has to be enforced by asking staff not to look, and any change to how the table is stored reaches all three departments at once.",
      },
      {
        kind: "failure",
        text: "The obvious fix is three copies of the table, one per department. It fails on the first correction: the copies drift, and the phone number you were trying to hide now sits in a file somebody made for convenience. Copying to hide data reliably hides nothing.",
      },
      {
        kind: "mechanism",
        text: "Describe the data at three levels. The internal level says how it is stored — files, pages, indexes. The conceptual level says what exists — entities, attributes, constraints, one description for the whole enterprise. The external level says who sees what — a separate view per user group. Two mappings join them: external/conceptual and conceptual/internal. A view is therefore a definition, not a copy: the phone number is absent from the library's view because the view never selects it.",
        figure: {
          type: "layers",
          caption: "Three levels, and the two mappings that absorb change between them.",
          layers: [
            { name: "External", detail: "Library view (roll, name, books issued). Exam view (roll, marks)." },
            { name: "Conceptual", detail: "One description of what exists: students, books, marks, constraints." },
            { name: "Internal", detail: "How it is stored: files, pages, indexes, compression." },
          ],
        },
      },
      {
        kind: "cost",
        text: "Every access passes through a mapping, and every view must be maintained as a definition with its own access rights. On a small single-application database the three levels collapse into one and the extra layer is pure paperwork. The architecture earns its keep when several user groups share one store and change at different speeds.",
      },
    ],
    gate: {
      id: "g1-3",
      prompt:
        "An examiner's view showing only name and marks, hiding the phone number, belongs to which level?",
      options: [
        {
          text: "Internal — it decides what is stored.",
          correct: false,
          why: "The internal level is about storage structures, not about who may see a column.",
        },
        {
          text: "Conceptual — it describes what exists.",
          correct: false,
          why: "The conceptual level contains the phone number. That is the point: the data exists and is described once.",
        },
        {
          text: "External — it defines a user's view.",
          correct: true,
          why: "The external level is the per-user view. Hiding a column is a property of the view, not of the stored data.",
        },
        {
          text: "Physical — it decides which disk the row sits on.",
          correct: false,
          why: "Physical placement is internal-level work and has nothing to do with column visibility.",
        },
      ],
    },
    items: [
      {
        id: "i1-3-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain the three-schema architecture and name the two mappings, stating what each mapping protects.",
        rubric: [
          {
            label: "Describes internal, conceptual and external levels correctly, in that role split.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Names both mappings: external/conceptual and conceptual/internal.",
            marks: 1,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label:
              "States what they protect — logical data independence for the upper mapping, physical data independence for the lower.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "The internal level describes storage — files, pages, indexes. The conceptual level is one description of the whole enterprise: entities, attributes and constraints. The external level defines a view per user group. The external/conceptual mapping lets the conceptual schema change without breaking user views (logical data independence); the conceptual/internal mapping lets storage change without touching the conceptual schema (physical data independence).",
      },
      {
        id: "i1-3-2",
        kind: "practice",
        marks: 3,
        prompt:
          "Distinguish a schema from an instance, using one example of each from this syllabus.",
        rubric: [
          {
            label: "Schema = the description or structure; instance = the data in it at a moment in time.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Gives a concrete pair: students(roll, name, dept) versus the rows present today.",
            marks: 1,
            tag: "no-example",
            beat: 2,
          },
        ],
        model:
          "The schema is the structure and its constraints — for example students(roll, name, dept) with roll as primary key. The instance is the set of tuples held at a given moment, which changes with every insert and delete while the schema stays the same. The schema changes rarely and deliberately; the instance changes constantly.",
      },
      {
        id: "i1-3-3",
        kind: "practice",
        marks: 2,
        prompt:
          "Why does hiding a column with a view work, where giving staff a trimmed copy of the table does not?",
        rubric: [
          {
            label: "A view is a definition over one stored copy, so there is nothing to drift.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Access rights attach to the view, so the hidden column is never reachable through it.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "A view stores no data; it is a query definition over the single table, so it can never disagree with it. Because privileges are granted on the view rather than the base table, a user holding only the view has no route to the phone number at all. A physical copy, by contrast, drifts from the original and lives outside the privilege system.",
      },
    ],
  },

  {
    id: "c1-4",
    unit: "u1",
    title: "Data independence, both kinds",
    syllabusTag: "UNIT-I · data independence",
    hook: "The administrator moves a table to a new disk and adds an index. Two hundred report programs stop compiling, and nobody has a list of the two hundred.",
    beats: [
      {
        kind: "problem",
        text: "Each program knows how the record is laid out — field offsets, block size, the order of the fields. When storage changes, the programs are wrong, and the failure appears at run time in whichever report is used least often, which is usually the one that matters in an audit.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to recompile everything after a storage change. It fails as a strategy because you do not know what to recompile: the dependency is invisible, spread across two hundred programs written over fifteen years, some of them by people who have left.",
      },
      {
        kind: "mechanism",
        text: "Two kinds of independence, and the difference is which mapping absorbs the change. Logical data independence means the conceptual schema can change — add a column, split a relation — without the external views and the programs behind them changing. Physical data independence means the internal schema can change — new index, new file organisation, different device — without the conceptual schema changing. Adding an index is the textbook physical case: the table looks identical to every program, it is simply found faster.",
        figure: {
          type: "table",
          caption: "Which level a change lands on decides who has to be told about it.",
          columns: ["Change", "Level changed", "Independence used"],
          rows: [
            ["Add an index on roll", "Internal", "Physical"],
            ["Move to another disk", "Internal", "Physical"],
            ["Add a column to students", "Conceptual", "Logical"],
            ["Split students into two relations", "Conceptual", "Logical"],
            ["Reorder columns in a view", "External", "— (breaks the view)"],
          ],
          mark: [{ r: 2, c: 2, tone: "key" }, { r: 3, c: 2, tone: "key" }],
        },
      },
      {
        kind: "cost",
        text: "Independence is never total. Dropping an attribute always breaks the views that selected it, and a change in data type can silently change results. Each mapping also costs a lookup when a statement is compiled or planned. What independence buys is that the common maintenance change — storage, indexes, adding a column — does not become a code release.",
      },
    ],
    gate: {
      id: "g1-4",
      prompt: "Adding an index on roll number changes which schema level?",
      options: [
        {
          text: "External — the users' views change.",
          correct: false,
          why: "No view changes. That is precisely why the change is safe.",
        },
        {
          text: "Conceptual — the description of the data changes.",
          correct: false,
          why: "The attributes, keys and constraints are unchanged.",
        },
        {
          text: "Internal — only the storage and access structures change.",
          correct: true,
          why: "An index is an access path, which lives at the internal level. Changing it is physical data independence at work.",
        },
        {
          text: "None — an index is outside the schema.",
          correct: false,
          why: "It is declared in the schema, just at the internal level.",
        },
      ],
    },
    items: [
      {
        id: "i1-4-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain data independence and its two types, giving one change that each type protects against.",
        rubric: [
          {
            label: "Defines data independence as the capacity to change one level of the schema without changing the level above.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Logical: change the conceptual schema (add an attribute, split a relation) without changing external views or programs.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Physical: change the internal schema (index, file organisation, device) without changing the conceptual schema.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "Data independence is the ability to change the schema at one level without altering the schema at the next higher level. Logical data independence lets the conceptual schema change — a new attribute or a decomposed relation — while external views and the applications using them stay valid. Physical data independence lets the internal schema change — a new index, a different file organisation, a different device — while the conceptual schema and every program above it remain untouched.",
      },
      {
        id: "i1-4-2",
        kind: "practice",
        marks: 3,
        prompt:
          "A program reads students with a fixed record length of 80 bytes. Classify the dependency this creates and say what removes it.",
        rubric: [
          {
            label: "It is a physical dependency: the program knows the internal layout.",
            marks: 1.5,
            tag: "constraint-mix",
            beat: 0,
          },
          {
            label: "Names the removal: access through the schema or a view, so field names rather than offsets are used.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "The program depends on the internal schema — a byte offset and record length — so it is a physical dependency, and any storage change breaks it. It is removed by addressing data through the catalogue and the conceptual schema, by column name through a view, so that the program never learns the layout.",
      },
      {
        id: "i1-4-3",
        kind: "practice",
        marks: 2,
        prompt: "State one change that data independence does not protect against.",
        rubric: [
          {
            label: "Names a real break: dropping or renaming an attribute, changing a domain, or changing a key.",
            marks: 1.5,
            tag: "cost-not-stated",
            beat: 3,
          },
          {
            label: "Explains why — the change reaches the level the user actually sees.",
            marks: 0.5,
            tag: "mechanism-missing",
            beat: 3,
          },
        ],
        model:
          "Dropping an attribute breaks every view that selected it, and changing its domain can silently change results. Independence protects the levels below a change, not the views that name the thing being changed.",
      },
    ],
  },

  {
    id: "c1-5",
    unit: "u1",
    title: "Four families of language, one administrator",
    syllabusTag: "UNIT-I · database languages and administration",
    hook: "You must add a column, insert a row, and stop an intern from reading salaries. People call all three SQL, and then grant the intern everything.",
    beats: [
      {
        kind: "problem",
        text: "Three different jobs get one name. Adding a column changes the structure of the database. Inserting a row changes its contents. Stopping a person reading a column is about permission, not about data at all. Because the same word covers all three, the habit grows of giving one broad permission that happens to make all three possible.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to give everyone full rights and rely on professionalism. It fails at the first audit, and it fails invisibly: an over-privileged account looks exactly like a correct one until the day it is used.",
      },
      {
        kind: "mechanism",
        text: "The classification follows what each statement acts on. DDL defines and alters structure — CREATE, ALTER, DROP. DML manipulates rows — SELECT, INSERT, UPDATE, DELETE, resting on the relational algebra. DCL controls access — GRANT, REVOKE. TCL delimits transactions — COMMIT, ROLLBACK, SAVEPOINT. SQL spans all four, which is why it is called a comprehensive language rather than a query language. The DBA owns the schema, the storage and access structures, authorisation, integrity, monitoring and tuning, and backup and recovery.",
        figure: {
          type: "table",
          caption: "Classify by what the statement changes.",
          columns: ["Family", "Acts on", "Statements"],
          rows: [
            ["DDL", "Structure", "CREATE, ALTER, DROP, TRUNCATE"],
            ["DML", "Rows", "SELECT, INSERT, UPDATE, DELETE"],
            ["DCL", "Permissions", "GRANT, REVOKE"],
            ["TCL", "Transaction boundaries", "COMMIT, ROLLBACK, SAVEPOINT"],
          ],
        },
      },
      {
        kind: "cost",
        text: "SQL is declarative: you state the result, not the procedure, and the optimiser chooses how. The price is that a badly written query can be catastrophically slow without looking wrong, so you must be able to read a query plan. And because one language covers four jobs, one careless GRANT can hand over the whole database.",
      },
    ],
    gate: {
      id: "g1-5",
      prompt: "GRANT SELECT ON students TO intern; — which family is this?",
      options: [
        {
          text: "DDL, because it changes the schema.",
          correct: false,
          why: "It changes no structure. The table is identical afterwards.",
        },
        {
          text: "DML, because it concerns data access.",
          correct: false,
          why: "It grants a right to read; it does not read anything.",
        },
        {
          text: "DCL, because it changes permissions.",
          correct: true,
          why: "GRANT and REVOKE are the data control statements. They act on the privilege catalogue.",
        },
        {
          text: "TCL, because it takes effect at commit.",
          correct: false,
          why: "It does take effect at commit, but that is not what classifies it.",
        },
      ],
    },
    items: [
      {
        id: "i1-5-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Describe the classification of database languages and state which type of language SQL is.",
        rubric: [
          {
            label: "Gives DDL, DML, DCL and TCL with a correct example of each.",
            marks: 3,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "States that SQL is a comprehensive language spanning all four, not merely a query language.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
        ],
        model:
          "DDL defines structure (CREATE, ALTER, DROP). DML manipulates rows (SELECT, INSERT, UPDATE, DELETE). DCL controls privileges (GRANT, REVOKE). TCL delimits transactions (COMMIT, ROLLBACK). SQL is a comprehensive or non-procedural language: it contains DDL, DML and DCL statements, so it is a complete database language rather than only a query language, and its DML is declarative — the user states what is wanted and the optimiser decides how.",
      },
      {
        id: "i1-5-2",
        kind: "practice",
        marks: 4,
        prompt:
          "Who are data administrators? List four functions of the database administrator.",
        rubric: [
          {
            label: "Identifies the DBA as the person or group owning the database resource and its policies.",
            marks: 1,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Lists at least four correct functions.",
            marks: 2,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Functions are specific (schema definition, authorisation, tuning, backup and recovery, integrity enforcement) rather than vague.",
            marks: 1,
            tag: "definition-only",
            beat: 2,
          },
        ],
        model:
          "The DBA is the person or group responsible for the database: its design, its availability and its security. Functions include defining and modifying the schema; defining storage structures and access paths and tuning them; granting and revoking authorisation; enforcing integrity constraints; monitoring performance and reorganising as needed; and planning backup and recovery. In a larger organisation the data administrator separately owns the meaning and standards of the data itself, while the DBA owns the system that holds it.",
      },
      {
        id: "i1-5-3",
        kind: "practice",
        marks: 3,
        prompt:
          "SQL is called declarative. State what that means and give one consequence for performance.",
        rubric: [
          {
            label: "Declarative: the statement describes the result, not the access path or procedure.",
            marks: 2,
            tag: "definition-only",
            beat: 3,
          },
          {
            label: "Consequence: the optimiser chooses the plan, so two equivalent statements can differ hugely in cost.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "A declarative statement says what result is required, leaving the choice of join order, index use and access method to the optimiser. The consequence is that a query which looks correct can be orders of magnitude slower than an equivalent one, because the plan — not the wording — determines the work, so the plan has to be read.",
      },
    ],
  },

  /* ======================================================================
     UNIT II — E-R MODELLING
     ====================================================================== */
  {
    id: "c2-1",
    unit: "u2",
    title: "When one column must hold two numbers",
    syllabusTag: "UNIT-II · entity types, attributes and keys",
    hook: "The admission form has one box for phone. A student writes two numbers in it. The second number is now unsearchable.",
    beats: [
      {
        kind: "problem",
        text: "One box holds 98765..., 99887... as a single string. A query for a number now has to search inside a string, a constraint cannot validate each number separately, and the day a third number is needed the box is full. The model has quietly decided that a student has at most one phone number, and it was never asked.",
      },
      {
        kind: "failure",
        text: "The obvious fix is a wider box. It fails for the same reason a longer shelf fails a growing library: it moves the limit without removing it, and the value is still one atomic-looking cell holding several facts.",
      },
      {
        kind: "mechanism",
        text: "Attributes are typed by how many values they take and how they are built. Simple (atomic): roll number. Composite: address, built from street, city, PIN. Single-valued: date of birth. Multi-valued: phone — drawn with a double oval, because it must become its own table when mapped. Derived: age, computed from date of birth, drawn with a dashed oval. An entity type is a template, its entity set is the collection of instances, and a key is a minimal set of attributes that identifies an instance.",
        figure: {
          type: "table",
          caption: "Attribute types, and what each costs you at mapping time.",
          columns: ["Type", "Example", "Consequence"],
          rows: [
            ["Simple", "roll_no", "One column"],
            ["Composite", "address(street, city, pin)", "Several columns; reference the whole or a part"],
            ["Multi-valued", "phone", "Separate table, or a limit you will regret"],
            ["Derived", "age from dob", "Do not store; compute, or accept staleness"],
            ["Key", "roll_no", "Underlined; unique and minimal"],
          ],
          mark: [{ r: 3, c: 2, tone: "miss" }, { r: 4, c: 2, tone: "miss" }],
        },
      },
      {
        kind: "cost",
        text: "A multi-valued attribute costs a join every time it is read, and an extra insert when it changes. A stored derived attribute costs consistency: it is right at insert and wrong later unless something maintains it. Keeping attributes atomic costs storage and a join, but it is the only form that survives a query.",
      },
    ],
    gate: {
      id: "g2-1",
      prompt: "A student may have several mobile numbers. In an ER model, Phone is:",
      options: [
        {
          text: "A simple attribute.",
          correct: false,
          why: "Simple means atomic and single-valued. This is exactly the assumption that fails.",
        },
        {
          text: "A composite attribute.",
          correct: false,
          why: "Composite means built from parts — an address has parts. A phone number does not.",
        },
        {
          text: "A multi-valued attribute.",
          correct: true,
          why: "Several values of the same kind for one entity. Drawn as a double oval, mapped to its own table.",
        },
        {
          text: "A derived attribute.",
          correct: false,
          why: "Derived means computed from another attribute, like age from date of birth.",
        },
      ],
    },
    items: [
      {
        id: "i2-1-1",
        kind: "exit",
        marks: 5,
        prompt:
          "What are attributes? Discuss all types of attributes with suitable examples, using a student entity.",
        rubric: [
          {
            label: "Defines an attribute as a property of an entity type, with a value from a domain.",
            marks: 1,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Covers simple, composite, single-valued, multi-valued, derived and key attributes — all of them, since the question says all types.",
            marks: 3,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Each type carries a student example, and the multi-valued case is shown as a double oval.",
            marks: 1,
            tag: "no-example",
            beat: 2,
          },
        ],
        model:
          "An attribute is a property of an entity type, each value drawn from a domain. Simple (atomic): roll_no. Composite: address, made of street, city and PIN. Single-valued: date_of_birth. Multi-valued: phone, which one student may hold several of and which is drawn with a double oval and mapped to a separate table. Derived: age, computable from date_of_birth and drawn with a dashed oval. Key: roll_no, underlined, because it identifies each student. NULL is not an attribute type but a marker for a value that is unknown or not applicable.",
      },
      {
        id: "i2-1-2",
        kind: "practice",
        marks: 3,
        prompt:
          "What do you mean by an entity? Distinguish an entity type from an entity set.",
        rubric: [
          {
            label: "Entity: a distinguishable thing in the mini-world, with an independent existence.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Entity type = the definition or template; entity set = the collection of all instances of it at a given time.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
        ],
        model:
          "An entity is a thing that exists distinctly in the mini-world — this particular student, that particular book. The entity type is its definition: STUDENT with attributes roll_no, name, dept. The entity set is the collection of all STUDENT instances currently in the database, which changes as rows are added and removed while the type stays fixed.",
      },
      {
        id: "i2-1-3",
        kind: "practice",
        marks: 2,
        prompt:
          "Why should a derived attribute such as age usually not be stored?",
        rubric: [
          {
            label: "It goes stale: it is correct when written and wrong later unless maintained.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 3,
          },
          {
            label: "Computing it from date_of_birth is exact and costs nothing to store.",
            marks: 0.5,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "Age changes every year without anyone updating the row, so a stored value is stale by construction and requires a job or a trigger to keep it honest. Computing it from date_of_birth on read is always exact, and the storage saved is trivial.",
      },
    ],
  },

  {
    id: "c2-2",
    unit: "u2",
    title: "Four kinds of key, and which one you dare to use",
    syllabusTag: "UNIT-II · attribute and key",
    hook: "Roll number is unique — until a student changes branch, gets a new roll number, and every table in the college has to be updated.",
    beats: [
      {
        kind: "problem",
        text: "The design uses roll number everywhere: fees, library, hostel, marks. It is unique and it is short, so it looks like the perfect key. Then the examination branch renumbers one student in the third year, and eleven tables must be updated in a single transaction, or the student's records split in two.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to use the student's name instead, since that never changes. It fails immediately: a section can hold two students with the same name, so the name does not identify a row, and the database will now either accept duplicate rows or reject a legitimate admission.",
      },
      {
        kind: "mechanism",
        text: "A super key is any set of attributes that uniquely identifies a tuple; a candidate key is a super key with no redundant attribute — it is minimal; the primary key is the candidate key chosen for use, and it may not be NULL; the remaining candidates are alternate keys; a foreign key is an attribute in one relation whose values must match a candidate key of another, which is how referential integrity is expressed. {roll_no, name} is a super key but not a candidate key, because roll_no alone already identifies the row and name adds nothing.",
        figure: {
          type: "tree",
          caption: "Every candidate key is a super key. The converse is false.",
          root: {
            label: "super keys of STUDENT",
            children: [
              {
                label: "minimal (candidate keys)",
                children: [
                  { label: "{roll_no}", key: true },
                  { label: "{aadhaar_no}", key: true },
                ],
              },
              {
                label: "non-minimal",
                children: [
                  { label: "{roll_no, name}" },
                  { label: "{roll_no, aadhaar_no}" },
                ],
              },
            ],
          },
        },
      },
      {
        kind: "cost",
        text: "Natural keys are meaningful to humans and stable only while the world leaves them alone; surrogate keys are stable because they mean nothing, but every report needs a join to find out who the row is. Referential integrity also blocks deletions you might consider legitimate, so the delete policy — restrict, cascade, or set null — has to be chosen deliberately rather than discovered.",
      },
    ],
    gate: {
      id: "g2-2",
      prompt: "Is {roll_no, name} a candidate key of STUDENT?",
      options: [
        {
          text: "Yes — it uniquely identifies a student.",
          correct: false,
          why: "It does uniquely identify a student, which makes it a super key. Candidate requires more.",
        },
        {
          text: "No — it is a super key but not minimal, because roll_no alone suffices.",
          correct: true,
          why: "Minimality is what separates a candidate key from a super key. Remove an attribute and uniqueness must be lost.",
        },
        {
          text: "No — name is not a key attribute at all.",
          correct: false,
          why: "Any attribute may appear in a key. The issue is redundancy, not suitability.",
        },
        {
          text: "Only if name is declared NOT NULL.",
          correct: false,
          why: "Nulls affect whether it can be a primary key, not whether it is minimal.",
        },
      ],
    },
    items: [
      {
        id: "i2-2-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain primary key, super key and foreign key, with one example of each.",
        rubric: [
          {
            label: "Super key: a set of attributes that uniquely identifies a tuple; may contain redundant attributes.",
            marks: 1.5,
            tag: "key-confusion",
            beat: 2,
          },
          {
            label: "Primary key: the chosen minimal candidate key; unique and not NULL, one per relation.",
            marks: 2,
            tag: "key-confusion",
            beat: 2,
          },
          {
            label:
              "Foreign key: attribute(s) in one relation matching a candidate key of another, enforcing referential integrity.",
            marks: 1.5,
            tag: "key-confusion",
            beat: 2,
          },
        ],
        model:
          "A super key is any set of attributes whose values uniquely identify a tuple — {roll_no, name} qualifies. A candidate key is a minimal super key; the primary key is the candidate chosen as the identifier, for example roll_no in STUDENT, and it cannot be NULL. A foreign key is an attribute of one relation whose values must appear as a candidate key value in another relation — dept_id in STUDENT referencing dept_id in DEPARTMENT — which is how referential integrity is enforced.",
      },
      {
        id: "i2-2-2",
        kind: "practice",
        marks: 3,
        prompt:
          "Distinguish a candidate key from an alternate key, and say why a relation has exactly one primary key.",
        rubric: [
          {
            label: "Candidate keys are all minimal identifiers; the alternate keys are the candidates not chosen.",
            marks: 1.5,
            tag: "key-confusion",
            beat: 2,
          },
          {
            label: "One primary key because the primary key is a design choice — the chosen identifier — not a property of the data.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
        ],
        model:
          "Every minimal identifier is a candidate key; once one is chosen as the primary key, the others are alternate keys. The primary key is singular because it is a decision about which identifier the schema will use — the data may permit several, but the design nominates one.",
      },
      {
        id: "i2-2-3",
        kind: "practice",
        marks: 4,
        prompt:
          "A foreign key references a department that is then deleted. State the three policies available and the consequence of each.",
        rubric: [
          {
            label: "RESTRICT / NO ACTION: the delete is rejected while referencing rows exist.",
            marks: 1.5,
            tag: "constraint-mix",
            beat: 3,
          },
          {
            label: "CASCADE: the referencing rows are deleted too.",
            marks: 1.5,
            tag: "constraint-mix",
            beat: 3,
          },
          {
            label: "SET NULL: the referencing attribute is set to NULL, which requires it to be nullable.",
            marks: 1,
            tag: "constraint-mix",
            beat: 3,
          },
        ],
        model:
          "RESTRICT rejects the deletion, protecting the referencing students but requiring them to be moved first. CASCADE deletes the referencing students along with the department, which is correct for a weak dependent and catastrophic for a person. SET NULL clears the reference, preserving the students but losing the fact that they belonged somewhere — and it requires the column to allow NULL.",
      },
    ],
  },

  {
    id: "c2-3",
    unit: "u2",
    title: "A relationship without cardinality is not a design",
    syllabusTag: "UNIT-II · relationships, relation types, roles and structural constraints",
    hook: "A student takes a course. Six courses later the student's row has been copied six times, and her address is now stored in six places.",
    beats: [
      {
        kind: "problem",
        text: "The sentence a student takes a course does not say how many. If it is one course per student, the course code can sit in the student row. If it is many, that same design forces a copy of the student for every course, and the address begins to disagree with itself.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to add a second course column. It fails at the third course, and it has already made the table wider for everyone who takes one, leaving NULLs that mean nothing.",
      },
      {
        kind: "mechanism",
        text: "Say the constraint out loud. Degree is how many entity types take part — unary, binary, ternary. Cardinality ratio is 1:1, 1:N or M:N. Participation is total or partial: total means every entity of that type must take part, drawn with a double line. Roles name each side's function, and are essential when an entity type relates to itself, as in Employee manages Employee. A M:N relationship cannot live as a column: it becomes its own relation whose key is the combination of both keys.",
        figure: {
          type: "table",
          caption: "The cardinality ratio decides where the design goes next.",
          columns: ["Ratio", "Where the key goes", "Example"],
          rows: [
            ["1:1", "Either side, or merged", "HOD heads Department"],
            ["1:N", "The key of the N side holds the 1 side's key", "Department employs Employee"],
            ["M:N", "Its own relation, keyed by both", "Student enrols Course"],
            ["M:N with attributes", "Its own relation carrying those attributes", "Enrols with grade"],
          ],
          mark: [{ r: 2, c: 1, tone: "key" }],
        },
      },
      {
        kind: "cost",
        text: "M:N costs a bridge relation and a join on every read. Total participation is a constraint most database engines cannot enforce directly — it needs a trigger or a deferred check — so the drawing promises more than the implementation delivers unless you add that work.",
      },
    ],
    gate: {
      id: "g2-3",
      prompt:
        "In Employee manages Employee, what is the second Employee in the relationship?",
      options: [
        {
          text: "A second entity type.",
          correct: false,
          why: "There is only one entity type here. That is what makes the relationship recursive.",
        },
        {
          text: "A role name — the manager — played by the same entity type.",
          correct: true,
          why: "When an entity type relates to itself, roles distinguish the participants. Without roles the diagram is ambiguous.",
        },
        {
          text: "A weak entity.",
          correct: false,
          why: "Weakness concerns identification by an owner, not participation in a self-relationship.",
        },
        {
          text: "An attribute of Employee.",
          correct: false,
          why: "The manager is another employee, not a property of this one.",
        },
      ],
    },
    items: [
      {
        id: "i2-3-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain relationship degree, cardinality ratio and participation constraint, and state how each affects the relational design.",
        rubric: [
          {
            label: "Degree: number of participating entity types; unary, binary, ternary named.",
            marks: 1.5,
            tag: "cardinality-unstated",
            beat: 2,
          },
          {
            label: "Cardinality ratio 1:1, 1:N, M:N with the mapping consequence for each.",
            marks: 2,
            tag: "cardinality-unstated",
            beat: 2,
          },
          {
            label: "Participation total or partial, with the double line and the enforcement problem.",
            marks: 1.5,
            tag: "cardinality-unstated",
            beat: 2,
          },
        ],
        model:
          "Degree is the number of entity types in the relationship — unary when one type relates to itself, binary for two, ternary for three. Cardinality ratio fixes how many instances pair with how many: 1:1 either side may hold the key, 1:N the N side holds the 1 side's key, M:N needs a separate relation keyed by both. Participation is total when every instance must take part, drawn with a double line, and partial otherwise; total participation cannot be enforced by most engines without a trigger, so it is a constraint the application must carry.",
      },
      {
        id: "i2-3-2",
        kind: "practice",
        marks: 4,
        prompt:
          "A student may enrol in many courses and a course may have many students, and each enrolment carries a grade. Show the relations you would create and state each key.",
        rubric: [
          {
            label: "STUDENT and COURSE kept as separate relations with their own primary keys.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "ENROLS created as a third relation holding both keys as a composite key.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "grade placed on ENROLS, not on STUDENT or COURSE, with the reason implied or stated.",
            marks: 1,
            tag: "cardinality-unstated",
            beat: 2,
          },
        ],
        model:
          "Three relations. STUDENT(roll_no PK, name). COURSE(course_code PK, title). ENROLS(roll_no, course_code, grade) with primary key (roll_no, course_code) and both attributes as foreign keys. The grade belongs on ENROLS because it is a property of one enrolment — one student in one course — and putting it anywhere else would either duplicate it or make it unattributable.",
      },
      {
        id: "i2-3-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Why can a 1:N relationship be stored as an attribute but an M:N relationship cannot?",
        rubric: [
          {
            label: "In 1:N each entity on the N side relates to at most one on the 1 side, so one foreign key suffices.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "In M:N a single attribute cannot hold several values, so a separate relation is required.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "In 1:N every employee belongs to exactly one department, so a single dept_id column holds the whole relationship. In M:N one student relates to several courses, and an attribute cannot hold a set of values without violating atomicity, so the relationship must be materialised as its own relation with one row per pairing.",
      },
    ],
  },

  {
    id: "c2-4",
    unit: "u2",
    title: "Room 101 exists twice",
    syllabusTag: "UNIT-II · weak entities",
    hook: "Room 101 is in Block A and Block A has no room 101 that anybody can find without knowing the block. The room number alone identifies nothing.",
    beats: [
      {
        kind: "problem",
        text: "The college numbers rooms within each block. Room 101 in Block A and Room 101 in Block B are different rooms with the same number, so the room entity has no key of its own. A timetable row that says 101 is ambiguous, and a booking system built on it will double-book.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to invent a global room id, 1 to 400, and stop using block-relative numbers. It fails on the human side: the clerk reading the timetable cannot find room 217 in a building where every door says something else, so the invented key is immediately abandoned in practice and the ambiguity returns.",
      },
      {
        kind: "mechanism",
        text: "This is a weak entity: it has no key attribute of its own, only a partial key — the room number — which is unique only within its owner. It is drawn with a double rectangle, joined to its owner by an identifying relationship drawn with a double diamond, with the partial key underlined with a dashed line, and with total participation on the weak side, because a room cannot exist without a block. Its key is the owner's key plus the partial key: (block_id, room_no).",
        figure: {
          type: "compare",
          caption: "Strong and weak entities differ in where identity comes from.",
          good: {
            title: "Weak — ROOM",
            items: [
              "Double rectangle",
              "Partial key room_no, dashed underline",
              "Identifying relationship, double diamond",
              "Total participation: cannot exist alone",
              "Key = (block_id, room_no)",
            ],
          },
          bad: {
            title: "Strong — BLOCK",
            items: [
              "Single rectangle",
              "Own key block_id",
              "Exists independently",
              "May participate partially in other relationships",
            ],
          },
        },
      },
      {
        kind: "cost",
        text: "Every access to a weak entity needs its owner's key, so every query is a join, and deleting the owner must cascade or be refused. If the same room number can move between blocks, the key changes and every referencing row must change with it.",
      },
    ],
    gate: {
      id: "g2-4",
      prompt: "How is a weak entity's primary key formed in the relational model?",
      options: [
        {
          text: "From its partial key alone.",
          correct: false,
          why: "The partial key is unique only within one owner. Room 101 exists in every block.",
        },
        {
          text: "From the owner's primary key plus its own partial key.",
          correct: true,
          why: "(block_id, room_no). The owner supplies the missing half of the identity.",
        },
        {
          text: "From an automatically generated surrogate.",
          correct: false,
          why: "You may add one in practice, but it is not what the ER model specifies.",
        },
        {
          text: "A weak entity has no key at all.",
          correct: false,
          why: "It has no key of its own, which is different from having no key.",
        },
      ],
    },
    items: [
      {
        id: "i2-4-1",
        kind: "exit",
        marks: 5,
        prompt:
          "What is a weak entity? Explain its identifying relationship, partial key and total participation, with an example.",
        rubric: [
          {
            label: "Defines a weak entity as one with no key attribute of its own, existence-dependent on an owner.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Identifying relationship, drawn as a double diamond, linking it to the owner.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Partial key with a dashed underline, unique only within the owner; total participation shown by a double line.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "A weak entity has no key attribute that identifies it on its own; it depends on an owner entity for its existence. It is linked to the owner by an identifying relationship, drawn as a double diamond, and both the weak entity and that relationship are drawn with double outlines. It carries a partial key, underlined with a dashed line, which is unique only within one owner. Participation is total on the weak side. Example: ROOM in a college, where room_no repeats across BLOCK, so the key is (block_id, room_no).",
      },
      {
        id: "i2-4-2",
        kind: "practice",
        marks: 3,
        prompt:
          "Convert ROOM (weak, owner BLOCK) into relations, and state the primary key and the delete rule you need.",
        rubric: [
          {
            label: "BLOCK(block_id PK, ...) and ROOM(block_id, room_no, ...) with composite key.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Foreign key block_id with ON DELETE CASCADE, because a room cannot outlive its block.",
            marks: 1,
            tag: "constraint-mix",
            beat: 3,
          },
        ],
        model:
          "BLOCK(block_id PK, block_name) and ROOM(block_id, room_no, capacity) with primary key (block_id, room_no) and block_id a foreign key to BLOCK. The delete rule must be CASCADE, or the delete refused, because a room whose block no longer exists is not a room — it is an orphan row that will confuse every later query.",
      },
      {
        id: "i2-4-3",
        kind: "practice",
        marks: 2,
        prompt: "Why does a weak entity always have total participation in its identifying relationship?",
        rubric: [
          {
            label: "Because its identity is derived from the owner — without the owner it cannot be identified at all.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Ties the answer to existence dependency, not merely to convention.",
            marks: 0.5,
            tag: "definition-only",
            beat: 2,
          },
        ],
        model:
          "Its key includes the owner's key, so an instance without an owner has no identity and cannot be stored meaningfully. Total participation is the diagram's way of saying that the dependency is structural, not optional.",
      },
    ],
  },

  {
    id: "c2-5",
    unit: "u2",
    title: "One table of people, three kinds of person",
    syllabusTag: "UNIT-II · sub classes, super classes, inheritance, specialisation and generalisation",
    hook: "Everyone has a name and an address. Students have a roll number, faculty have a salary, and clerks have neither. The obvious table has both columns and mostly NULLs.",
    beats: [
      {
        kind: "problem",
        text: "One PERSON table needs roll_no for students and salary for faculty, so every clerk row carries two NULLs. The constraint that a salary belongs only to faculty cannot be expressed, because at table level a row is a person and nothing more. Add a third subtype next year and the table grows two more mostly-empty columns.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to keep one table and let the application check who has a salary. It fails the moment a second application writes to the same table, and it leaves the schema unable to say what everyone in the organisation knows.",
      },
      {
        kind: "mechanism",
        text: "Model the general and the particular. A superclass holds what is shared; subclasses hold what is particular and inherit everything above them — attributes, relationships and constraints. Specialisation works top-down: split PERSON into STUDENT and FACULTY. Generalisation works bottom-up: notice that STUDENT and FACULTY share attributes and extract PERSON. Constraints matter more than the boxes: disjoint means no entity may belong to two subclasses, overlapping allows it; total means every superclass entity must belong to some subclass, partial allows one to belong to none. Attribute-defined specialisation uses a value, user-defined lets the user choose.",
        figure: {
          type: "tree",
          caption: "PERSON specialised into three subtypes, disjoint and partial.",
          root: {
            label: "PERSON (name, address)",
            children: [
              { label: "STUDENT (+ roll_no, programme)", key: true },
              { label: "FACULTY (+ emp_id, salary)", key: true },
              { label: "CLERK (+ emp_id, grade)", key: true },
            ],
          },
        },
      },
      {
        kind: "cost",
        text: "Every subtype attribute lives in its own table, so reading a full student means joining back to PERSON. A deep hierarchy turns every query into a chain of joins, and the disjointness and completeness constraints are usually enforced by triggers rather than declared in the schema.",
      },
    ],
    gate: {
      id: "g2-5",
      prompt:
        "If no person may be both a student and a faculty member, the specialisation is:",
      options: [
        {
          text: "Overlapping.",
          correct: false,
          why: "Overlapping permits membership of more than one subclass.",
        },
        {
          text: "Disjoint.",
          correct: true,
          why: "Disjoint forbids an entity belonging to two subclasses of the same specialisation.",
        },
        {
          text: "Total.",
          correct: false,
          why: "Total concerns whether every superclass entity must belong to some subclass, not whether it may belong to two.",
        },
        {
          text: "Partial.",
          correct: false,
          why: "Partial allows an entity to belong to no subclass at all.",
        },
      ],
    },
    items: [
      {
        id: "i2-5-1",
        kind: "exit",
        marks: 7.5,
        prompt:
          "Compare generalisation and specialisation with an example, and state the two constraints that apply to both.",
        rubric: [
          {
            label: "Specialisation: top-down, splitting a superclass into subclasses on a distinguishing property.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Generalisation: bottom-up, extracting common attributes from entity types into a superclass.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "A worked example — PERSON into STUDENT/FACULTY, or STUDENT and FACULTY into PERSON — used in the right direction.",
            marks: 2,
            tag: "no-example",
            beat: 2,
          },
          {
            label: "Disjoint/overlapping and total/partial both named and defined.",
            marks: 1.5,
            tag: "incomplete-list",
            beat: 2,
          },
        ],
        model:
          "Specialisation is top-down: you take a general entity type such as PERSON and split it into STUDENT and FACULTY because they have attributes and relationships the general type does not. Generalisation is bottom-up: having modelled STUDENT and FACULTY separately, you notice they share name and address and extract a common superclass PERSON, from which they inherit. The two are inverses of the same structure. Both carry the disjointness constraint — disjoint, so no entity is in two subclasses; overlapping, so it may be — and the completeness constraint — total, so every superclass entity belongs to some subclass; partial, so it need not.",
      },
      {
        id: "i2-5-2",
        kind: "practice",
        marks: 3,
        prompt:
          "What is inheritance in an EER model, and what exactly is inherited?",
        rubric: [
          {
            label: "A subclass inherits the attributes of its superclass without redeclaring them.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "It also inherits relationships and constraints, and may add its own specific ones.",
            marks: 1.5,
            tag: "incomplete-list",
            beat: 2,
          },
        ],
        model:
          "A subclass inherits everything defined at the superclass: its attributes, its participation in relationships, and its constraints. It then adds attributes and relationships particular to itself. That is why STUDENT need not redeclare name and address — it has them by inheritance, and declaring them again would create two facts that could disagree.",
      },
      {
        id: "i2-5-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Sketch the tables for PERSON specialised into STUDENT and FACULTY, and say what happens to a student's name.",
        rubric: [
          {
            label: "PERSON(person_id PK, name, address) plus STUDENT(person_id FK PK, roll_no, programme) and FACULTY(person_id FK PK, salary).",
            marks: 2,
            tag: "mechanism-missing",
            beat: 3,
          },
          {
            label: "The name is stored once, in PERSON, and reached by joining on person_id.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 3,
          },
        ],
        model:
          "PERSON(person_id PK, name, address), STUDENT(person_id PK FK, roll_no, programme), FACULTY(person_id PK FK, salary). A student's name exists once, in PERSON; STUDENT holds only person_id and the student-specific attributes. Reading a full student joins the two on person_id, which is the price of not storing the name in every subtype.",
      },
    ],
  },
];
