/**
 * The figure renderer.
 *
 * Six documented primitives, and nothing else (FR-7). A concept that cannot be
 * expressed with one of these gets a static table or no figure at all — never a
 * bespoke diagram, and never hand-built animation for one topic.
 *
 *   compare  two columns, good and bad, for a decision
 *   flow     an ordered sequence, where order is the information
 *   table    relations, values and marked cells
 *   tree     hierarchy, keys and subtypes
 *   layers   levels, with what each level is responsible for
 *   code     literal syntax, because SQL and algebra need exact text
 */

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderFigure(figure) {
  if (!figure || !figure.type) return "";
  const caption = figure.caption
    ? `<p class="figure__caption">${esc(figure.caption)}</p>`
    : "";
  const body = renderers[figure.type] ? renderers[figure.type](figure) : "";
  if (!body) return "";
  return `<figure class="figure">${body}${caption}</figure>`;
}

const renderers = {
  compare(figure) {
    const col = (side, tone) =>
      side
        ? `<div class="fig-compare__col fig-compare__col--${tone}">
             <p class="fig-compare__title">${esc(side.title)}</p>
             <ul class="reveal">${(side.items || [])
               .map((item) => `<li>${esc(item)}</li>`)
               .join("")}</ul>
           </div>`
        : "";
    return `<div class="fig-compare">${col(figure.good, "good")}${col(figure.bad, "bad")}</div>`;
  },

  flow(figure) {
    const steps = (figure.steps || [])
      .map((step) => {
        const tone = step.tone ? ` fig-flow__step--${step.tone}` : "";
        return `<li class="fig-flow__step${tone}">${esc(step.label)}</li>`;
      })
      .join("");
    return `<ol class="fig-flow reveal">${steps}</ol>`;
  },

  table(figure) {
    const marks = figure.mark || [];
    const toneFor = (r, c) => {
      const hit = marks.find((m) => m.r === r && m.c === c);
      return hit ? ` data-tone="${esc(hit.tone)}"` : "";
    };
    const head = (figure.columns || [])
      .map((c) => `<th scope="col">${esc(c)}</th>`)
      .join("");
    const rows = (figure.rows || [])
      .map(
        (row, r) =>
          `<tr>${row
            .map((cell, c) => `<td${toneFor(r, c)}>${esc(cell)}</td>`)
            .join("")}</tr>`,
      )
      .join("");
    return `<table class="fig-table">
      <thead><tr>${head}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  },

  tree(figure) {
    return `<div class="fig-tree">${renderTreeNode(figure.root, true)}</div>`;
  },

  layers(figure) {
    const layers = (figure.layers || [])
      .map(
        (layer) =>
          `<div class="fig-layers__layer">
             <span class="fig-layers__name">${esc(layer.name)}</span>
             <span>${esc(layer.detail)}</span>
           </div>`,
      )
      .join("");
    return `<div class="fig-layers reveal">${layers}</div>`;
  },

  code(figure) {
    const lines = (figure.lines || []).map((line) => esc(line)).join("\n");
    return `<pre class="fig-code"><code>${lines}</code></pre>`;
  },
};

function renderTreeNode(node, isRoot = false) {
  if (!node) return "";
  const key = node.key ? " fig-tree__node--key" : "";
  const children = (node.children || []).length
    ? `<ul>${node.children.map((child) => renderTreeNode(child)).join("")}</ul>`
    : "";
  if (isRoot) {
    return `<ul><li class="fig-tree__node${key}">${esc(node.label)}${children}</li></ul>`;
  }
  return `<li class="fig-tree__node${key}">${esc(node.label)}${children}</li>`;
}
