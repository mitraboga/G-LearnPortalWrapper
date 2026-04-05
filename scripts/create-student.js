const { closeDatabase, initializeDatabase, upsertStudent } = require("../lib/student-store");

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

function printUsage() {
  console.log(
    [
      "Usage:",
      '  npm run create-student -- --username student01 --password StrongPass123 --name "Student Name" --department "CSE"',
    ].join("\n")
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.username || !args.password || !args.name) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  await initializeDatabase();

  const result = await upsertStudent({
    username: args.username,
    password: args.password,
    fullName: args.name,
    department: args.department || "General Studies",
  });

  console.log(`${result.action} student account:`);
  console.table([result.student]);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase().catch(() => {});
  });
