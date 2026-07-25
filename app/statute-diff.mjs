/**
 * @typedef {"unchanged" | "removed" | "changed" | "added"} StatuteDiffKind
 * @typedef {{ kind: StatuteDiffKind, text: string }} StatuteDiffSegment
 * @typedef {{ source: string, segments: StatuteDiffSegment[] }} StatuteDiffLine
 */

function sequenceDiff(currentItems, proposedItems) {
  const rows = currentItems.length + 1;
  const columns = proposedItems.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));

  for (let currentIndex = currentItems.length - 1; currentIndex >= 0; currentIndex -= 1) {
    for (let proposedIndex = proposedItems.length - 1; proposedIndex >= 0; proposedIndex -= 1) {
      matrix[currentIndex][proposedIndex] =
        currentItems[currentIndex] === proposedItems[proposedIndex]
          ? matrix[currentIndex + 1][proposedIndex + 1] + 1
          : Math.max(matrix[currentIndex + 1][proposedIndex], matrix[currentIndex][proposedIndex + 1]);
    }
  }

  const operations = [];
  let currentIndex = 0;
  let proposedIndex = 0;

  while (currentIndex < currentItems.length || proposedIndex < proposedItems.length) {
    if (
      currentIndex < currentItems.length &&
      proposedIndex < proposedItems.length &&
      currentItems[currentIndex] === proposedItems[proposedIndex]
    ) {
      operations.push({ kind: "unchanged", value: currentItems[currentIndex] });
      currentIndex += 1;
      proposedIndex += 1;
    } else if (
      currentIndex < currentItems.length &&
      (proposedIndex >= proposedItems.length ||
        matrix[currentIndex + 1][proposedIndex] >= matrix[currentIndex][proposedIndex + 1])
    ) {
      operations.push({ kind: "removed", value: currentItems[currentIndex] });
      currentIndex += 1;
    } else {
      operations.push({ kind: "added", value: proposedItems[proposedIndex] });
      proposedIndex += 1;
    }
  }

  return operations;
}

function coalesceSegments(segments) {
  return segments.reduce((result, segment) => {
    const previous = result.at(-1);
    if (previous?.kind === segment.kind) {
      previous.text += segment.text;
    } else {
      result.push({ ...segment });
    }
    return result;
  }, []);
}

function tokenize(value) {
  return String(value).match(/\S+\s*/gu) ?? [];
}

/**
 * Marks removed words in red and replacement words in yellow.
 *
 * @param {string} currentText
 * @param {string} proposedText
 * @returns {StatuteDiffSegment[]}
 */
export function buildInlineDiff(currentText, proposedText) {
  if (currentText === proposedText) {
    return currentText ? [{ kind: "unchanged", text: currentText }] : [];
  }

  if (!currentText) {
    return proposedText ? [{ kind: "added", text: proposedText }] : [];
  }

  if (!proposedText) {
    return [{ kind: "removed", text: currentText }];
  }

  return coalesceSegments(
    sequenceDiff(tokenize(currentText), tokenize(proposedText)).map((operation) => ({
      kind: operation.kind === "added" ? "changed" : operation.kind,
      text: operation.value,
    })),
  );
}

function textLines(value) {
  return String(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function lineMarker(line) {
  const trimmed = String(line).trim();
  const paragraph = trimmed.match(/^§\s*(\d+[a-z]?)/i);
  if (paragraph) return `paragraph:${paragraph[1].toLowerCase()}`;

  const section = trimmed.match(/^(\d+[a-z]?)\.\s/i);
  if (section) return `section:${section[1].toLowerCase()}`;

  const point = trimmed.match(/^(\d+[a-z]?)\)\s/i);
  if (point) return `point:${point[1].toLowerCase()}`;

  const letter = trimmed.match(/^([a-z])\)\s/i);
  if (letter) return `letter:${letter[1].toLowerCase()}`;

  return "";
}

/**
 * Compares statute bodies line by line. Entirely new lines are blue, deleted
 * lines are red, and paired replacements use a word-level red/yellow diff.
 *
 * @param {string} currentText
 * @param {string} proposedText
 * @returns {StatuteDiffLine[]}
 */
export function buildTextDiff(currentText, proposedText) {
  const currentLines = textLines(currentText);
  const proposedLines = textLines(proposedText);
  const usedCurrentLines = new Set();
  const lines = [];

  for (const proposedLine of proposedLines) {
    const exactIndex = currentLines.findIndex(
      (currentLine, index) => !usedCurrentLines.has(index) && currentLine === proposedLine,
    );

    if (exactIndex >= 0) {
      usedCurrentLines.add(exactIndex);
      lines.push({
        source: proposedLine,
        segments: [{ kind: "unchanged", text: proposedLine }],
      });
      continue;
    }

    const proposedMarker = lineMarker(proposedLine);
    const replacementIndex = currentLines.findIndex((currentLine, index) => {
      if (usedCurrentLines.has(index)) return false;
      const currentMarker = lineMarker(currentLine);
      return proposedMarker ? currentMarker === proposedMarker : currentMarker === "";
    });

    if (replacementIndex >= 0) {
      usedCurrentLines.add(replacementIndex);
      lines.push({
        source: proposedLine,
        segments: buildInlineDiff(currentLines[replacementIndex], proposedLine),
      });
      continue;
    }

    lines.push({
      source: proposedLine,
      segments: [{ kind: "added", text: proposedLine }],
    });
  }

  currentLines.forEach((currentLine, index) => {
    if (usedCurrentLines.has(index)) return;
    lines.push({
      source: currentLine,
      segments: [{ kind: "removed", text: currentLine }],
    });
  });

  return lines;
}
