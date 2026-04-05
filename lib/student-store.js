const mysql = require("mysql2/promise");

const { dbConfig } = require("./config");
const { hashPassword, verifyPassword } = require("./passwords");

let dbPool = null;
let dbStatus = {
  ready: false,
  message: "Database has not been initialized yet.",
};

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, "``")}\``;
}

async function initializeDatabase() {
  if (dbPool) {
    return dbPool;
  }

  let setupConnection;

  try {
    setupConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await setupConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(dbConfig.database)}`
    );
    await setupConnection.end();

    dbPool = mysql.createPool({
      ...dbConfig,
      connectionLimit: 10,
      waitForConnections: true,
    });

    await ensureStudentSchema();
    await seedDefaultStudentIfEmpty();

    dbStatus = {
      ready: true,
      message: `Connected to MySQL database "${dbConfig.database}".`,
    };
    console.log(dbStatus.message);

    return dbPool;
  } catch (error) {
    dbStatus = {
      ready: false,
      message: error.message,
    };

    if (dbPool) {
      await dbPool.end().catch(() => {});
      dbPool = null;
    }

    if (setupConnection) {
      await setupConnection.end().catch(() => {});
    }

    throw error;
  }
}

async function ensureStudentSchema() {
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      department VARCHAR(100) NOT NULL DEFAULT 'General Studies',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [columns] = await dbPool.query("SHOW COLUMNS FROM students");
  const columnNames = new Set(columns.map((column) => column.Field));

  if (!columnNames.has("password_hash")) {
    await dbPool.query(
      "ALTER TABLE students ADD COLUMN password_hash VARCHAR(255) NULL AFTER username"
    );
  }

  if (!columnNames.has("created_at")) {
    await dbPool.query(
      "ALTER TABLE students ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
    );
  }

  if (!columnNames.has("updated_at")) {
    await dbPool.query(
      "ALTER TABLE students ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    );
  }

  await migrateLegacyPasswords();
  await ensureAllStudentsHaveHashes();

  const [refreshedColumns] = await dbPool.query("SHOW COLUMNS FROM students");
  const refreshedNames = new Set(refreshedColumns.map((column) => column.Field));

  if (refreshedNames.has("password")) {
    await dbPool.query("ALTER TABLE students DROP COLUMN password");
  }

  await dbPool.query(
    "ALTER TABLE students MODIFY COLUMN password_hash VARCHAR(255) NOT NULL"
  );
}

async function migrateLegacyPasswords() {
  const [columns] = await dbPool.query("SHOW COLUMNS FROM students");
  const hasLegacyPassword = columns.some((column) => column.Field === "password");

  if (!hasLegacyPassword) {
    return;
  }

  const [rows] = await dbPool.query(`
    SELECT id, password
    FROM students
    WHERE (password_hash IS NULL OR password_hash = '')
      AND password IS NOT NULL
  `);

  for (const row of rows) {
    const passwordHash = await hashPassword(row.password);
    await dbPool.query(
      "UPDATE students SET password_hash = ? WHERE id = ?",
      [passwordHash, row.id]
    );
  }
}

async function ensureAllStudentsHaveHashes() {
  const [rows] = await dbPool.query(`
    SELECT COUNT(*) AS count
    FROM students
    WHERE password_hash IS NULL OR password_hash = ''
  `);

  if (rows[0].count > 0) {
    throw new Error(
      "Some student records do not have password hashes. Update them before starting the portal."
    );
  }
}

async function seedDefaultStudentIfEmpty() {
  const [rows] = await dbPool.query("SELECT COUNT(*) AS count FROM students");

  if (rows[0].count > 0) {
    return;
  }

  await upsertStudent({
    username: "student1",
    password: "password123",
    fullName: "Demo Student",
    department: "Computer Science",
  });
}

async function findStudentForLogin(username) {
  if (!dbPool) {
    throw new Error("Database connection is unavailable.");
  }

  const [rows] = await dbPool.query(
    `
      SELECT id, username, password_hash, full_name, department
      FROM students
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );

  return rows[0] || null;
}

async function authenticateStudent(username, password) {
  const student = await findStudentForLogin(username);

  if (!student) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, student.password_hash);

  if (!isValidPassword) {
    return null;
  }

  return sanitizeStudent(student);
}

async function upsertStudent({ username, password, fullName, department }) {
  const normalizedUsername = String(username || "").trim();
  const normalizedPassword = String(password || "");
  const normalizedFullName = String(fullName || "").trim();
  const normalizedDepartment = String(department || "General Studies").trim();

  if (!normalizedUsername || !normalizedPassword || !normalizedFullName) {
    throw new Error("Username, password, and full name are required.");
  }

  const passwordHash = await hashPassword(normalizedPassword);
  const existingStudent = await findStudentForLogin(normalizedUsername);

  if (existingStudent) {
    await dbPool.query(
      `
        UPDATE students
        SET password_hash = ?, full_name = ?, department = ?
        WHERE username = ?
      `,
      [passwordHash, normalizedFullName, normalizedDepartment, normalizedUsername]
    );

    return {
      action: "updated",
      student: {
        id: existingStudent.id,
        username: normalizedUsername,
        full_name: normalizedFullName,
        department: normalizedDepartment,
      },
    };
  }

  const [result] = await dbPool.query(
    `
      INSERT INTO students (username, password_hash, full_name, department)
      VALUES (?, ?, ?, ?)
    `,
    [normalizedUsername, passwordHash, normalizedFullName, normalizedDepartment]
  );

  return {
    action: "created",
    student: {
      id: result.insertId,
      username: normalizedUsername,
      full_name: normalizedFullName,
      department: normalizedDepartment,
    },
  };
}

async function listStudents() {
  if (!dbPool) {
    throw new Error("Database connection is unavailable.");
  }

  const [rows] = await dbPool.query(`
    SELECT id, username, full_name, department, created_at, updated_at
    FROM students
    ORDER BY id ASC
  `);

  return rows;
}

function sanitizeStudent(student) {
  return {
    id: student.id,
    username: student.username,
    full_name: student.full_name,
    department: student.department,
  };
}

function getDbStatus() {
  return dbStatus;
}

async function closeDatabase() {
  if (!dbPool) {
    return;
  }

  await dbPool.end().catch(() => {});
  dbPool = null;
}

module.exports = {
  authenticateStudent,
  closeDatabase,
  getDbStatus,
  initializeDatabase,
  listStudents,
  upsertStudent,
};
