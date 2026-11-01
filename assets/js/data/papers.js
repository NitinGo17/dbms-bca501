/**
 * Verified previous-year papers (FR-8).
 *
 * Every question below is transcribed from the question papers held in the
 * syllabus collection: B.C.A. Examination Dec-2023, Dec-2024 and Dec-2025,
 * Introduction to DBMS (BCA-501), paper code 18021, C.C.S. University, Meerut.
 * Nothing here is generated and presented as a previous-year question (AC-8.5).
 *
 * Mark schemes are authored for this platform against the wording of each
 * question. They are not official university marking schemes, and the interface
 * says so (AC-4.5, and the exclusion on attributing a grade to an examiner).
 */

const SECTION_A_NOTE = "Attempt all questions. Each question carries 3 marks. Very short answer required, not exceeding 75 words.";

export const PAPERS = [
  {
    id: "p2023",
    year: 2023,
    label: "Dec 2023",
    totalMarks: 75,
    durationMinutes: 180,
    verified: true,
    source:
      "B.C.A. Examination, Dec-2023 · Introduction to DBMS (BCA-501) · paper code 18021 · C.C.S. University, Meerut",
    sections: [
      {
        name: "Section A",
        note: SECTION_A_NOTE,
        attempt: "all",
        count: 5,
        marksEach: 3,
        questions: [
          {
            n: 1,
            marks: 3,
            unit: "u1",
            prompt: "Define database management system.",
            rubric: [
              { label: "Defines a DBMS as software that stores, manages and provides controlled access to a database.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Names at least two of its jobs — defining structure, storing data, concurrency, recovery, security.", marks: 1, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "A database management system is software that stores data in a structured form and provides controlled access to it. It defines the schema, stores the data and its catalogue, and mediates every access so that concurrency, integrity, security and recovery are handled by the system rather than by each application.",
          },
          {
            n: 2,
            marks: 3,
            unit: "u1",
            prompt: "List any five applications of DBMS.",
            rubric: [
              { label: "Five distinct, plausible applications — a list question, so five is the requirement.", marks: 3, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "Banking (accounts, transactions), railway and airline reservation, university examination and admission records, hospital patient and billing systems, and e-commerce catalogues with order history. Also common: payroll, library circulation, telecom billing, insurance policies and government land records.",
          },
          {
            n: 3,
            marks: 3,
            unit: "u1",
            prompt: "What are the disadvantages of file processing system?",
            rubric: [
              { label: "Names data redundancy and the inconsistency that follows from it.", marks: 1.5, tag: "redundancy-not-named", beat: 0 },
              { label: "Names at least two further disadvantages: difficulty of access, data isolation, integrity problems, atomicity problems, concurrent access anomalies, security problems.", marks: 1.5, tag: "incomplete-list", beat: 1 },
            ],
            model:
              "The same fact is stored in several files, so it is redundant and the copies can disagree — data inconsistency. Data is scattered across files in different formats, which makes ad-hoc access difficult and isolates each file from the others. Integrity rules live inside individual programs, atomicity is not guaranteed across files, concurrent access can lose updates, and security must be re-implemented in every program.",
          },
          {
            n: 4,
            marks: 3,
            unit: "u1",
            prompt: "Define data model.",
            rubric: [
              { label: "Defines a data model as a collection of concepts for describing data, relationships, semantics and constraints.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Names the common models — relational, hierarchical, network, object — or the three parts: structure, operations, constraints.", marks: 1, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "A data model is a collection of concepts used to describe the structure of a database — the data, the relationships between it, its semantics and its constraints — together with the operations permitted on it. Common models are the relational, hierarchical, network and object models, each offering a different set of structural primitives.",
          },
          {
            n: 5,
            marks: 3,
            unit: "u2",
            prompt: "What are attributes? Give examples.",
            rubric: [
              { label: "Defines an attribute as a property or characteristic of an entity type, taking values from a domain.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Gives examples on a named entity — roll_no, name, dob for STUDENT.", marks: 1, tag: "no-example", beat: 2 },
            ],
            model:
              "An attribute is a named property of an entity type, each value drawn from a domain. For STUDENT: roll_no (simple), name (simple), address (composite, of street, city and PIN), phone (multi-valued), date_of_birth (single-valued) and age (derived from date_of_birth).",
          },
        ],
      },
      {
        name: "Section B",
        note: "Attempt any two questions out of the following three. Each question carries 7.5 marks. Short answer required, not exceeding 200 words.",
        attempt: "any",
        count: 2,
        marksEach: 7.5,
        questions: [
          {
            n: 6,
            marks: 7.5,
            unit: "u2",
            prompt: "Compare generalisation and specialisation with an example.",
            rubric: [
              { label: "Specialisation described top-down: a superclass split into subclasses on a distinguishing property.", marks: 2.5, tag: "definition-only", beat: 2 },
              { label: "Generalisation described bottom-up: common attributes extracted from entity types into a superclass.", marks: 2.5, tag: "definition-only", beat: 2 },
              { label: "One consistent example used in both directions, with the constraints (disjoint/overlapping, total/partial) named.", marks: 2.5, tag: "no-example", beat: 2 },
            ],
            model:
              "Specialisation proceeds from the general to the particular: PERSON is split into STUDENT and FACULTY because each has attributes the general type lacks, such as roll_no or salary. Generalisation proceeds from the particular to the general: having modelled STUDENT and FACULTY, the shared attributes name and address are extracted into PERSON. The two are inverses of the same structure, and both are constrained by whether an entity may belong to more than one subclass (disjoint or overlapping) and whether every superclass entity must belong to some subclass (total or partial).",
          },
          {
            n: 7,
            marks: 7.5,
            unit: "u4",
            prompt: "Explain the primary key, super key and foreign key.",
            rubric: [
              { label: "Super key: any attribute set that uniquely identifies a tuple; may contain redundant attributes.", marks: 2.5, tag: "key-confusion", beat: 2 },
              { label: "Primary key: the chosen minimal candidate key, unique and never NULL.", marks: 2.5, tag: "key-confusion", beat: 2 },
              { label: "Foreign key: attribute(s) of one relation matching a candidate key of another, enforcing referential integrity.", marks: 2.5, tag: "key-confusion", beat: 2 },
            ],
            model:
              "A super key is any set of attributes whose values uniquely identify a tuple, so {roll_no, name} is a super key of STUDENT. A candidate key is a minimal super key; the primary key is the candidate chosen as the identifier — roll_no — and it may not be NULL. A foreign key is an attribute of one relation whose values must match a candidate key value in another relation, as dept_id in STUDENT references DEPT; it is what enforces referential integrity, and its value may be NULL if the attribute is nullable.",
          },
          {
            n: 8,
            marks: 7.5,
            unit: "u6",
            prompt: "What is normalization?",
            rubric: [
              { label: "Defines normalisation as decomposing relations to remove redundancy and the anomalies it causes.", marks: 2.5, tag: "definition-only", beat: 2 },
              { label: "Names the three anomalies — insertion, deletion, update — with a one-line illustration.", marks: 2.5, tag: "incomplete-list", beat: 2 },
              { label: "Names the normal forms in order and the dependency each removes.", marks: 2.5, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "Normalisation is the step-by-step decomposition of relations so that each fact is stored once, removing redundancy and the three anomalies it produces: an insertion anomaly, where a fact cannot be recorded without inventing an unrelated row; a deletion anomaly, where deleting one fact destroys another; and an update anomaly, where one correction must be repeated in many rows and can be missed. 1NF removes repeating groups, 2NF removes partial dependencies, 3NF removes transitive dependencies, and BCNF requires every determinant to be a super key.",
          },
        ],
      },
      {
        name: "Section C",
        note: "Attempt any three questions out of the following five. Each question carries 15 marks. Answer is required in detail.",
        attempt: "any",
        count: 3,
        marksEach: 15,
        questions: [
          {
            n: 9,
            marks: 15,
            unit: "u2",
            prompt:
              "Draw an ER diagram for a small marketing company database, assuming your own data requirements.",
            rubric: [
              { label: "States the assumptions: the entities chosen and what the company does with them.", marks: 2, tag: "no-example", beat: 2 },
              { label: "At least four entities, each with attributes and a key underlined.", marks: 4, tag: "incomplete-list", beat: 2 },
              { label: "Relationships with degree and cardinality ratio marked (1:1, 1:N, M:N), correctly.", marks: 4, tag: "cardinality-unstated", beat: 2 },
              { label: "Correct ER symbols: rectangles for entities, ovals for attributes, diamonds for relationships, double outlines where weak.", marks: 3, tag: "notation-slip", beat: 2 },
              { label: "Participation constraints shown, and the diagram is legible and consistent with the stated assumptions.", marks: 2, tag: "cardinality-unstated", beat: 2 },
            ],
            model:
              "State the assumptions first: the company sells products to customers through salespersons, and runs campaigns. Entities: CUSTOMER(cust_id, name, city), PRODUCT(prod_id, name, price), SALESPERSON(emp_id, name, region), CAMPAIGN(camp_id, title, budget), and ORDER as a relationship with attributes. Relationships: CUSTOMER places ORDER for PRODUCT, an M:N relationship carrying order_date and quantity, so it becomes its own relation; SALESPERSON handles CUSTOMER, 1:N, so cust_id holds emp_id; CAMPAIGN targets PRODUCT, M:N. Draw entities as rectangles with the key underlined, attributes as ovals, relationships as diamonds labelled with the cardinality, and double lines where participation is total.",
          },
          {
            n: 10,
            marks: 15,
            unit: "u1",
            prompt:
              "Describe the classification of database language. Which type of language is SQL?",
            rubric: [
              { label: "DDL with examples — CREATE, ALTER, DROP — and what it acts on.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "DML with examples — SELECT, INSERT, UPDATE, DELETE.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "DCL with examples — GRANT, REVOKE — and TCL with COMMIT, ROLLBACK.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "States that SQL is a comprehensive language spanning all four, and that its DML is declarative.", marks: 4, tag: "definition-only", beat: 2 },
              { label: "Classification is justified by what each family acts on, not merely listed.", marks: 2, tag: "mechanism-missing", beat: 2 },
            ],
            model:
              "Database languages are classified by what they act on. DDL defines and alters structure: CREATE, ALTER, DROP, TRUNCATE. DML manipulates the rows themselves: SELECT, INSERT, UPDATE, DELETE, resting on the relational algebra. DCL controls access: GRANT and REVOKE. TCL delimits transactions: COMMIT, ROLLBACK, SAVEPOINT. SQL is a comprehensive, non-procedural language: it contains DDL, DML and DCL statements, so it is a complete database language rather than merely a query language, and its DML is declarative — the user states the required result and the optimiser chooses the access path.",
          },
          {
            n: 11,
            marks: 15,
            unit: "u1",
            prompt: "Explain the following: (i) DDL Command (ii) DML Command.",
            rubric: [
              { label: "DDL defined as statements that define or modify the schema.", marks: 3, tag: "definition-only", beat: 2 },
              { label: "CREATE, ALTER and DROP each explained with a statement-level example.", marks: 4, tag: "incomplete-list", beat: 2 },
              { label: "DML defined as statements that retrieve and modify the data itself.", marks: 3, tag: "definition-only", beat: 2 },
              { label: "SELECT, INSERT, UPDATE and DELETE each explained with an example.", marks: 4, tag: "incomplete-list", beat: 2 },
              { label: "The distinction between changing structure and changing content is stated explicitly.", marks: 1, tag: "definition-only", beat: 2 },
            ],
            model:
              "(i) DDL defines and modifies the schema — the structure rather than the contents. CREATE TABLE students(roll INT PRIMARY KEY, name VARCHAR(40)); adds a relation. ALTER TABLE students ADD dept VARCHAR(10); changes its shape. DROP TABLE students; removes it, and with it the data. (ii) DML retrieves and changes the rows. SELECT name FROM students WHERE dept = 'BCA'; retrieves. INSERT INTO students VALUES (1, 'Anjali', 'BCA'); adds a row. UPDATE students SET dept = 'MCA' WHERE roll = 1; changes one. DELETE FROM students WHERE roll = 1; removes one. DDL changes what the database is; DML changes what it holds.",
          },
          {
            n: 12,
            marks: 15,
            unit: "u1",
            prompt: "Explain data independence with its types.",
            rubric: [
              { label: "Defines data independence as changing one schema level without changing the level above it.", marks: 3, tag: "definition-only", beat: 2 },
              { label: "Three-schema architecture described, with the two mappings named.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "Logical data independence explained with a concrete change, such as adding an attribute or splitting a relation.", marks: 3.5, tag: "mechanism-missing", beat: 2 },
              { label: "Physical data independence explained with a concrete change, such as adding an index or changing file organisation.", marks: 3.5, tag: "mechanism-missing", beat: 2 },
              { label: "States the limits — dropping an attribute still breaks the views that used it.", marks: 2, tag: "cost-not-stated", beat: 3 },
            ],
            model:
              "Data independence is the capacity to change the schema at one level without altering the schema at the next higher level, which the three-schema architecture provides through its two mappings. Logical data independence concerns the external/conceptual mapping: the conceptual schema may gain an attribute or be decomposed into more relations while existing views and the applications behind them continue to work. Physical data independence concerns the conceptual/internal mapping: the storage structures may change — a new index, a different file organisation, a different device — while the conceptual schema and every program above it remain untouched. Independence is not absolute: dropping an attribute always breaks the views that selected it, and changing a domain can silently change results.",
          },
          {
            n: 13,
            marks: 15,
            unit: "u1",
            prompt:
              "Who are data administrators? What are the functions of the database administrator?",
            rubric: [
              { label: "Distinguishes the data administrator — owning meaning, standards and policy — from the DBA, who owns the system.", marks: 3, tag: "definition-only", beat: 2 },
              { label: "Schema definition and modification, including storage structures and access paths.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "Authorisation: granting and revoking access, and maintaining security policy.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "Integrity enforcement and constraint maintenance.", marks: 2, tag: "incomplete-list", beat: 2 },
              { label: "Monitoring and tuning performance, and planning backup and recovery.", marks: 4, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "Data administrators own the data as an organisational resource: its meaning, its standards, its naming conventions and the policy for who may hold it. The database administrator owns the system that holds it. DBA functions: defining and modifying the schema; defining storage structures and access paths and reorganising as the workload changes; granting and revoking authorisation and maintaining the security policy; enforcing integrity constraints; monitoring performance and tuning queries, indexes and storage; and planning and testing backup and recovery so that a failure costs the minimum. In small organisations one person carries both roles, which is precisely when the distinction matters least and is forgotten most.",
          },
        ],
      },
    ],
  },

  {
    id: "p2024",
    year: 2024,
    label: "Dec 2024",
    totalMarks: 75,
    durationMinutes: 180,
    verified: true,
    source:
      "B.C.A. Examination, Dec-2024 · Introduction to DBMS (BCA-501) · paper code 18021 · C.C.S. University, Meerut",
    sections: [
      {
        name: "Section A",
        note: "Attempt all the questions. 3 × 5 = 15.",
        attempt: "all",
        count: 5,
        marksEach: 3,
        questions: [
          {
            n: 1,
            marks: 3,
            unit: "u1",
            prompt: "What is schema?",
            rubric: [
              { label: "Defines a schema as the description of the database structure — relations, attributes, types, constraints.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Distinguishes it from an instance: the schema is stable, the instance changes.", marks: 1, tag: "definition-only", beat: 2 },
            ],
            model:
              "A schema is the description of a database: its relations, their attributes and data types, the keys and the constraints. It changes rarely and deliberately. The data held under it at any moment is the instance, which changes with every insert and delete while the schema stays fixed.",
          },
          {
            n: 2,
            marks: 3,
            unit: "u1",
            prompt: "What are the advantages of using DBMS?",
            rubric: [
              { label: "At least three advantages named correctly — controlled redundancy, consistency, sharing with concurrency, integrity, security, backup and recovery, data independence.", marks: 2, tag: "incomplete-list", beat: 2 },
              { label: "Each advantage tied to the problem it removes, not merely listed.", marks: 1, tag: "definition-only", beat: 2 },
            ],
            model:
              "Redundancy is controlled, so copies cannot disagree; the data is shared, with concurrency control preventing lost updates; integrity constraints are enforced by the system for every writer; access is authorised centrally rather than re-implemented per program; backup and recovery are provided; and programs are insulated from storage changes by data independence.",
          },
          {
            n: 3,
            marks: 3,
            unit: "u1",
            prompt: "Who is a DBA?",
            rubric: [
              { label: "Identifies the DBA as the person or group responsible for the database system.", marks: 1.5, tag: "definition-only", beat: 2 },
              { label: "Names at least three of the role's functions.", marks: 1.5, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "The database administrator is the person or group responsible for the database system: defining and modifying the schema, controlling storage and access structures, granting and revoking authorisation, enforcing integrity, monitoring and tuning performance, and planning backup and recovery.",
          },
          {
            n: 4,
            marks: 3,
            unit: "u1",
            prompt: "What is a database?",
            rubric: [
              { label: "Defines a database as an organised collection of related, persistent data.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Notes that it is described by a schema and managed by a DBMS, rather than being a loose set of files.", marks: 1, tag: "definition-only", beat: 2 },
            ],
            model:
              "A database is an organised collection of logically related data, stored persistently and described by a schema, so that it can be retrieved and updated by several applications without redundancy or inconsistency. The data and its description are held together, which is what distinguishes a database from a set of independent files.",
          },
          {
            n: 5,
            marks: 3,
            unit: "u4",
            prompt: "What is RDBMS?",
            rubric: [
              { label: "Defines an RDBMS as a DBMS whose data is organised as relations — tables of rows and columns.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Names the properties it enforces: keys, referential integrity, and relational operations such as SQL.", marks: 1, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "A relational database management system stores data as relations — tables of tuples and attributes — and provides operations on them. It enforces keys and referential integrity, and exposes a relational query language, usually SQL, whose statements are optimised into access plans.",
          },
        ],
      },
      {
        name: "Section B",
        note: "Attempt any two questions. 7.5 × 2 = 15.",
        attempt: "any",
        count: 2,
        marksEach: 7.5,
        questions: [
          {
            n: 6,
            marks: 7.5,
            unit: "u2",
            prompt:
              "Find the minimum number of tables required for the following ER diagram in the relational model.",
            figureNote:
              "The paper's diagram has three entity types — M with attributes M1, M2, M3; P with P1, P2; N with N1, N2 — joined by R1 between M and P and R2 between P and N. The cardinality marks on R1 and R2 are not legible in the copy held, so the answer depends on them. Both cases are given, which is what the marking scheme requires you to do when a ratio is not stated.",
            rubric: [
              { label: "States that the answer depends on the cardinality ratios of R1 and R2, rather than assuming one.", marks: 2, tag: "cardinality-unstated", beat: 2 },
              { label: "Case 1:N or 1:1 on both: three tables, one per entity, with the foreign key on the many side.", marks: 2.5, tag: "mechanism-missing", beat: 2 },
              { label: "Case M:N on either: three tables plus one bridge per M:N relationship.", marks: 2, tag: "mechanism-missing", beat: 2 },
              { label: "Applies the rule rather than guessing a number: M:N needs its own relation, 1:N does not.", marks: 1, tag: "mechanism-missing", beat: 2 },
            ],
            model:
              "The count follows from the cardinality of R1 and R2, so state it. If both are 1:N or 1:1, three tables suffice: M(M1, M2, M3), P(P1, P2) and N(N1, N2), with the key of the one side carried as a foreign key into the many side — M holding P's key for a 1:N R1, and so on. If either relationship is M:N, that relationship cannot live as a column: it becomes its own table keyed by the two participating keys, so the total rises to four, or five if both are M:N. Total participation does not change the count; it only makes the foreign key NOT NULL.",
          },
          {
            n: 7,
            marks: 7.5,
            unit: "u4",
            prompt: "What are UNION, MINUS and INTERSECT commands in DBMS?",
            rubric: [
              { label: "UNION returns rows in either, with duplicates removed.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "INTERSECT returns rows present in both; MINUS (EXCEPT) returns rows in the first and not the second.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Union compatibility stated: same degree, compatible domains, correspondence by position.", marks: 2, tag: "incomplete-list", beat: 2 },
              { label: "An example given, or UNION ALL contrasted for its duplicate behaviour.", marks: 1.5, tag: "no-example", beat: 2 },
            ],
            model:
              "These are the SQL set operators. UNION returns every row appearing in either query, with duplicates removed; UNION ALL keeps them. INTERSECT returns only rows appearing in both. MINUS, or EXCEPT in many dialects, returns rows from the first query that do not appear in the second. All three require union compatibility — the same number of columns with compatible types in corresponding positions, correspondence being positional rather than by name, with result column names taken from the first query.",
          },
          {
            n: 8,
            marks: 7.5,
            unit: "u1",
            prompt: "Define the following terms: (a) Data model (b) Database schema.",
            rubric: [
              { label: "(a) A data model as concepts for describing structure, relationships, semantics and constraints, with the common models named.", marks: 4, tag: "definition-only", beat: 2 },
              { label: "(b) A schema as the description of the database structure, distinct from the instance.", marks: 2.5, tag: "definition-only", beat: 2 },
              { label: "An example given for at least one of the two.", marks: 1, tag: "no-example", beat: 2 },
            ],
            model:
              "(a) A data model is a collection of concepts for describing data, its relationships, its semantics and its constraints, together with the operations allowed on it. The relational, hierarchical, network and object models differ in the structural primitives they offer. (b) A database schema is the description of a particular database under such a model: the relations, their attributes and types, the keys and the constraints. For example students(roll, name, dept) with roll as primary key. The schema is the structure; the rows held under it at a given moment are the instance.",
          },
        ],
      },
      {
        name: "Section C",
        note: "Attempt any three questions. 15 × 3 = 45.",
        attempt: "any",
        count: 3,
        marksEach: 15,
        questions: [
          {
            n: 9,
            marks: 15,
            unit: "u6",
            prompt:
              "Define normal forms. Explain 1NF, 2NF, 3NF and BCNF with suitable example.",
            rubric: [
              { label: "Defines normalisation and the anomalies it removes.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "1NF: atomic values, no repeating groups, with an example decomposition.", marks: 3, tag: "definition-only", beat: 2 },
              { label: "2NF: no partial dependency on a composite key, with the dependency identified explicitly.", marks: 3, tag: "partial-vs-transitive", beat: 2 },
              { label: "3NF: no transitive dependency, with the dependency identified explicitly.", marks: 3, tag: "partial-vs-transitive", beat: 2 },
              { label: "BCNF: every determinant is a super key, and distinguished from 3NF.", marks: 4, tag: "definition-only", beat: 2 },
            ],
            model:
              "Normalisation decomposes relations so each fact is stored once, removing insertion, deletion and update anomalies. 1NF requires every attribute to hold a single atomic value with no repeating groups, so STUDENT(roll, name, {subjects}) becomes one row per subject. 2NF requires 1NF and no partial dependency: in TAKES(roll, course, student_name) the student_name depends on roll alone, part of the key, so it moves to STUDENT(roll, name). 3NF requires 2NF and no transitive dependency: in STUDENT(roll, dept, dept_hod) the HOD depends on dept, a non-key attribute, so it moves to DEPT(dept, hod). BCNF requires every determinant to be a super key. It is stricter than 3NF and matters where candidate keys overlap, as in R(A, B, C) with AB → C and C → B, where C determines B but is not a super key.",
          },
          {
            n: 10,
            marks: 15,
            unit: "u6",
            prompt: "Explain normalization with advantages.",
            rubric: [
              { label: "Defines normalisation as decomposition to remove redundancy.", marks: 2.5, tag: "definition-only", beat: 2 },
              { label: "Names the normal forms in order with the dependency each removes.", marks: 4, tag: "incomplete-list", beat: 2 },
              { label: "Insertion anomaly explained with an example.", marks: 2.5, tag: "incomplete-list", beat: 2 },
              { label: "Deletion and update anomalies explained with examples.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "Advantages stated: consistency, smaller storage, simpler constraints, easier maintenance; and the cost — more joins — acknowledged.", marks: 3, tag: "cost-not-stated", beat: 3 },
            ],
            model:
              "Normalisation is the process of decomposing relations so that each fact is stored once. 1NF removes repeating groups, 2NF removes partial dependencies, 3NF removes transitive dependencies, and BCNF requires every determinant to be a super key. Removing redundancy removes three anomalies: an insertion anomaly, where a new department cannot be recorded until a student joins it; a deletion anomaly, where removing the last student of a department destroys the department's HOD; and an update anomaly, where one correction must be repeated across many rows. The advantages are consistency, less wasted storage, constraints that can be declared per relation, and schemas that survive change. The cost is that queries need more joins, which is why reporting systems sometimes denormalise deliberately.",
          },
          {
            n: 11,
            marks: 15,
            unit: "u4",
            prompt: "Explain SQL with various characteristics.",
            rubric: [
              { label: "SQL described as a comprehensive language containing DDL, DML and DCL, with examples.", marks: 4, tag: "incomplete-list", beat: 2 },
              { label: "Declarative or non-procedural: the result is described, not the procedure.", marks: 3, tag: "definition-only", beat: 2 },
              { label: "Set-oriented: operations act on sets of rows, and results are sets or multisets.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Standardised and portable across vendors, with dialect differences acknowledged.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Supports views, constraints, joins and aggregation; and the cost — a bad plan can be slow — stated.", marks: 4, tag: "cost-not-stated", beat: 3 },
            ],
            model:
              "SQL is a comprehensive database language: it contains DDL for structure (CREATE, ALTER, DROP), DML for rows (SELECT, INSERT, UPDATE, DELETE) and DCL for privileges (GRANT, REVOKE). It is declarative or non-procedural — a statement states the required result and the optimiser chooses the access path, join order and index use. It is set-oriented: statements act on sets of rows and return sets, with duplicates unless removed. It is standardised, so statements are broadly portable, though dialects differ over functions, set operators and limits. It supports views, constraints, joins, subqueries and aggregation. The consequence of being declarative is that two equivalent statements can differ enormously in cost, so the execution plan, not the wording, determines performance.",
          },
          {
            n: 12,
            marks: 15,
            unit: "u4",
            prompt: "What is relational algebra? Discuss its basic operations.",
            rubric: [
              { label: "Defines it as a procedural query language over relations.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Selection and projection, with the symbols and the distinction between them.", marks: 3, tag: "notation-slip", beat: 2 },
              { label: "Union, set difference and cartesian product, with the compatibility requirement.", marks: 3, tag: "notation-slip", beat: 2 },
              { label: "Rename, and at least one derived operator — join, intersection or division.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "Closure explained, with the consequence for query trees and optimisation.", marks: 2, tag: "mechanism-missing", beat: 2 },
              { label: "An example expression combining at least two operators.", marks: 2, tag: "no-example", beat: 2 },
            ],
            model:
              "Relational algebra is a procedural query language in which each operator takes one or two relations and returns a relation. Basic operations: selection σ, which keeps tuples satisfying a predicate; projection π, which keeps named attributes and removes duplicates; union ∪, difference − and cartesian product ×, which combine relations, the first two requiring union compatibility; and rename ρ, which renames a relation or attribute. Derived operators include intersection, join and division. Because every operator returns a relation the algebra is closed, so expressions nest into a tree, and equivalent trees can be compared on cost — which is what an optimiser does. Example: π(name)(STUDENT ⋈ σ(score > 60)(MARKS)).",
          },
          {
            n: 13,
            marks: 15,
            unit: "u2",
            prompt: "Explain the reduction of ER schema to tables.",
            rubric: [
              { label: "Strong entity types become a relation, with the key as primary key.", marks: 2.5, tag: "mechanism-missing", beat: 2 },
              { label: "Weak entity types become a relation whose key is the owner's key plus the partial key.", marks: 2.5, tag: "mechanism-missing", beat: 2 },
              { label: "1:1 and 1:N relationships handled by carrying a foreign key into the appropriate relation.", marks: 3, tag: "cardinality-unstated", beat: 2 },
              { label: "M:N relationships become their own relation keyed by both participants, carrying any relationship attributes.", marks: 3, tag: "cardinality-unstated", beat: 2 },
              { label: "Multi-valued attributes become their own relation; composite attributes are flattened into their components.", marks: 2, tag: "mechanism-missing", beat: 2 },
              { label: "Specialisation handled by one of the standard options, named and justified.", marks: 2, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "Each strong entity type becomes a relation with its key as primary key. A weak entity becomes a relation whose primary key is the owner's key plus its partial key, with a foreign key to the owner. A 1:1 relationship is carried as a foreign key on either side, preferably the one with total participation; a 1:N relationship is carried as a foreign key on the many side. An M:N relationship cannot be a column, so it becomes its own relation keyed by the two participating keys, carrying any attributes of the relationship such as grade or date. A multi-valued attribute becomes its own relation keyed by the entity key plus the attribute value; a composite attribute is flattened into its component attributes. A specialisation can be mapped as one table per subclass holding only the key plus specific attributes (requiring a join for the whole object), or as a single table with a type discriminator and nullable columns, or as one table per subclass repeating the superclass attributes — the choice trades joins against NULLs and duplication.",
          },
        ],
      },
    ],
  },

  {
    id: "p2025",
    year: 2025,
    label: "Dec 2025",
    totalMarks: 75,
    durationMinutes: 180,
    verified: true,
    source:
      "B.C.A. Examination, Dec-2025 · Introduction to DBMS (BCA-501) · paper code 18021 · C.C.S. University, Meerut",
    sections: [
      {
        name: "Section A",
        note: "Attempt all the questions. 3 × 5 = 15.",
        attempt: "all",
        count: 5,
        marksEach: 3,
        questions: [
          {
            n: 1,
            marks: 3,
            unit: "u1",
            prompt: "What do you mean by DBA? What are the roles of DBA? Write only the names.",
            rubric: [
              { label: "DBA identified as the person or group responsible for the database system.", marks: 1, tag: "definition-only", beat: 2 },
              { label: "The question asks for names only, so a clean list of at least five roles earns the remainder.", marks: 2, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "The DBA is the person or group responsible for the database system. Roles, named only: schema definition; storage structure and access path definition; authorisation and security; integrity enforcement; performance monitoring and tuning; backup and recovery; liaison with users and standards.",
          },
          {
            n: 2,
            marks: 3,
            unit: "u3",
            prompt: "Explain hashing in brief.",
            rubric: [
              { label: "A hash function maps a key to a bucket address directly.", marks: 1.5, tag: "definition-only", beat: 2 },
              { label: "Equality search reads one bucket, so cost does not grow with file size; collisions must be resolved.", marks: 1.5, tag: "mechanism-missing", beat: 2 },
            ],
            model:
              "Hashing computes a bucket address from the key with a hash function, so a record can be located without searching. An equality search reads one bucket, so its cost is independent of file size. Two keys may map to the same bucket — a collision — which is resolved by chaining overflow blocks or by probing further slots. The price is that order is destroyed, so range queries require a full scan.",
          },
          {
            n: 3,
            marks: 3,
            unit: "u2",
            prompt: "What do you mean by Entity?",
            rubric: [
              { label: "An entity as a distinguishable thing in the mini-world with independent existence.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Distinguishes the entity from the entity type and gives an example.", marks: 1, tag: "no-example", beat: 2 },
            ],
            model:
              "An entity is a thing in the mini-world that is distinguishable from other things and has an independent existence — this particular student, that particular book. Its definition is the entity type, such as STUDENT with attributes roll_no, name and dept; the set of all such instances at a moment is the entity set.",
          },
          {
            n: 4,
            marks: 3,
            unit: "u2",
            prompt: "What is generalisation? Explain with suitable example.",
            rubric: [
              { label: "Generalisation as a bottom-up process extracting common properties into a superclass.", marks: 1.5, tag: "definition-only", beat: 2 },
              { label: "A worked example — STUDENT and FACULTY generalised to PERSON — with inheritance implied.", marks: 1.5, tag: "no-example", beat: 2 },
            ],
            model:
              "Generalisation is bottom-up: having modelled two or more entity types, their common attributes and relationships are extracted into a superclass from which they inherit. STUDENT(roll_no, name, address) and FACULTY(emp_id, name, address) generalise to PERSON(person_id, name, address), with STUDENT and FACULTY as subclasses holding only their specific attributes.",
          },
          {
            n: 5,
            marks: 3,
            unit: "u1",
            prompt:
              "What do you mean by data inconsistency in file management system? Explain.",
            rubric: [
              { label: "Defines inconsistency as copies of the same fact disagreeing.", marks: 1.5, tag: "redundancy-not-named", beat: 0 },
              { label: "Traces it to redundancy plus updates applied to only some copies, with an example.", marks: 1.5, tag: "mechanism-missing", beat: 0 },
            ],
            model:
              "Data inconsistency means two copies of the same fact disagree. In a file system the fact is duplicated across files, so an update applied to one copy leaves the others stale — a student's surname corrected in the admission file but not in the library file. Nothing in the file system detects the disagreement, so both values persist and any report drawn from the wrong file is wrong.",
          },
        ],
      },
      {
        name: "Section B",
        note: "Attempt any two questions. 7.5 × 2 = 15.",
        attempt: "any",
        count: 2,
        marksEach: 7.5,
        questions: [
          {
            n: 6,
            marks: 7.5,
            unit: "u2",
            prompt: "Explain ER diagram. Explain about all symbols of ER diagram.",
            rubric: [
              { label: "ER diagram defined as a conceptual model of entities, attributes and relationships.", marks: 1.5, tag: "definition-only", beat: 2 },
              { label: "Rectangle, ellipse and diamond correctly assigned, with the double-outline variants for weak entities and identifying relationships.", marks: 2, tag: "notation-slip", beat: 2 },
              { label: "Lines and double lines for participation; cardinality labels 1, N, M on the edges.", marks: 2, tag: "notation-slip", beat: 2 },
              { label: "Key attribute underlined, partial key dashed, multi-valued double ellipse, derived dashed ellipse.", marks: 2, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "An ER diagram is the conceptual model of a mini-world in terms of entity types, their attributes and the relationships between them. Symbols: rectangle for an entity type, double rectangle for a weak entity type; ellipse for an attribute, double ellipse for a multi-valued attribute, dashed ellipse for a derived attribute, underline for a key attribute and dashed underline for a partial key; diamond for a relationship, double diamond for an identifying relationship; connecting lines, doubled to show total participation; and cardinality labels 1, M, N on the edges to fix the ratio.",
          },
          {
            n: 7,
            marks: 7.5,
            unit: "u2",
            prompt:
              "What are the attributes? Discuss about all types of attributes with suitable examples.",
            rubric: [
              { label: "Defines an attribute as a property of an entity type with values from a domain.", marks: 1.5, tag: "definition-only", beat: 2 },
              { label: "Simple, composite and single-valued explained with examples.", marks: 2, tag: "incomplete-list", beat: 2 },
              { label: "Multi-valued and derived explained with examples and their ER symbols.", marks: 2, tag: "incomplete-list", beat: 2 },
              { label: "Key attribute covered, and NULL explained as unknown or inapplicable rather than a value.", marks: 2, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "An attribute is a named property of an entity type whose values come from a domain. Simple or atomic: roll_no, indivisible. Composite: address, made of street, city and PIN, drawn as an ellipse over its components. Single-valued: date_of_birth. Multi-valued: phone, drawn with a double ellipse because one student may hold several. Derived: age, computed from date_of_birth, drawn with a dashed ellipse. Key: roll_no, underlined, unique and minimal. NULL is not a type but a marker for a value that is unknown or not applicable, and it propagates through arithmetic and comparison.",
          },
          {
            n: 8,
            marks: 7.5,
            unit: "u2",
            prompt:
              "Explain specialization and generalization concepts in ER diagram with suitable examples.",
            rubric: [
              { label: "Specialisation defined top-down with an example.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Generalisation defined bottom-up with an example.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Inheritance explained: subclasses inherit attributes and relationships.", marks: 1.5, tag: "definition-only", beat: 2 },
              { label: "Disjoint/overlapping and total/partial constraints named and applied to the example.", marks: 2, tag: "incomplete-list", beat: 2 },
            ],
            model:
              "Specialisation is top-down: a general entity type is divided into subclasses on some distinguishing property, so PERSON specialises into STUDENT and FACULTY, each gaining attributes the general type lacks. Generalisation is bottom-up: common properties of existing entity types are abstracted into a superclass, so STUDENT and FACULTY generalise into PERSON. In both, the subclasses inherit the superclass's attributes and relationships. The structure is constrained by disjointness — disjoint, so no entity is in two subclasses, or overlapping, so it may be — and by completeness — total, so every superclass entity must belong to a subclass, or partial, so it need not.",
          },
        ],
      },
      {
        name: "Section C",
        note: "Attempt any three questions. 15 × 3 = 45.",
        attempt: "any",
        count: 3,
        marksEach: 15,
        questions: [
          {
            n: 9,
            marks: 15,
            unit: "u6",
            prompt:
              "Explain the ACID properties of a transaction in DBMS and the usefulness of each with suitable example.",
            rubric: [
              { label: "Transaction defined as a logical unit of work, and the four properties named.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "Atomicity explained with the transfer example, and the undo mechanism named.", marks: 3, tag: "wrong-isolation", beat: 2 },
              { label: "Consistency explained as preserving constraints across valid states.", marks: 3, tag: "wrong-isolation", beat: 2 },
              { label: "Isolation explained as equivalence to a serial order, with a symptom such as the lost update.", marks: 3, tag: "wrong-isolation", beat: 2 },
              { label: "Durability explained with the log forced before commit.", marks: 3, tag: "wrong-isolation", beat: 2 },
              { label: "Each property tied to its mechanism, not merely defined.", marks: 1, tag: "mechanism-missing", beat: 2 },
            ],
            model:
              "A transaction is a logical unit of work that must be treated indivisibly. Atomicity: all of its writes take effect or none, so if a transfer debits A and the system fails before crediting B, the debit is undone from the log and no money is stranded. Consistency: the transaction moves the database from one valid state to another, so declared constraints — a non-negative balance — still hold afterwards. Isolation: concurrent transactions produce a result equivalent to some serial order, so two withdrawals cannot both read the same balance and both succeed; implemented by locking or timestamps. Durability: once committed, the effect survives failure, because the commit record is forced to stable storage before the commit is acknowledged. Together they are what make it safe to run many transactions concurrently on data that must not be lost.",
          },
          {
            n: 10,
            marks: 15,
            unit: "u2",
            prompt:
              "What do you mean by ER diagrams? Draw a neat ER diagram for hospital management system with entity relationship functionalities.",
            rubric: [
              { label: "ER diagram defined as a conceptual model of entities, attributes and relationships.", marks: 2, tag: "definition-only", beat: 2 },
              { label: "At least five relevant entities — PATIENT, DOCTOR, APPOINTMENT, WARD, BILL — each with attributes and a key.", marks: 4, tag: "incomplete-list", beat: 2 },
              { label: "Relationships with cardinality marked, including at least one M:N with its attributes.", marks: 4, tag: "cardinality-unstated", beat: 2 },
              { label: "Correct symbols throughout, including weak entity where appropriate — a ward's rooms, a patient's dependents.", marks: 3, tag: "notation-slip", beat: 2 },
              { label: "The diagram is legible and consistent with the stated requirements.", marks: 2, tag: "no-example", beat: 2 },
            ],
            model:
              "An ER diagram models a mini-world as entity types, attributes and relationships. For a hospital: PATIENT(patient_id, name, dob, blood_group), DOCTOR(doctor_id, name, specialisation), APPOINTMENT(appt_id, date, time), WARD(ward_id, type), BILL(bill_id, amount, status). PATIENT books APPOINTMENT with DOCTOR: an M:N relationship carrying date and time, so it becomes its own relation keyed by patient_id and doctor_id and date. DOCTOR works_in WARD, 1:N, with ward_id carried into DOCTOR. PATIENT is admitted to WARD, 1:N with admission_date. ROOM is a weak entity of WARD, keyed by ward_id plus room_no, drawn with a double rectangle and an identifying relationship. PATIENT is billed BILL, 1:N with total participation on the bill side, since a bill cannot exist without a patient. Draw entities as rectangles with keys underlined, relationships as diamonds with 1, N or M on the edges, and double lines where participation is total.",
          },
          {
            n: 11,
            marks: 15,
            unit: "u1",
            prompt:
              "What are the differences between file management system and DBMS? Also explain the components of database system.",
            rubric: [
              { label: "At least five differences, each stated as a contrast rather than one side only: redundancy, consistency, sharing and concurrency, integrity, security, recovery, independence.", marks: 6, tag: "incomplete-list", beat: 2 },
              { label: "Components named: hardware, software (DBMS), data, procedures, and people (users and administrator).", marks: 4, tag: "incomplete-list", beat: 2 },
              { label: "Each component explained, not only listed.", marks: 3, tag: "definition-only", beat: 2 },
              { label: "The comparison is applied — a consequence of each difference is stated.", marks: 2, tag: "mechanism-missing", beat: 2 },
            ],
            model:
              "A file management system stores records in independent files with the structure embedded in each program, whereas a DBMS stores data with a self-describing catalogue and mediates all access. Differences: redundancy is uncontrolled in files and controlled in a DBMS; inconsistency follows from redundancy in files and is prevented by a single copy in a DBMS; files are single-user or crudely locked while a DBMS supports concurrent sharing with transactions; integrity rules live in programs versus declared constraints; security is re-implemented per program versus granted centrally; recovery is the application's problem versus provided by logging and checkpoints; and files couple programs to storage layout, while a DBMS offers data independence. Components of a database system: the hardware on which it runs; the DBMS software itself; the data, including the catalogue; the procedures by which the system is used and administered; and the people — end users, application programmers and the database administrator.",
          },
          {
            n: 12,
            marks: 15,
            unit: "u1",
            prompt:
              "Describe the classification of database language. Which type of language is SQL?",
            rubric: [
              { label: "DDL with examples and what it acts on.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "DML with examples and what it acts on.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "DCL and TCL with examples.", marks: 3, tag: "incomplete-list", beat: 2 },
              { label: "SQL stated to be comprehensive, spanning all four families.", marks: 4, tag: "definition-only", beat: 2 },
              { label: "Classification justified by what each family acts on, and declarative nature noted.", marks: 2, tag: "mechanism-missing", beat: 2 },
            ],
            model:
              "Database languages are classified by what they act upon. DDL defines structure — CREATE, ALTER, DROP, TRUNCATE. DML manipulates rows — SELECT, INSERT, UPDATE, DELETE, resting on the relational algebra. DCL controls privileges — GRANT, REVOKE. TCL delimits transactions — COMMIT, ROLLBACK, SAVEPOINT. SQL is a comprehensive, non-procedural language: it contains DDL, DML and DCL, so it is a complete database language rather than a query language alone, and its DML is declarative — the statement describes the result and the optimiser chooses the plan.",
          },
          {
            n: 13,
            marks: 15,
            unit: "u1",
            prompt:
              "Write short notes on: (a) Data independence (b) Database schema (c) Functional dependency.",
            rubric: [
              { label: "(a) Definition, both types, and the mapping each relies on.", marks: 5, tag: "definition-only", beat: 2 },
              { label: "(b) Schema as structure, distinguished from instance, with an example.", marks: 4, tag: "definition-only", beat: 2 },
              { label: "(c) X → Y defined precisely, with Armstrong's axioms or closure.", marks: 4, tag: "definition-only", beat: 2 },
              { label: "Each note carries an example, since a short note without one is a definition only.", marks: 2, tag: "no-example", beat: 2 },
            ],
            model:
              "(a) Data independence is the ability to change the schema at one level without changing the level above. Logical independence lets the conceptual schema change — an attribute added, a relation decomposed — without altering external views, and rests on the external/conceptual mapping. Physical independence lets storage change — an index added, a file reorganised — without altering the conceptual schema, resting on the conceptual/internal mapping. (b) A database schema is the description of the database structure: relations, attributes, types, keys and constraints, such as students(roll, name, dept) with roll as primary key. It is distinct from the instance, the rows present at a given moment, which change while the schema stays fixed. (c) A functional dependency X → Y holds when any two tuples agreeing on X also agree on Y. From roll → dept and dept → dept_hod, transitivity gives roll → dept_hod. The closure X+ is every attribute determined by X, and X is a candidate key exactly when X+ is the whole relation and no proper subset of X has that property.",
          },
        ],
      },
    ],
  },
];
