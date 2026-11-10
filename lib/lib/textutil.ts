const STOPWORDS = new Set(
  "a,an,the,and,or,but,if,then,else,of,at,by,for,with,about,into,through,during,before,after,above,below,to,from,up,down,in,out,on,off,over,under,again,further,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,only,own,same,so,than,too,very,can,will,just,should,now,is,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,would,could,shall,may,might,must,it,its,this,that,these,those,i,you,he,she,we,they,them,his,her,their,our,your,my,me,him,us,as,not".split(",")
);

export interface Span {
  text: string;
  start: number;
  end: number;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'.-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function tokenSet(text: string): Set<string> {
  return new Set(tokenize(text));
}

export function splitSentences(text: string): Span[] {
  const spans: Span[] = [];
  const re = /[^.!?\n]+[.!?]+[\s]?|[^.!?\n]+$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const t = m[0].trim();
    if (t.length > 0) {
      const start = m.index + (m[0].length - m[0].trimStart().length);
      spans.push({ text: t, start, end: start + t.length });
    }
  }
  return spans;
}

export function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / a.size;
}

export function numbers(text: string): string[] {
  return text.match(/\d+(?:[.,]\d+)*/g) ?? [];
}

export function hasNegation(text: string): boolean {
  return /\b(not|no|never|cannot|can't|won't|don't|doesn't|isn't|aren't|wasn't|weren't|mustn't|without|prohibited|forbidden)\b/i.test(
    text
  );
}
