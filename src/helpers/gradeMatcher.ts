export function normalizeGrade(name: string): string[] {
  if (!name) return [];
  // Strip Arabic diacritics (tashkeel)
  const norm = name
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .trim();
  const res: string[] = [];

  // Kindergarten / Preschool
  if (norm.includes('preschool') || norm.includes('تمهيدي') || norm.includes('starter') || norm.includes('روضات')) {
    res.push('preschool');
  }
  if (
    norm.includes('kg1') ||
    norm.includes('kg 1') ||
    norm.includes('kg-1') ||
    norm.includes('روضة اولى') ||
    norm.includes('روضة أولى') ||
    norm.includes('الروضة الأولى') ||
    norm.includes('الروضة الاولى')
  ) {
    res.push('kg1');
  }
  if (
    norm.includes('kg2') ||
    norm.includes('kg 2') ||
    norm.includes('kg-2') ||
    norm.includes('روضة ثانية') ||
    norm.includes('الروضة الثانية')
  ) {
    res.push('kg2');
  }
  if (
    norm.includes('kg3') ||
    norm.includes('kg 3') ||
    norm.includes('kg-3') ||
    norm.includes('روضة ثالثة') ||
    norm.includes('الروضة الثالثة')
  ) {
    res.push('kg3');
  }

  // Grades 1 to 12
  for (let i = 12; i >= 1; i--) {
    const patterns = [
      new RegExp('\\bgrade\\s*' + i + '(\\b|[a-z])', 'i'),
      new RegExp('\\bgarde\\s*' + i + '(\\b|[a-z])', 'i'),
      new RegExp('\\bniveau\\s*' + i + '(\\b|[a-z])', 'i'),
      new RegExp('\\blevel\\s*' + i + '(\\b|[a-z])', 'i'),
      new RegExp('^' + i + '[a-z]$', 'i'),
    ];
    if (i === 1 && (norm.includes('الأول') || norm.includes('الاول'))) res.push('1');
    else if (i === 2 && norm.includes('الثاني')) res.push('2');
    else if (i === 3 && norm.includes('الثالث')) res.push('3');
    else if (i === 4 && norm.includes('الرابع')) res.push('4');
    else if (i === 5 && norm.includes('الخامس')) res.push('5');
    else if (i === 6 && norm.includes('السادس')) res.push('6');
    else if (i === 7 && norm.includes('السابع')) res.push('7');
    else if (i === 8 && norm.includes('الثامن')) res.push('8');
    else if (i === 9 && norm.includes('التاسع')) res.push('9');
    else if (i === 10 && norm.includes('العاشر')) res.push('10');
    else if (i === 11 && norm.includes('الحادي عشر')) res.push('11');
    else if (i === 12 && norm.includes('الثاني عشر')) res.push('12');

    if (patterns.some((p) => p.test(norm))) {
      res.push(i.toString());
    }
  }

  // Handle specific series: Up We Go - Science/English/Math 1/2/3
  if (norm.includes('up we go')) {
    if (norm.includes('1')) res.push('kg1');
    if (norm.includes('2')) res.push('kg2');
    if (norm.includes('3')) res.push('kg3');
  }

  return Array.from(new Set(res));
}

export function formatNormalizedGrade(level: string): string {
  if (level === 'preschool') return 'Preschool';
  if (level.startsWith('kg')) return level.toUpperCase();
  return `Grade ${level}`;
}

export function getBookDisplayGrades(bookName?: string | null, fallbackGrades: string[] = []): string[] {
  if (bookName) {
    const levels = normalizeGrade(bookName);
    if (levels.length > 0) {
      return levels.map(formatNormalizedGrade);
    }
  }
  return fallbackGrades;
}

export function gradesMatch(bookLevels: string[], gradeLevels: string[]): boolean {
  if (bookLevels.length === 0 || gradeLevels.length === 0) return true; // general book applies to all
  return bookLevels.some((bl) => gradeLevels.includes(bl));
}
