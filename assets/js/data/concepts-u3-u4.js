/**
 * Beat scripts for Unit III (file organisation) and Unit IV (relational model
 * and SQL). Same five-part pattern, same fixed set of figure primitives.
 */

export const CONCEPTS_U3_U4 = [
  /* ======================================================================
     UNIT III — FILE ORGANISATION
     ====================================================================== */
  {
    id: "c3-1",
    unit: "u3",
    title: "The real cost is block reads",
    syllabusTag: "UNIT-III · file organisation",
    hook: "One lakh student records, one roll number to find, and the program reads every block on the disk to find it.",
    beats: [
      {
        kind: "problem",
        text: "Records live in blocks, not individually: the disk reads a whole block whether you wanted one record from it or all of them. A heap file, where new records are simply appended, has no order, so locating one record means reading every block — one hundred thousand records at ten per block is ten thousand block reads for one answer.",
      },
      {
        kind: "failure",
        text: "The obvious fix is faster hardware. It fails as a design argument: an SSD cuts the constant per read but the count is unchanged, and the count is what grows with the file. Ten thousand reads at any speed is still the wrong shape of solution.",
      },
      {
        kind: "mechanism",
        text: "Measure cost in block accesses, and reduce the count. The blocking factor is records per block: bfr = floor(B / R), where B is block size and R is record size. A heap file gives O(1) insert and O(n) search. A sorted file gives O(log n) search by binary search over blocks, but an insert into the middle costs a shift of every following record. Nothing gives both, which is why an index exists.",
        figure: {
          type: "table",
          caption: "One hundred thousand records of 200 bytes, blocks of 2000 bytes. bfr = 10.",
          columns: ["Organisation", "Search", "Insert", "Range query"],
          rows: [
            ["Heap (unordered)", "10,000 blocks", "1 block — append", "10,000 blocks"],
            ["Sorted on key", "~14 block reads", "Shift half the file", "Efficient, contiguous"],
            ["Indexed", "2-3 block reads", "1 block + index update", "Efficient via leaves"],
          ],
          mark: [{ r: 1, c: 3, tone: "miss" }],
        },
      },
      {
        kind: "cost",
        text: "Every structure that makes search cheap makes insertion more expensive, because it must be maintained. Sorting also wastes space reserved for growth, and a sorted file degrades as soon as inserts are frequent. The engineering question is never which organisation is best, but which mix of reads and writes you actually have.",
      },
    ],
    gate: {
      id: "g3-1",
      prompt:
        "100,000 records of 200 bytes each, block size 2000 bytes. How many blocks does the file occupy?",
      options: [
        {
          text: "10,000 — ten records fit in each block.",
          correct: true,
          why: "bfr = floor(2000/200) = 10 records per block, so 100,000/10 = 10,000 blocks.",
        },
        {
          text: "200 — one record per block.",
          correct: false,
          why: "That would need 200-byte blocks. Records are packed.",
        },
        {
          text: "500 — two hundred records per block.",
          correct: false,
          why: "200 records would need 40,000 bytes per block.",
        },
        {
          text: "1,000 — one hundred records per block.",
          correct: false,
          why: "100 records need 20,000 bytes, ten times the block size.",
        },
      ],
    },
    items: [
      {
        id: "i3-1-1",
        kind: "exit",
        marks: 5,
        prompt:
          "A file holds 60,000 records of 100 bytes; the block size is 1000 bytes. Compute the blocking factor and the number of blocks, then compare the block reads needed to find one record by key in a heap file and in a file sorted on that key.",
        rubric: [
          {
            label: "bfr = floor(1000/100) = 10 records per block.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Blocks = 60,000/10 = 6,000.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Heap: 6,000 block reads in the worst case, since there is no order to exploit.",
            marks: 1.5,
            tag: "cost-not-stated",
            beat: 2,
          },
          {
            label: "Sorted: binary search over 6,000 blocks, about 13 block reads.",
            marks: 1.5,
            tag: "cost-not-stated",
            beat: 2,
          },
        ],
        model:
          "bfr = floor(1000/100) = 10, so the file occupies 6,000 blocks. In a heap file the record may be anywhere, so the worst case is 6,000 block reads. In a file sorted on the key, binary search halves the range each time: log2 6000 is about 12.6, so about 13 block reads.",
      },
      {
        id: "i3-1-2",
        kind: "practice",
        marks: 3,
        prompt:
          "Why is an insert into a sorted file expensive, and what does that cost buy you?",
        rubric: [
          {
            label: "The insertion point must be found and every following record shifted, so a block or many blocks are rewritten.",
            marks: 2,
            tag: "cost-not-stated",
            beat: 2,
          },
          {
            label: "It buys ordered scanning and logarithmic search on the sort key.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "The record must go in key order, so its position is located and the records after it are shifted — in the worst case rewriting most of the file, and reserving free space to make it cheaper. That cost buys ordered retrieval and binary search on the sort key, which is why sorted organisation suits read-mostly files.",
      },
      {
        id: "i3-1-3",
        kind: "practice",
        marks: 2,
        prompt: "State why block access count, not record count, is the measure of file cost.",
        rubric: [
          {
            label: "The disk transfers a whole block per access, so records in the same block cost nothing extra.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Block count is what grows with the file, so it is the quantity a design can change.",
            marks: 0.5,
            tag: "cost-not-stated",
            beat: 2,
          },
        ],
        model:
          "A read transfers an entire block, so fetching one record and fetching the ten records in its block cost the same. Cost therefore tracks blocks touched, not records returned, and reducing blocks touched — by ordering or by an index — is the only lever available.",
      },
    ],
  },

  {
    id: "c3-2",
    unit: "u3",
    title: "ISAM, and the overflow that eats it",
    syllabusTag: "UNIT-III · indexed sequential access files",
    hook: "The file is beautifully ordered for the first year. In the second year every new record lands in an overflow chain and searches start crawling.",
    beats: [
      {
        kind: "problem",
        text: "You want binary-search speed for range queries and cheap inserts, at the same time. A pure sorted file gives the first and refuses the second; a heap gives the second and refuses the first.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to leave gaps in each block so inserts have room. It works until the gaps are gone, which for a real file is a matter of months, and then the structure has no answer for the next insert.",
      },
      {
        kind: "mechanism",
        text: "Indexed sequential access method: an index area holding key-and-block-pointer entries, a prime data area of ordered blocks, and an overflow area. The index is sparse — one entry per block, not per record — so it is small enough to stay in memory. A search reads the index, jumps to the home block, and finds the record; a range query walks forward through the ordered blocks. When a home block is full, the new record goes to the overflow area and is chained to its home block.",
        figure: {
          type: "flow",
          caption: "The path of one search in an ISAM file.",
          steps: [
            { label: "Index area: binary search for the largest key ≤ target" },
            { label: "Follow the pointer to the home block in the prime area" },
            { label: "Search the block; if not found, follow the overflow chain" },
            { label: "Range query: continue forward through ordered blocks" },
            { label: "Insert into free space, else append to overflow", tone: "gate" },
          ],
        },
      },
      {
        kind: "cost",
        text: "The index is static: the structure is built once and does not rebalance. As overflow chains lengthen, search degenerates from one block to a chain of blocks, and inserts cluster in the same few overflow blocks. Performance decays silently until the file is reorganised — and reorganisation needs downtime. That decay is precisely what a B+ tree removes.",
      },
    ],
    gate: {
      id: "g3-2",
      prompt: "In ISAM, where does a new record go when its home block is full?",
      options: [
        {
          text: "The whole file is re-sorted immediately.",
          correct: false,
          why: "Re-sorting on every insert would make the file unusable for writes.",
        },
        {
          text: "Into an overflow area, chained to its home block.",
          correct: true,
          why: "That is the defining compromise of ISAM: cheap insert now, longer chain later.",
        },
        {
          text: "The insert is rejected until reorganisation.",
          correct: false,
          why: "The file would refuse data, which no production system does.",
        },
        {
          text: "The block splits and the index grows by one level.",
          correct: false,
          why: "Splitting is a B+ tree behaviour. ISAM has no split.",
        },
      ],
    },
    items: [
      {
        id: "i3-2-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain an indexed sequential access file: its three areas, how a search proceeds, and why its performance degrades.",
        rubric: [
          {
            label: "Names the index area, prime data area and overflow area with their roles.",
            marks: 2,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Describes the search: sparse index, jump to home block, then overflow chain if needed.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Explains the degradation: a static index does not rebalance, so overflow chains grow and search cost rises.",
            marks: 1.5,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "An ISAM file has an index area of key and block-pointer pairs, a prime data area of blocks ordered on the key, and an overflow area. The index is sparse, one entry per block, so it is small enough to search in memory; a lookup binary-searches the index, reads the home block, and follows the overflow chain if the record is not there. Because the index is built once and never rebalances, every insert that misses free space lengthens a chain, so the number of block reads rises steadily until the file is reorganised.",
      },
      {
        id: "i3-2-2",
        kind: "practice",
        marks: 3,
        prompt: "Why is the ISAM index sparse rather than dense, and what does that save?",
        rubric: [
          {
            label: "One entry per block rather than per record, because records in a block are contiguous and ordered.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "The index stays small enough to hold in memory, so search costs no extra disk reads.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 2,
          },
        ],
        model:
          "A sparse index stores the first key of each block, so it has one entry per block instead of one per record — a thousandth of the entries at ten records per block. That keeps the index small enough to keep resident, so finding the home block costs no disk access at all.",
      },
      {
        id: "i3-2-3",
        kind: "practice",
        marks: 2,
        prompt: "State one operation ISAM handles well and one it handles badly.",
        rubric: [
          {
            label: "Well: ordered or range retrieval, because the prime area is sorted and blocks are chained in order.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Badly: sustained insertion into a growing file, because overflow chains lengthen without limit.",
            marks: 1,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "ISAM is strong on range and ordered retrieval, since it can read forward through ordered blocks. It is weak on sustained insertion, because a static structure has no way to redistribute space, so chains grow and search cost climbs.",
      },
    ],
  },

  {
    id: "c3-3",
    unit: "u3",
    title: "Why a B+ tree indexes a million rows in three reads",
    syllabusTag: "UNIT-III · implementation using B and B++ trees",
    hook: "A binary search tree holding a lakh of keys is seventeen levels deep. On disk, seventeen levels is seventeen separate reads.",
    beats: [
      {
        kind: "problem",
        text: "The tree that is elegant in memory is the wrong shape on disk. Each node is one block, so height is the number of block reads, and a binary tree of a million keys has a height near twenty. Twenty reads per lookup, and a rebalancing rotation that touches several blocks at once.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to make the tree shorter by storing more keys per node. That is right — but a plain multiway search tree has no rule for splitting and merging, so it can become unbalanced again, and its height becomes data-dependent rather than bounded.",
      },
      {
        kind: "mechanism",
        text: "A B tree of order p allows at most p child pointers and p−1 keys per node, and stores data pointers in every node. A B+ tree stores keys only in internal nodes and all data pointers in the leaves, with the leaves chained left to right. Every leaf is at the same depth, so the height is bounded by log of the record count. Overflow splits a node into two and pushes the middle key up; underflow merges or redistributes. With p = 100, a root of 100 pointers over 100 internal nodes reaches 10,000 leaves of 99 records each — nearly a million records in three block reads.",
        figure: {
          type: "compare",
          caption: "Both are balanced. Only one of them makes range queries cheap.",
          good: {
            title: "B+ tree",
            items: [
              "Keys only in internal nodes",
              "All data pointers in leaves",
              "Leaves linked — range scan reads forward",
              "Every leaf at the same depth",
              "Higher fanout, so shorter tree",
            ],
          },
          bad: {
            title: "B tree",
            items: [
              "Data pointers in internal nodes too",
              "Range scan must traverse up and down the tree",
              "Lower fanout for the same block size",
              "Correct and balanced, but worse for scans",
            ],
          },
        },
      },
      {
        kind: "cost",
        text: "Every insert may split a node, so one logical write becomes two or three physical writes — write amplification. Average occupancy after random inserts is around 70 per cent, so the file is a third larger than the data. Concurrent access needs latch coupling down the tree, and a badly chosen order means either shallow but wide nodes that do not fit a block, or narrow nodes that deepen the tree.",
      },
    ],
    gate: {
      id: "g3-3",
      prompt: "In a B+ tree of order p, what is stored in an internal node?",
      options: [
        {
          text: "Records, as in a B tree.",
          correct: false,
          why: "That is the B tree. The B+ tree separates them.",
        },
        {
          text: "Keys and child pointers only.",
          correct: true,
          why: "Internal nodes hold only keys and pointers, which is why fanout is higher and the tree shorter.",
        },
        {
          text: "Overflow chain pointers.",
          correct: false,
          why: "Overflow chains belong to ISAM and to hash buckets, not to a B+ tree.",
        },
        {
          text: "Hash values of the keys.",
          correct: false,
          why: "A B+ tree is ordered; hashing is the alternative that gives up ordering.",
        },
      ],
    },
    items: [
      {
        id: "i3-3-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Compare a B tree and a B+ tree, and state why a B+ tree is preferred for a database index.",
        rubric: [
          {
            label: "B tree: data pointers in every node, internal and leaf; B+ tree: keys only internally, all data pointers in leaves.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "B+ tree leaves are linked, so a range scan reads forward without climbing the tree.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "B+ tree has higher fanout for the same block size, so it is shorter, and every search costs the same depth.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "A B tree stores keys with their data pointers in every node, so a search may end at an internal node. A B+ tree stores only keys and child pointers internally and puts every data pointer in a leaf, with leaves linked in key order. That gives three advantages: internal nodes hold more keys for the same block, so the tree is shallower; every search reaches a leaf, so cost is uniform; and a range query walks the leaf chain instead of traversing up and down the tree.",
      },
      {
        id: "i3-3-2",
        kind: "practice",
        marks: 4,
        prompt:
          "A B+ tree has order p = 50. State the maximum number of keys in an internal node and in a leaf, and estimate how many records a tree of height 3 can index.",
        rubric: [
          {
            label: "Internal node: at most 50 child pointers and 49 keys.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Leaf: at most 49 keys with 49 data pointers (plus the next-leaf pointer).",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Height 3: root 50 pointers, then 50 internal nodes of 50, so about 2,500 leaves × 49 ≈ 1.2 lakh records.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "With order 50 an internal node holds at most 50 child pointers and 49 search keys; a leaf holds at most 49 keys and their data pointers. A tree of height 3 has a root, one internal level and the leaves: 50 × 50 = 2,500 leaves, each holding up to 49 records, so roughly 1,22,500 records are indexed in three block reads.",
      },
      {
        id: "i3-3-3",
        kind: "practice",
        marks: 3,
        prompt:
          "What happens in a B+ tree when a leaf overflows, and what does the operation cost?",
        rubric: [
          {
            label: "The leaf splits into two, and the middle key is copied up to the parent.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "The parent may itself overflow, so the split can propagate to the root, which is how the tree grows in height.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Cost: several blocks rewritten for one logical insert — write amplification.",
            marks: 0.5,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "The full leaf is split into two roughly half-full leaves and its middle key is copied into the parent, which keeps every leaf at the same depth. If the parent is then full it splits in turn, and the split can reach the root, at which point a new root is created and the tree grows by one level. The cost is that a single insert rewrites two or more blocks, and that after random inserts leaves average about seventy per cent full.",
      },
    ],
  },

  {
    id: "c3-4",
    unit: "u3",
    title: "One read instead of thirteen",
    syllabusTag: "UNIT-III · hashing and hashing functions",
    hook: "Finding a roll number in a sorted file takes thirteen block reads. A hash function can make it one — for exactly one kind of question.",
    beats: [
      {
        kind: "problem",
        text: "Binary search over a sorted file is logarithmic, which is good, but a lookup by exact key should not depend on file size at all. What is needed is a function that turns the key into an address directly, so the record can be read without searching.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to use the key itself as the address. It fails on the first real dataset: roll numbers are sparse and clustered, so most of the address space is empty while a few blocks hold everything.",
      },
      {
        kind: "mechanism",
        text: "A hash function maps a key to a bucket address: h(K) gives the block. Buckets hold one or more blocks, and a good function distributes keys uniformly, is fast to compute, and uses the whole key rather than a prefix. A search computes the address and reads one bucket; if the bucket holds several records, they are searched within the block. With 1,000 records in 100 buckets, the average bucket holds ten records — one block read if a bucket is one block.",
        figure: {
          type: "table",
          caption: "Hashing wins on equality and loses on everything ordered.",
          columns: ["Query", "Hash", "Sorted file"],
          rows: [
            ["Roll = 23/441", "1 bucket read", "~13 block reads"],
            ["Roll > 23/400", "Full scan — order is destroyed", "Read forward from the position"],
            ["MIN / MAX", "Full scan", "First or last block"],
            ["Insert", "1 bucket write", "Shift and rewrite"],
          ],
          mark: [{ r: 1, c: 1, tone: "miss" }],
        },
      },
      {
        kind: "cost",
        text: "Hashing destroys order. Any query that is not equality — a range, a prefix, a sort, a MIN — must scan everything. And with a fixed number of buckets, growth is the problem: either the buckets overflow into chains, or the whole file must be rehashed, which means an outage.",
      },
    ],
    gate: {
      id: "g3-4",
      prompt:
        "1,000 records hashed into 100 buckets with a uniform function. Average records per bucket?",
      options: [
        {
          text: "1",
          correct: false,
          why: "That would need 1,000 buckets.",
        },
        {
          text: "10",
          correct: true,
          why: "1,000 / 100 = 10. If a bucket is one block, an average lookup is one block read.",
        },
        {
          text: "100",
          correct: false,
          why: "That is the bucket count, not the load per bucket.",
        },
        {
          text: "1,000",
          correct: false,
          why: "That is every record in one bucket — the pathological hash.",
        },
      ],
    },
    items: [
      {
        id: "i3-4-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain hashing in brief: the hash function, buckets, and why it makes some queries fast and others impossible.",
        rubric: [
          {
            label: "A hash function h(K) computes a bucket address directly from the key.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "A bucket is one or more blocks; equality search reads one bucket, so cost is independent of file size.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Order is destroyed, so range, prefix, sort and MIN/MAX queries require a full scan.",
            marks: 2,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "Hashing applies a function h to the key to obtain a bucket address, where a bucket is one or more blocks. An equality search computes the address and reads that bucket, so its cost does not grow with the file. Because the function scatters neighbouring keys across the address space, the file has no order, so any range or ordered query — greater than, between, MIN, sort — must examine every bucket.",
      },
      {
        id: "i3-4-2",
        kind: "practice",
        marks: 3,
        prompt: "State three properties of a good hash function and why each matters.",
        rubric: [
          {
            label: "Uniform distribution — uneven hashing puts everything in a few buckets and turns search into a scan.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Fast to compute — it runs on every single access, so cost multiplies.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Uses the whole key, not a prefix — keys that share a prefix would collide systematically.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "It must distribute keys uniformly, or a few buckets overflow while most stay empty and lookup becomes a scan. It must be cheap to compute, since it is evaluated on every access. And it must depend on the whole key: using only a prefix means keys like 23/441 and 23/442 that share it collide systematically, which is the worst case by construction rather than by chance.",
      },
      {
        id: "i3-4-3",
        kind: "practice",
        marks: 2,
        prompt:
          "Why is static hashing unsuitable for a file that grows steadily?",
        rubric: [
          {
            label: "The bucket count is fixed, so added records lengthen overflow chains and lookups degrade toward a scan.",
            marks: 1.5,
            tag: "cost-not-stated",
            beat: 3,
          },
          {
            label: "The alternative — rehashing the whole file — requires the file to be unavailable.",
            marks: 0.5,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "With a fixed number of buckets, growth is absorbed by overflow chains, so the one-block lookup becomes a chain of blocks. Fixing it means choosing a new bucket count and redistributing every record, which cannot be done without taking the file out of service. Extendible and dynamic hashing exist to avoid exactly that.",
      },
    ],
  },

  {
    id: "c3-5",
    unit: "u3",
    title: "Growing a hash file without stopping the world",
    syllabusTag: "UNIT-III · collision resolution, extendible and dynamic hashing",
    hook: "The file doubles over a year. Every bucket now overflows, and the only documented fix is to rehash everything overnight.",
    beats: [
      {
        kind: "problem",
        text: "Two keys can hash to the same bucket; that is a collision, and it is normal. With static hashing, as records are added the collisions accumulate, and a bucket becomes a chain of overflow blocks. Performance decays until the file is rehashed, and rehashing a large file means downtime.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to choose a bucket count large enough for the next five years. It fails on two counts: the empty buckets waste space immediately, and the estimate of five years of growth is a guess that will be wrong in one direction or the other.",
      },
      {
        kind: "mechanism",
        text: "Resolve collisions locally, and grow the structure incrementally. Collision resolution is either open addressing — probe the next slot, linear or by double hashing — or chaining, where overflow blocks hang off the bucket. Extendible hashing adds a directory indexed by the first d bits of the hash, and a local depth per bucket: when a bucket overflows, only that bucket splits, and the directory doubles only if the splitting bucket's local depth equals the global depth. Dynamic and linear hashing skip the directory and split one bucket at a time in a fixed order, keeping a pointer to the next bucket to split.",
        figure: {
          type: "flow",
          caption: "Extendible hashing: the split is local, the doubling is deferred.",
          steps: [
            { label: "Hash the key, take the first d bits" },
            { label: "Follow the directory entry to a bucket" },
            { label: "Bucket full? Split only that bucket", tone: "gate" },
            { label: "If its local depth equals the global depth, double the directory" },
            { label: "Rehash the one bucket's records across the two halves" },
          ],
        },
      },
      {
        kind: "cost",
        text: "The directory is an extra structure that must itself be kept and read, and doubling it doubles its size. Linear hashing avoids the directory but tolerates some overflow chains during the growth period, so lookups are occasionally longer. Neither recovers ordering: range queries still scan.",
      },
    ],
    gate: {
      id: "g3-5",
      prompt: "In extendible hashing, what doubles when a bucket overflows?",
      options: [
        {
          text: "The data file.",
          correct: false,
          why: "The data file grows by one bucket. Doubling it would be the full rehash you are trying to avoid.",
        },
        {
          text: "The directory — and only when the bucket's local depth has reached the global depth.",
          correct: true,
          why: "That condition is the whole point: the directory doubles only when there is no spare bit to distinguish the two new buckets.",
        },
        {
          text: "The overflowing bucket only.",
          correct: false,
          why: "The bucket does split, but the question is what doubles.",
        },
        {
          text: "Nothing; extendible hashing never grows.",
          correct: false,
          why: "It grows incrementally, which is exactly what makes it useful.",
        },
      ],
    },
    items: [
      {
        id: "i3-5-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain collision resolution in hashing, and describe how extendible hashing avoids a full rehash.",
        rubric: [
          {
            label: "Defines a collision as two keys hashing to one bucket address.",
            marks: 1,
            tag: "definition-only",
            beat: 0,
          },
          {
            label: "Names at least two resolution methods — chaining with overflow blocks, linear probing, double hashing — and how each behaves.",
            marks: 2,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Extendible: directory on the first d hash bits, local depth per bucket, split only the overflowing bucket, double the directory only when local depth = global depth.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "A collision occurs when two keys hash to the same bucket. It is resolved by chaining, where overflow blocks are linked to the bucket, or by open addressing, where successive slots are probed — linearly, or by a second hash to avoid clustering. Extendible hashing avoids a full rehash by keeping a directory addressed by the first d bits of the hash and a local depth per bucket: on overflow only that bucket splits, its records are redistributed over the two new buckets, and the directory doubles only when the bucket's local depth already equals the global depth.",
      },
      {
        id: "i3-5-2",
        kind: "practice",
        marks: 3,
        prompt:
          "Contrast linear probing with chaining, stating one advantage of each.",
        rubric: [
          {
            label: "Linear probing places the record in the next free slot in the same area; chaining puts it in an overflow block.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Probing needs no extra space but suffers primary clustering.",
            marks: 0.75,
            tag: "cost-not-stated",
            beat: 3,
          },
          {
            label: "Chaining handles high load gracefully but costs an extra block read per link.",
            marks: 0.75,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "Linear probing keeps everything in the primary area and, on collision, takes the next free slot, which needs no extra space but creates runs of occupied slots that lengthen as the file fills — primary clustering. Chaining instead links overflow blocks to the bucket, so the primary area stays at its intended load and heavy buckets degrade one link at a time, at the price of an extra block read per link followed.",
      },
      {
        id: "i3-5-3",
        kind: "practice",
        marks: 2,
        prompt: "What does dynamic (linear) hashing do instead of maintaining a directory?",
        rubric: [
          {
            label: "Splits one bucket at a time in a fixed round-robin order, tracked by a next-to-split pointer.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "Uses one or two hash functions as the address space grows, tolerating temporary overflow chains.",
            marks: 0.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "Linear hashing adds buckets one at a time in a fixed order rather than doubling a directory: a pointer records the next bucket to split, and when the load factor crosses a threshold that bucket is split and its records redistributed, using a second hash function once the address space has grown past the original range. Some overflow chains are tolerated during growth in exchange for no directory at all.",
      },
    ],
  },

  /* ======================================================================
     UNIT IV — RELATIONAL MODEL AND SQL
     ====================================================================== */
  {
    id: "c4-1",
    unit: "u4",
    title: "A relation is a set. SQL is not.",
    syllabusTag: "UNIT-IV · relational model concepts",
    hook: "The spreadsheet holds B.Sc in one row and BSc in the next. The count query returns two programmes where the college has one.",
    beats: [
      {
        kind: "problem",
        text: "A column holds values that look equal to a human and are different to a machine: trailing spaces, two spellings, a blank. The relation's promise is that each attribute takes an atomic value from a defined domain, and nothing enforced that promise, so the query layer returns a number that is wrong and looks reasonable.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to clean the data afterwards. It fails because the wrong count has already been used, and because the next writer will introduce the same variation again — the domain was never constrained, so the data has no reason to stay clean.",
      },
      {
        kind: "mechanism",
        text: "A relation is a set of tuples over a schema. Each attribute draws from a domain; values are atomic, so no cell holds a list. Degree is the number of attributes, cardinality the number of tuples, and because a relation is a set there are no duplicate tuples. Order of rows and columns carries no meaning. NULL marks a value that is unknown or inapplicable, and it propagates: any arithmetic with NULL yields NULL, and NULL = NULL is unknown, not true.",
        figure: {
          type: "table",
          caption: "The same data, read as a set and read as SQL sees it.",
          columns: ["Property", "Relational model", "SQL in practice"],
          rows: [
            ["Duplicates", "Impossible — a set", "Possible unless a key forbids it"],
            ["Row order", "No meaning", "No meaning, but ORDER BY offers one"],
            ["Atomic values", "Required", "Not enforced; a cell may hold anything"],
            ["NULL", "Not a value", "A marker with three-valued logic"],
          ],
          mark: [{ r: 0, c: 2, tone: "miss" }],
        },
      },
      {
        kind: "cost",
        text: "Atomic values and no duplicates are what make relational algebra and query optimisation possible; the price is that a multi-valued fact needs another table and a join. NULL breaks two-valued logic, so NOT IN with a NULL in the list returns nothing, and a count of a nullable column silently skips the nulls.",
      },
    ],
    gate: {
      id: "g4-1",
      prompt: "In the relational model, is the order of tuples in a relation significant?",
      options: [
        {
          text: "Yes — tuples are stored in insertion order.",
          correct: false,
          why: "Storage may have an order. The model attaches no meaning to it.",
        },
        {
          text: "No — a relation is a set of tuples, so order carries no meaning.",
          correct: true,
          why: "That is why any query needing an order must say so explicitly.",
        },
        {
          text: "Only for the primary key column.",
          correct: false,
          why: "A key constrains uniqueness, not order.",
        },
        {
          text: "Only in SQL, not in theory.",
          correct: false,
          why: "It is the reverse: SQL is the layer that can return an ordered result, and only when asked.",
        },
      ],
    },
    items: [
      {
        id: "i4-1-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain the concepts of the relational model: relation, tuple, attribute, domain, degree, cardinality, and the meaning of NULL.",
        rubric: [
          {
            label: "Relation as a set of tuples over a schema; tuple as a row; attribute as a named column.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Domain as the set of permitted atomic values; degree = number of attributes; cardinality = number of tuples.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "NULL as unknown or inapplicable, not a value, with propagation into comparisons.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "A relation is a set of tuples conforming to a schema; each tuple is a row and each attribute a named column whose values come from a domain, the set of permitted atomic values. Degree is the number of attributes and cardinality the number of tuples. Because it is a set, no two tuples are identical and no order is implied. NULL marks a value that is unknown or not applicable; it is not a value, so arithmetic on it yields NULL and comparing it yields unknown rather than true or false.",
      },
      {
        id: "i4-1-2",
        kind: "practice",
        marks: 3,
        prompt:
          "The relational model forbids duplicate tuples but SQL allows them. Explain the gap and name the fix.",
        rubric: [
          {
            label: "Theory defines a relation as a set; SQL tables are bags, so duplicates can exist unless prevented.",
            marks: 2,
            tag: "mechanism-missing",
            beat: 2,
          },
          {
            label: "The fix: declare a primary key, or use DISTINCT where duplicates are possible.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "In the model a relation is a set, so two identical tuples are the same tuple and cannot both exist. A SQL table is a multiset, and duplicates persist unless something forbids them. Declaring a primary key or a unique constraint removes the possibility by rule; DISTINCT removes the symptom in one query, leaving the table free to hold duplicates again.",
      },
      {
        id: "i4-1-3",
        kind: "practice",
        marks: 2,
        prompt: "Why does COUNT(phone) differ from COUNT(*) on a table with null phone numbers?",
        rubric: [
          {
            label: "COUNT(column) skips NULLs; COUNT(*) counts tuples.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 3,
          },
          {
            label: "Notes that this silently changes an average or a total if used carelessly.",
            marks: 0.5,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "COUNT(phone) counts only the rows where phone is not NULL, because NULL is not a value to be counted; COUNT(*) counts tuples regardless. The difference is easy to miss and quietly changes any per-student average computed from the same column.",
      },
    ],
  },

  {
    id: "c4-2",
    unit: "u4",
    title: "Four constraints that stop bad data entering",
    syllabusTag: "UNIT-IV · relational constraints",
    hook: "The marks column accepts minus five. The department code references a department that was deleted last year.",
    beats: [
      {
        kind: "problem",
        text: "A relation with no constraints accepts anything the application sends. When two applications write the same table, the checks in one of them are irrelevant: the other writes unvalidated rows and the table quietly becomes untrustworthy, which is worse than being empty.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to validate in the application, carefully. It fails because validation in a program binds only that program — a report script, a bulk loader, or a second application all bypass it, and the database has no idea what a valid row looks like.",
      },
      {
        kind: "mechanism",
        text: "Declare the rules where the data is. A domain constraint fixes the type, range and format of an attribute. A key constraint makes a candidate key unique. Entity integrity says a primary key may not be NULL, because the tuple must be identifiable. Referential integrity says a foreign key value must either match an existing candidate key in the referenced relation or be wholly NULL. General or semantic constraints — CHECK, assertions, triggers — carry the rules that do not fit the other four, such as marks between 0 and 100.",
        figure: {
          type: "table",
          caption: "Each constraint class blocks a different kind of bad row.",
          columns: ["Constraint", "Rule", "Rejects"],
          rows: [
            ["Domain", "Value comes from the attribute's domain", "marks = -5, or 'ninety'"],
            ["Key", "Candidate key values are unique", "A second student with roll 23/441"],
            ["Entity integrity", "Primary key is never NULL", "INSERT with no roll number"],
            ["Referential integrity", "Foreign key matches or is NULL", "dept_id = 99 with no such department"],
            ["Semantic (CHECK)", "Any declared predicate", "marks > 100, or end_date < start_date"],
          ],
        },
      },
      {
        kind: "cost",
        text: "Every constraint is evaluated on every write, so inserts into a heavily constrained table are slower, and bulk loads can be dramatically slower. Cascading rules can delete more than intended in one statement, which is why the delete policy is a decision, not a default. And a constraint that is wrong blocks legitimate data at the worst possible moment.",
      },
    ],
    gate: {
      id: "g4-2",
      prompt: "Inserting a row with a NULL primary key violates which constraint?",
      options: [
        {
          text: "Domain constraint.",
          correct: false,
          why: "A domain constraint governs the values an attribute may take, not whether a key may be absent.",
        },
        {
          text: "Entity integrity.",
          correct: true,
          why: "Entity integrity exists so that every tuple can be identified. A NULL key identifies nothing.",
        },
        {
          text: "Referential integrity.",
          correct: false,
          why: "That governs foreign keys pointing at other relations.",
        },
        {
          text: "None — NULL keys are allowed.",
          correct: false,
          why: "They are allowed in a UNIQUE index in some engines, but never in a primary key.",
        },
      ],
    },
    items: [
      {
        id: "i4-2-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain the relational constraints — domain, key, entity integrity and referential integrity — with one violation of each.",
        rubric: [
          {
            label: "Domain: atomic values from the declared domain; violation is a value outside it.",
            marks: 1.25,
            tag: "constraint-mix",
            beat: 2,
          },
          {
            label: "Key: candidate key uniqueness; violation is a duplicate.",
            marks: 1.25,
            tag: "constraint-mix",
            beat: 2,
          },
          {
            label: "Entity integrity: primary key not NULL; violation is an unidentifiable tuple.",
            marks: 1.25,
            tag: "constraint-mix",
            beat: 2,
          },
          {
            label: "Referential integrity: foreign key matches or is NULL; violation is a dangling reference.",
            marks: 1.25,
            tag: "constraint-mix",
            beat: 2,
          },
        ],
        model:
          "A domain constraint requires each value to belong to the attribute's domain, so marks = -5 or the string ninety is rejected. A key constraint requires candidate key values to be unique, so a second row with roll 23/441 is rejected. Entity integrity requires the primary key to be non-NULL, so a tuple that cannot be identified is rejected. Referential integrity requires a foreign key either to match a candidate key value in the referenced relation or to be wholly NULL, so dept_id = 99 with no such department is rejected. Anything else — marks above 100, an end date before a start date — is a general or semantic constraint, expressed as a CHECK, assertion or trigger.",
      },
      {
        id: "i4-2-2",
        kind: "practice",
        marks: 3,
        prompt:
          "Why is validation in the application insufficient, even when it is done well?",
        rubric: [
          {
            label: "It binds only the program that contains it; other writers bypass it.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 1,
          },
          {
            label: "Bulk loads, scripts and a second application are named as the writers that get around it.",
            marks: 1,
            tag: "incomplete-list",
            beat: 1,
          },
          {
            label: "A declared constraint applies to every writer automatically, including future ones.",
            marks: 0.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "Application validation exists inside one program, so a bulk loader, an ad-hoc script or a second application writes the same table with no checks at all. A constraint declared on the relation is enforced by the engine for every writer, present and future, which is the only place a rule can be guaranteed rather than hoped for.",
      },
      {
        id: "i4-2-3",
        kind: "practice",
        marks: 2,
        prompt: "Give one cost of declaring many constraints on a table.",
        rubric: [
          {
            label: "Write and bulk-load performance falls, because each constraint is evaluated per statement or per row.",
            marks: 1.5,
            tag: "cost-not-stated",
            beat: 3,
          },
          {
            label: "Cascade rules can propagate a delete further than intended.",
            marks: 0.5,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "Every constraint is checked on every write, so inserts and especially bulk loads slow down, and a cascade can delete a large dependent set from one statement. Constraints are usually still worth it — the alternative is data you cannot trust — but the cost is real and shows up on the write path.",
      },
    ],
  },

  {
    id: "c4-3",
    unit: "u4",
    title: "Six operators, and everything else is built from them",
    syllabusTag: "UNIT-IV · relational algebra",
    hook: "Which students scored above sixty in a course taught by Dr Rao? Written in English, three people will read it three ways.",
    beats: [
      {
        kind: "problem",
        text: "A question in words does not say which relation is scanned first, whether ties matter, or what happens to a student with no result. Without a notation that is unambiguous and closed — where the output of one operation can feed the next — the query cannot be optimised, because there is nothing precise to optimise.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to write the English more carefully. It fails because natural language has no defined semantics for NULL, for duplicates or for order, so two correct readings still produce two different answers.",
      },
      {
        kind: "mechanism",
        text: "Six primitive operators: selection σ takes rows satisfying a predicate; projection π takes columns and removes duplicates; union ∪, set difference − and cartesian product × combine two relations; rename ρ renames attributes or relations. Everything else is derived — intersection ∩, joins ⋈, division ÷, assignment. The algebra is closed: every operation returns a relation, so operations nest, and a query becomes a tree that can be rearranged without changing its result. That rearrangement is what a query optimiser does.",
        figure: {
          type: "table",
          caption: "The six primitives, and the derived operators that matter most.",
          columns: ["Operator", "Symbol", "Takes", "Gives"],
          rows: [
            ["Selection", "σ", "Rows matching a predicate", "Same schema, fewer tuples"],
            ["Projection", "π", "Named attributes", "Fewer attributes, duplicates removed"],
            ["Union", "∪", "Two union-compatible relations", "Tuples in either"],
            ["Difference", "−", "Two union-compatible relations", "Tuples in the first only"],
            ["Product", "×", "Two relations", "Every pairing — |R| × |S| tuples"],
            ["Rename", "ρ", "A relation or attribute", "Same content, new name"],
            ["Join", "⋈", "Derived from × and σ", "Matching pairs only"],
          ],
          mark: [{ r: 4, c: 3, tone: "miss" }],
        },
      },
      {
        kind: "cost",
        text: "The product is the trap: it produces |R| × |S| tuples, so a join written as a product followed by a selection is correct and can be enormous. Join order matters for the same reason. And projection removing duplicates costs a sort or a hash — which is why SQL keeps duplicates unless you ask.",
      },
    ],
    gate: {
      id: "g4-3",
      prompt: "Which operator removes columns?",
      options: [
        {
          text: "σ — selection.",
          correct: false,
          why: "Selection removes tuples that fail the predicate. The schema is unchanged.",
        },
        {
          text: "π — projection.",
          correct: true,
          why: "Projection keeps the named attributes and discards the rest, removing duplicate tuples in the result.",
        },
        {
          text: "Both remove columns.",
          correct: false,
          why: "Only one does. Confusing them is the commonest notation error in this unit.",
        },
        {
          text: "Neither — columns are fixed by the schema.",
          correct: false,
          why: "The schema of a result is whatever its operators produce.",
        },
      ],
    },
    items: [
      {
        id: "i4-3-1",
        kind: "exit",
        marks: 5,
        prompt:
          "What is relational algebra? Discuss its basic operations and explain why it is closed.",
        rubric: [
          {
            label: "Defines it as a procedural query language whose operands and results are relations.",
            marks: 1,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Describes σ, π, ∪, −, × and ρ correctly.",
            marks: 2.5,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Closure: every operation returns a relation, so operations nest and a query forms a tree.",
            marks: 1.5,
            tag: "mechanism-missing",
            beat: 2,
          },
        ],
        model:
          "Relational algebra is a procedural query language in which each operator takes one or two relations and returns a relation. The basic operations are selection σ, which keeps tuples satisfying a predicate; projection π, which keeps named attributes and removes duplicates; union ∪, difference − and cartesian product ×, which combine two union-compatible or arbitrary relations; and rename ρ. Because every operator returns a relation, the algebra is closed, so operators nest and any query is an expression tree — which is what allows the optimiser to reorder the tree without changing the answer.",
      },
      {
        id: "i4-3-2",
        kind: "practice",
        marks: 4,
        prompt:
          "Using STUDENT(roll, name, dept) and MARKS(roll, course, score), write a relational algebra expression for the names of students who scored more than 60 in course DB01.",
        rubric: [
          {
            label: "Selects the qualifying rows: σ(course='DB01' ∧ score>60)(MARKS).",
            marks: 2,
            tag: "notation-slip",
            beat: 2,
          },
          {
            label: "Joins to STUDENT on roll, then projects name.",
            marks: 1.5,
            tag: "notation-slip",
            beat: 2,
          },
          {
            label: "Correct nesting order and symbols throughout.",
            marks: 0.5,
            tag: "notation-slip",
            beat: 2,
          },
        ],
        model:
          "π(name)( STUDENT ⋈ ( σ(course='DB01' ∧ score>60)(MARKS) ) ). The selection reduces MARKS first, the natural join on roll attaches the student rows, and the projection keeps only names. Writing the join as a product plus selection is also correct, but produces the full product before discarding almost all of it.",
      },
      {
        id: "i4-3-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Explain the natural join and state why a product followed by selection is usually a worse way to write it.",
        rubric: [
          {
            label: "Natural join equates attributes with the same name and keeps one copy of each.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "The product materialises |R| × |S| tuples before filtering, so intermediate size explodes.",
            marks: 1.5,
            tag: "cost-not-stated",
            beat: 3,
          },
        ],
        model:
          "A natural join pairs tuples that agree on all commonly named attributes and drops the duplicated attribute from the result. Written as a product plus selection it computes the same thing, but the product is the full cross product — a million rows if each side has a thousand — so the intermediate result is far larger than either input or the answer.",
      },
    ],
  },

  {
    id: "c4-4",
    unit: "u4",
    title: "Union, and the duplicate nobody wanted",
    syllabusTag: "UNIT-IV · SQL queries — set operators",
    hook: "The list of students in the cricket team or the quiz team returns 41 names for 38 students. Three of them play both.",
    beats: [
      {
        kind: "problem",
        text: "Or is not the same as both. A single WHERE with OR cannot express membership in both teams, and it leaves duplicates in the answer if a student appears twice in the source. The question needs two separate queries and a set operation between them.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to add DISTINCT to the SELECT. It works for one query and hides the real issue: combining two result sets is a different operation from filtering one, and it has its own rules about duplicates, column order and compatibility.",
      },
      {
        kind: "mechanism",
        text: "Three set operators, each with defined duplicate behaviour. UNION returns tuples from either and removes duplicates. UNION ALL returns them and keeps duplicates — cheaper, because no sort or hash is needed. INTERSECT returns tuples in both. MINUS, or EXCEPT, returns tuples in the first but not the second. All three require union-compatible relations: the same degree, and compatible domains in corresponding positions. Column names come from the first query only, so the order of the select lists is what actually defines correspondence.",
        figure: {
          type: "compare",
          caption: "The duplicate decision is the operator's, not the user's afterthought.",
          good: {
            title: "UNION",
            items: [
              "38 names — each student once",
              "Needs a sort or hash to deduplicate",
              "Correct for or across two sets",
            ],
          },
          bad: {
            title: "UNION ALL",
            items: [
              "41 names — the three who play both appear twice",
              "No deduplication cost",
              "Correct when duplicates carry meaning, as in a transaction log",
            ],
          },
        },
      },
      {
        kind: "cost",
        text: "Deduplication costs a sort or a hash over the whole result, so UNION is materially slower than UNION ALL on large sets. INTERSECT and MINUS are not available in every dialect — MySQL historically had neither — so portable SQL often writes them as joins or NOT EXISTS, which is correct but less readable.",
      },
    ],
    gate: {
      id: "g4-4",
      prompt: "Which of UNION and UNION ALL removes duplicate rows?",
      options: [
        {
          text: "UNION removes duplicates; UNION ALL keeps them.",
          correct: true,
          why: "And that is exactly why UNION ALL is faster — no sort or hash is needed.",
        },
        {
          text: "UNION ALL removes duplicates; UNION keeps them.",
          correct: false,
          why: "The names say it: ALL means all rows are kept.",
        },
        {
          text: "Both remove duplicates.",
          correct: false,
          why: "Then UNION ALL would have no purpose and no speed advantage.",
        },
        {
          text: "Neither; you need DISTINCT.",
          correct: false,
          why: "DISTINCT applies within one SELECT, not across the combined result.",
        },
      ],
    },
    items: [
      {
        id: "i4-4-1",
        kind: "exit",
        marks: 5,
        prompt:
          "What are the UNION, MINUS and INTERSECT commands in DBMS? Give the condition they require and one example of each.",
        rubric: [
          {
            label: "UNION: tuples in either, duplicates removed.",
            marks: 1.25,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "INTERSECT: tuples present in both.",
            marks: 1.25,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "MINUS/EXCEPT: tuples in the first and not the second.",
            marks: 1.25,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Union-compatible: same number of columns, compatible domains, same order of meaning; names come from the first query.",
            marks: 1.25,
            tag: "incomplete-list",
            beat: 2,
          },
        ],
        model:
          "UNION returns rows appearing in either query with duplicates removed; INTERSECT returns only rows appearing in both; MINUS (EXCEPT in many dialects) returns rows from the first query that do not appear in the second. All require union compatibility — the same number of columns, with compatible data types in corresponding positions, and the correspondence is by position, not by name, so the select lists must be ordered to match. The result takes its column names from the first query. Example: SELECT roll FROM cricket UNION SELECT roll FROM quiz gives the 38 students in either team; INTERSECT gives the three in both; MINUS gives those in cricket alone.",
      },
      {
        id: "i4-4-2",
        kind: "practice",
        marks: 3,
        prompt:
          "Why is UNION ALL usually faster than UNION, and when is it the correct choice?",
        rubric: [
          {
            label: "UNION must eliminate duplicates, which requires sorting or hashing the combined result.",
            marks: 1.5,
            tag: "cost-not-stated",
            beat: 3,
          },
          {
            label: "UNION ALL concatenates, so no extra pass is needed.",
            marks: 1,
            tag: "mechanism-missing",
            beat: 3,
          },
          {
            label: "It is correct whenever duplicates are meaningful or known impossible — logs, or disjoint sets.",
            marks: 0.5,
            tag: "mechanism-missing",
            beat: 3,
          },
        ],
        model:
          "UNION must remove duplicates, and removal requires a sort or hash over the entire combined result, which dominates the cost on large inputs. UNION ALL simply concatenates the two results. It is the right choice when duplicates cannot occur because the sets are disjoint, or when they must be preserved, as in combining two years of transaction logs where two identical-looking entries are two genuine events.",
      },
      {
        id: "i4-4-3",
        kind: "practice",
        marks: 2,
        prompt: "State the union-compatibility requirement and give one way it is broken by accident.",
        rubric: [
          {
            label: "Same degree, compatible domains, in corresponding positions.",
            marks: 1,
            tag: "incomplete-list",
            beat: 2,
          },
          {
            label: "Broken by selecting columns in a different order in the two queries — correspondence is positional.",
            marks: 1,
            tag: "notation-slip",
            beat: 2,
          },
        ],
        model:
          "The two relations must have the same number of columns with compatible domains in corresponding positions. The common accident is ordering the select lists differently — SELECT roll, name in one and SELECT name, roll in the other — which is accepted if both columns are the same type and silently compares the wrong attributes, because correspondence is by position and the names come only from the first query.",
      },
    ],
  },

  {
    id: "c4-5",
    unit: "u4",
    title: "WHERE runs before the average exists",
    syllabusTag: "UNIT-IV · SQL queries and programming using SQL",
    hook: "Average marks per course, only courses with more than five students, highest first. Written with the condition in WHERE, it errors.",
    beats: [
      {
        kind: "problem",
        text: "The condition concerns a group, but WHERE is evaluated on rows before any group exists. The average is not available at that point, so the statement fails — and the same confusion produces results that are wrong rather than rejected when a WHERE is used where a HAVING was meant.",
      },
      {
        kind: "failure",
        text: "The obvious fix is to wrap the query in another SELECT and filter outside. It works, and it is more machinery than needed; the mistake is conceptual, not structural, and adding a subquery without knowing why the clause failed leads to the next mistake.",
      },
      {
        kind: "mechanism",
        text: "SQL is written in one order and evaluated in another: FROM, then WHERE, then GROUP BY, then HAVING, then SELECT, then ORDER BY, then LIMIT. WHERE filters rows before grouping; HAVING filters groups after aggregation. Joins combine relations — INNER keeps matches, LEFT keeps all of the left side with NULLs where there is no match. Subqueries may be scalar, row, table or correlated; EXISTS tests for a row rather than a value. Views, constraints, cursors and embedded SQL are how the same statements are used from a program.",
        figure: {
          type: "flow",
          caption: "Logical order of evaluation — not the order the clauses are typed.",
          steps: [
            { label: "FROM — build the working set, apply joins" },
            { label: "WHERE — filter rows, before any group exists" },
            { label: "GROUP BY — form groups" },
            { label: "HAVING — filter groups, after aggregation", tone: "gate" },
            { label: "SELECT — compute the projection and aggregates" },
            { label: "ORDER BY — sort; LIMIT — cut" },
          ],
        },
      },
      {
        kind: "cost",
        text: "Logical order is not execution order: the optimiser may push predicates, reorder joins or use an index instead of a scan, so two equivalent statements can differ by orders of magnitude. A correlated subquery is evaluated once per outer row, which is invisible in the text and ruinous on a large table.",
      },
    ],
    gate: {
      id: "g4-5",
      prompt: "Which clause filters groups after aggregation?",
      options: [
        {
          text: "WHERE — it filters before grouping.",
          correct: false,
          why: "That is the mistake. WHERE cannot see an aggregate.",
        },
        {
          text: "HAVING — it is applied to groups after GROUP BY.",
          correct: true,
          why: "HAVING is the only clause evaluated on aggregated groups.",
        },
        {
          text: "ORDER BY — it sorts the output.",
          correct: false,
          why: "Sorting is not filtering, and it happens last.",
        },
        {
          text: "GROUP BY — it forms the groups.",
          correct: false,
          why: "Forming groups is not filtering them.",
        },
      ],
    },
    items: [
      {
        id: "i4-5-1",
        kind: "exit",
        marks: 5,
        prompt:
          "Explain SQL with its various characteristics, and state the logical order in which its clauses are evaluated.",
        rubric: [
          {
            label: "SQL described as declarative, non-procedural, comprehensive (DDL, DML, DCL) and standards-based.",
            marks: 2,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "Gives the evaluation order FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.",
            marks: 2,
            tag: "order-of-evaluation",
            beat: 2,
          },
          {
            label: "Notes that logical order differs from the order written, and from execution order chosen by the optimiser.",
            marks: 1,
            tag: "order-of-evaluation",
            beat: 3,
          },
        ],
        model:
          "SQL is a declarative, non-procedural language: the statement describes the result and the optimiser decides the access path. It is comprehensive, containing DDL for structure, DML for rows and DCL for privileges, and it is standardised, so a statement is broadly portable. Clauses are evaluated logically in the order FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT — which is why a WHERE clause cannot reference an aggregate, since no group exists when it runs. The optimiser may then choose a different physical order, which is why two equivalent statements can differ greatly in speed.",
      },
      {
        id: "i4-5-2",
        kind: "practice",
        marks: 4,
        prompt:
          "Write a query returning each course and its average score, only for courses with more than five students, highest average first.",
        rubric: [
          {
            label: "Groups by course and computes AVG(score).",
            marks: 1.5,
            tag: "notation-slip",
            beat: 2,
          },
          {
            label: "Uses HAVING COUNT(*) > 5, not WHERE.",
            marks: 1.5,
            tag: "order-of-evaluation",
            beat: 2,
          },
          {
            label: "Orders by the aggregate descending, with correct syntax throughout.",
            marks: 1,
            tag: "notation-slip",
            beat: 2,
          },
        ],
        model:
          "SELECT course, AVG(score) AS avg_score FROM marks GROUP BY course HAVING COUNT(*) > 5 ORDER BY avg_score DESC;  The count condition is a property of the group, so it belongs in HAVING; a WHERE clause would be evaluated before grouping, where COUNT(*) does not exist.",
      },
      {
        id: "i4-5-3",
        kind: "practice",
        marks: 3,
        prompt:
          "Explain the difference between INNER JOIN and LEFT JOIN, with the effect on a student who has no marks.",
        rubric: [
          {
            label: "INNER returns only matching pairs, so the student disappears from the result.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
          {
            label: "LEFT keeps every row of the left relation, with NULLs where there is no match.",
            marks: 1.5,
            tag: "definition-only",
            beat: 2,
          },
        ],
        model:
          "An INNER JOIN returns only pairs that satisfy the join condition, so a student with no marks row is absent from the result entirely — which silently shrinks a count. A LEFT JOIN keeps every row of the left relation and fills the right side with NULLs where nothing matched, so the student appears with an empty score, which is usually the answer a report actually wants.",
      },
    ],
  },
];
