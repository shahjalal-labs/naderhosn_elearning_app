import prisma from '../shared/prisma';
import { normalizeGrade, gradesMatch } from '../helpers/gradeMatcher';

async function main() {
  console.log('--- Starting GradeBooks Database Cleanup ---');

  const allGradeBooks = await prisma.gradeBooks.findMany({
    select: {
      id: true,
      book: { select: { id: true, bookName: true } },
      grade: { select: { id: true, grade: true, schoolId: true } }
    }
  });

  console.log(`Total current GradeBooks rows: ${allGradeBooks.length}`);

  const invalidIds: string[] = [];

  for (const gb of allGradeBooks) {
    if (!gb.book || !gb.grade) {
      invalidIds.push(gb.id);
      continue;
    }

    const bLevels = normalizeGrade(gb.book.bookName || '');
    const gLevels = normalizeGrade(gb.grade.grade || '');

    // If both levels are detected and don't match, it's a cross-grade mismatch
    if (!gradesMatch(bLevels, gLevels)) {
      invalidIds.push(gb.id);
    }
  }

  console.log(`Found ${invalidIds.length} mismatched records to delete.`);
  console.log(`Remaining valid records will be: ${allGradeBooks.length - invalidIds.length}`);

  // Delete in batches of 1000
  const batchSize = 1000;
  for (let i = 0; i < invalidIds.length; i += batchSize) {
    const chunk = invalidIds.slice(i, i + batchSize);
    const res = await prisma.gradeBooks.deleteMany({
      where: { id: { in: chunk } }
    });
    console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(invalidIds.length / batchSize)}: ${res.count} rows`);
  }

  const finalCount = await prisma.gradeBooks.count();
  console.log(`Cleanup complete! Final GradeBooks count: ${finalCount}`);

  // Verification: Dome School & Mary Gauzman
  const domeKG2 = await prisma.gradeBooks.findMany({
    where: { gradeId: '6a9d3305493a0aedaed33cf5' },
    include: { book: true, grade: true }
  });
  console.log('\n--- Verification for Dome School KG2 (Grade ID: 6a9d3305493a0aedaed33cf5) ---');
  console.log(`Total books now linked to KG2: ${domeKG2.length}`);
  domeKG2.forEach(gb => {
    console.log(`  Book: ${gb.book.bookName}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
