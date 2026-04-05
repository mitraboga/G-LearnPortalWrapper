const { closeDatabase, initializeDatabase, listStudents } = require("../lib/student-store");

async function main() {
  await initializeDatabase();
  const students = await listStudents();

  if (students.length === 0) {
    console.log("No student records found.");
    return;
  }

  console.table(students);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase().catch(() => {});
  });
