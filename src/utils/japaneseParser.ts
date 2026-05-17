const HEADING_KEYWORDS = [
  '口语版',
  '敬语版',
  '解析',
  '其他句型',
  '其他句例',
  '如何回答',
  '翻译练习',
  '参考答案',
];

const SENTENCE_HEADINGS = ['口语版', '敬语版', '参考答案', '如何回答'];
const BULLET_HEADINGS = ['其他句型', '其他句例'];
const PARSE_HEADING = '解析';

export interface ContentBlock {
  type: 'heading' | 'sentence' | 'markdown';
  text: string;
}

export interface ParseItem {
  index: number;
  word: string;
  reading: string;
  explanation: string;
}

function matchHeading(line: string): { keyword: string; afterHeading: string } | null {
  const trimmed = line.trim();
  for (const kw of HEADING_KEYWORDS) {
    const pattern = `**${kw}`;
    if (trimmed.startsWith(pattern)) {
      const afterPattern = trimmed.slice(pattern.length);
      const afterHeading = afterPattern
        .replace(/^：?\*?\*?\s*/, '')
        .replace(/^:\s*/, '')
        .trim();
      return { keyword: kw, afterHeading };
    }
  }
  return null;
}

function isSentenceHeading(keyword: string): boolean {
  return SENTENCE_HEADINGS.includes(keyword);
}

function isBulletHeading(keyword: string): boolean {
  return BULLET_HEADINGS.includes(keyword);
}

function isParseHeading(keyword: string): boolean {
  return keyword === PARSE_HEADING;
}

function looksLikeTargetSentence(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^\*\*/.test(trimmed)) return false;
  if (/^\d+\.\s/.test(trimmed)) return false;
  if (/^[-•]\s/.test(trimmed)) return false;
  if (/^[「「]/.test(trimmed)) return false;
  if (/^(请|更|与|如|如：|例如|注意|提示|说明)/.test(trimmed)) return false;
  if (trimmed === '无需回答' || trimmed === '同口语版') return false;
  return true;
}

function isSubHeading(line: string): boolean {
  const trimmed = line.trim();
  return /^(更自然的说法|更礼貌的说法|更随意的说法|更正式的说法|更口语的说法|更书面的说法)[：:]\s*/.test(trimmed);
}

function extractSubHeadingSentence(line: string): string | null {
  const trimmed = line.trim();
  const match = trimmed.match(/^(更自然的说法|更礼貌的说法|更随意的说法|更正式的说法|更口语的说法|更书面的说法)[：:]\s*(.+)$/);
  if (match && match[2].trim()) {
    return match[2].trim();
  }
  return null;
}

export function parseAIResponse(md: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = md.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const headingMatch = matchHeading(line);

    if (headingMatch) {
      blocks.push({ type: 'heading', text: line.trim() });

      if (headingMatch.afterHeading) {
        blocks.push({ type: 'sentence', text: headingMatch.afterHeading });
      }

      i++;

      if (isParseHeading(headingMatch.keyword)) {
        let markdownChunk = '';
        while (i < lines.length) {
          const nextLine = lines[i];
          if (matchHeading(nextLine)) break;
          markdownChunk += (markdownChunk ? '\n' : '') + nextLine;
          i++;
        }
        if (markdownChunk.trim()) {
          blocks.push({ type: 'markdown', text: markdownChunk });
        }
        continue;
      }

      if (isBulletHeading(headingMatch.keyword)) {
        while (i < lines.length) {
          const nextLine = lines[i];
          if (!nextLine.trim()) {
            i++;
            continue;
          }
          if (matchHeading(nextLine)) break;

          const subSentence = extractSubHeadingSentence(nextLine);
          if (subSentence) {
            blocks.push({ type: 'sentence', text: subSentence });
            i++;
            continue;
          }

          if (isSubHeading(nextLine)) {
            i++;
            while (i < lines.length) {
              const nl = lines[i];
              if (!nl.trim()) { i++; continue; }
              if (matchHeading(nl) || isSubHeading(nl)) break;
              if (looksLikeTargetSentence(nl)) {
                blocks.push({ type: 'sentence', text: nl.trim() });
                i++;
              } else {
                break;
              }
            }
            continue;
          }

          if (looksLikeTargetSentence(nextLine)) {
            blocks.push({ type: 'sentence', text: nextLine.trim() });
            i++;
          } else {
            break;
          }
        }
        continue;
      }

      if (isSentenceHeading(headingMatch.keyword)) {
        while (i < lines.length) {
          const nextLine = lines[i];
          if (!nextLine.trim()) {
            i++;
            continue;
          }
          if (matchHeading(nextLine)) break;
          if (looksLikeTargetSentence(nextLine)) {
            blocks.push({ type: 'sentence', text: nextLine.trim() });
            i++;
          } else {
            break;
          }
        }
        continue;
      }

      let markdownChunk = '';
      while (i < lines.length) {
        const nextLine = lines[i];
        if (matchHeading(nextLine)) break;
        markdownChunk += (markdownChunk ? '\n' : '') + nextLine;
        i++;
      }
      if (markdownChunk.trim()) {
        blocks.push({ type: 'markdown', text: markdownChunk });
      }
      continue;
    }

    let markdownChunk = line;
    i++;
    while (i < lines.length) {
      const nextLine = lines[i];
      if (matchHeading(nextLine)) break;
      markdownChunk += '\n' + nextLine;
      i++;
    }
    if (markdownChunk.trim()) {
      blocks.push({ type: 'markdown', text: markdownChunk });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'markdown', text: md });
  }

  return blocks;
}

export function extractParseItems(md: string): ParseItem[] {
  const results: ParseItem[] = [];
  const lines = md.split('\n');
  let inParseSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\*\*解析：?\*\*\s*$/.test(trimmed) || /^\*\*解析\*\*\s*$/.test(trimmed)) {
      inParseSection = true;
      continue;
    }
    if (inParseSection && /^\*\*[^*]+\*\*\s*$/.test(trimmed)) {
      inParseSection = false;
      continue;
    }
    if (!inParseSection) continue;

    const matchNew = trimmed.match(/^(.+?)\s*\((.+?)\)\s*[：:]\s*(.+)$/);
    if (matchNew) {
      results.push({
        index: results.length + 1,
        word: matchNew[1].trim(),
        reading: matchNew[2].trim(),
        explanation: matchNew[3].trim(),
      });
      continue;
    }

    const matchOld = trimmed.match(/^(\d+)\.\s*\*\*(.+?)\*\*\s*[：:]\s*(.+)$/);
    if (matchOld) {
      results.push({
        index: parseInt(matchOld[1], 10),
        word: matchOld[2].trim(),
        reading: '',
        explanation: matchOld[3].trim(),
      });
    }
  }

  return results;
}