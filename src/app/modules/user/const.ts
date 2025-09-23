// generate unique id for username also .
// utils.ts

export function generateStudentUserName(): string {
  const timestamp = Date.now().toString(36); // base36 makes it shorter
  const randomPart = Math.random().toString(36).substr(2, 4); // 4 random chars
  return `stu-${timestamp}-${randomPart}`;
}
export function generateTeacherUserName(): string {
  const timestamp = Date.now().toString(36); // base36 makes it shorter
  const randomPart = Math.random().toString(36).substr(2, 4); // 4 random chars
  return `teach-${timestamp}-${randomPart}`;
}
export function randomPassword(): string {
  const randomPart = Math.random().toString(36).substr(2, 6);
  return randomPart;
}
