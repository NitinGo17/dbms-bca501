/**
 * The office.
 *
 * Simulated colleagues. There is no server in this build, so nobody here is a
 * real player — they work the same tickets on a schedule fixed by the calendar,
 * and every device sees the same roster. The point is not to fake a
 * multiplayer product; it is that a new hire at an exam cell is never the only
 * person in the room, and working alone against a queue is a different feeling
 * from working beside two people who are ahead of you.
 *
 * Everything below is deterministic from the date, so it does not need a
 * network, cannot drift between devices, and never claims to be live.
 */

export const ROSTER = [
  {
    name: "Tara D.",
    role: "Senior DBA",
    startedDaysAgo: 900,
    pace: 0.62, // fraction of the queue she has cleared, before the date offset
    note: "Has been here since the old system. Fixes things without saying much.",
  },
  {
    name: "Priya N.",
    role: "DBA",
    startedDaysAgo: 260,
    pace: 0.41,
    note: "Joined last session. Reads the whole ticket before touching anything.",
  },
  {
    name: "Alok M.",
    role: "Junior DBA",
    startedDaysAgo: 40,
    pace: 0.18,
    note: "Started three weeks after you. Asks better questions than most.",
  },
];

/** Ticket titles, in queue order, used to build the wire. */
const WIRE_SUBJECTS = [
  "One correction, three files",
  "What a DBMS adds that a file cannot",
  "Three levels, two mappings",
  "Data independence, both kinds",
  "Four families of language, one administrator",
  "When one column must hold two numbers",
  "Four kinds of key, and which one you dare to use",
  "A relationship without cardinality is not a design",
  "Room 101 exists twice",
  "One table of people, three kinds of person",
  "The real cost is block reads",
  "ISAM, and the overflow that eats it",
  "Why a B+ tree indexes a million rows in three reads",
  "One read instead of thirteen",
  "Growing a hash file without stopping the world",
  "A relation is a set. SQL is not.",
  "Four constraints that stop bad data entering",
  "Six operators, and everything else is built from them",
  "Union, and the duplicate nobody wanted",
  "WHERE runs before the average exists",
  "The HOD is written on every student's row",
  "Three normal forms, three specific anomalies",
  "A decomposition that invents rows",
  "The money that left one account and arrived nowhere",
  "Two clerks, one balance",
  "The disk dies at five to twelve",
];

/** Small deterministic hash so the wire is stable within a day. */
function daySeed(date) {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * The roster as it stands today: how far each colleague has got, and what they
 * last did. Their progress advances with the calendar, not with your play.
 */
export function officeToday(date = new Date()) {
  const seed = daySeed(date);
  const epoch = Date.UTC(2026, 0, 1);
  const days = Math.max(0, Math.floor((date.getTime() - epoch) / 86400000));

  const colleagues = ROSTER.map((person, index) => {
    const drift = ((seed >> (index * 3)) % 9) / 100;
    const cleared = Math.max(
      0,
      Math.min(WIRE_SUBJECTS.length, Math.round(WIRE_SUBJECTS.length * (person.pace + drift))),
    );
    return {
      ...person,
      cleared,
      of: WIRE_SUBJECTS.length,
      shift: Math.max(1, Math.min(WIRE_SUBJECTS.length, cleared + 1)),
      lastSubject: WIRE_SUBJECTS[Math.max(0, cleared - 1)],
    };
  });

  const wire = [];
  colleagues.forEach((person, index) => {
    const gapMinutes = 40 + ((seed >> (index * 5)) % 200);
    wire.push({
      who: person.name,
      at: `${Math.floor(gapMinutes / 60)}h ago`,
      text: `cleared “${person.lastSubject}”`,
      kind: "cleared",
    });
    if (index === 0 && days % 3 === 0) {
      wire.push({
        who: person.name,
        at: "1d ago",
        text: `left a note on “${WIRE_SUBJECTS[(seed + 7) % WIRE_SUBJECTS.length]}” — the fix holds, the wording does not`,
        kind: "note",
      });
    }
  });

  return { colleagues, wire, days, seed };
}

/**
 * What a colleague says if you ask. Deliberately not advice about the answer —
 * they are a colleague, not a hint system, and the whole design rests on you
 * producing the answer yourself.
 */
export function colleagueRemark(person) {
  const remarks = [
    "Read the ticket twice. The fault is never the first thing it says.",
    "If you cannot say what it costs, you do not understand the fix yet.",
    "The manager does not want the definition. He wants to know what you would do.",
    "Everyone gets caught on the second one. Do not skip it.",
    "I would not run that on a result day. But it is your ticket.",
  ];
  const index = (person.name.length + person.shift) % remarks.length;
  return remarks[index];
}
