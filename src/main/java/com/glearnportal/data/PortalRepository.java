package com.glearnportal.data;

import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.glearnportal.AppConfig;
import com.glearnportal.security.PasswordUtil;

public final class PortalRepository {
  private static AppConfig config;
  private static volatile boolean initialized;

  private PortalRepository() {
  }

  public static void initialize(AppConfig appConfig) throws Exception {
    config = appConfig;
    ensureInitialized();
  }

  public static Student authenticate(String username, String password) throws SQLException {
    ensureInitializedQuietly();
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             SELECT id, username, password_hash, full_name, department
             FROM portal_students
             WHERE username = ?
             LIMIT 1
             """)) {
      statement.setString(1, username);

      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return null;
        }

        String storedHash = resultSet.getString("password_hash");
        if (!PasswordUtil.verifyPassword(password, storedHash)) {
          return null;
        }

        return new Student(
            resultSet.getInt("id"),
            resultSet.getString("username"),
            resultSet.getString("full_name"),
            resultSet.getString("department")
        );
      }
    }
  }

  public static Student findStudentById(int studentId) throws SQLException {
    ensureInitializedQuietly();
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             SELECT id, username, full_name, department
             FROM portal_students
             WHERE id = ?
             LIMIT 1
             """)) {
      statement.setInt(1, studentId);

      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return null;
        }

        return new Student(
            resultSet.getInt("id"),
            resultSet.getString("username"),
            resultSet.getString("full_name"),
            resultSet.getString("department")
        );
      }
    }
  }

  public static DashboardSummary getDashboardSummary(int studentId) throws SQLException {
    ensureInitializedQuietly();
    List<CourseRecord> allCourses = getAllCourses(studentId);
    List<CourseRecord> currentCourses = allCourses.stream().filter(CourseRecord::current).toList();

    String currentSemester = currentCourses.isEmpty() ? "Current Semester" : currentCourses.get(0).semesterLabel();
    double sgpa = calculateGpa(currentCourses);
    double cgpa = calculateGpa(allCourses);
    double overallAttendance = currentCourses.stream()
        .mapToDouble(CourseRecord::attendancePercentage)
        .average()
        .orElse(0.0);

    return new DashboardSummary(currentSemester, roundTwo(sgpa), roundTwo(cgpa), roundTwo(overallAttendance));
  }

  public static List<CourseRecord> getCurrentCourses(int studentId) throws SQLException {
    ensureInitializedQuietly();
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             SELECT id, semester_label, is_current, course_code, course_title, instructor,
                    schedule_info, credits, attendance_percentage, assignment_mark,
                    midterm_mark, final_mark, total_mark, grade_letter
             FROM portal_course_records
             WHERE student_id = ? AND is_current = 1
             ORDER BY course_code ASC
             """)) {
      statement.setInt(1, studentId);
      return readCourses(statement);
    }
  }

  public static List<AnnouncementRecord> getAnnouncements() throws SQLException {
    ensureInitializedQuietly();
    List<AnnouncementRecord> announcements = new ArrayList<>();

    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             SELECT id, title, publish_date, priority_level, description
             FROM portal_announcements
             ORDER BY publish_date DESC, id DESC
             """);
         ResultSet resultSet = statement.executeQuery()) {
      while (resultSet.next()) {
        announcements.add(new AnnouncementRecord(
            resultSet.getInt("id"),
            resultSet.getString("title"),
            resultSet.getDate("publish_date").toLocalDate(),
            resultSet.getString("priority_level"),
            resultSet.getString("description")
        ));
      }
    }

    return announcements;
  }

  public static boolean updateAttendance(int studentId, int courseId, double attendancePercentage)
      throws SQLException {
    ensureInitializedQuietly();
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             UPDATE portal_course_records
             SET attendance_percentage = ?
             WHERE id = ? AND student_id = ? AND is_current = 1
             """)) {
      statement.setDouble(1, attendancePercentage);
      statement.setInt(2, courseId);
      statement.setInt(3, studentId);
      return statement.executeUpdate() > 0;
    }
  }

  public static boolean updateMarks(
      int studentId,
      int courseId,
      double assignmentMark,
      double midtermMark,
      double finalMark
  ) throws SQLException {
    ensureInitializedQuietly();
    double totalMark = assignmentMark + midtermMark + finalMark;
    String gradeLetter = calculateGradeLetter(totalMark);

    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             UPDATE portal_course_records
             SET assignment_mark = ?, midterm_mark = ?, final_mark = ?,
                 total_mark = ?, grade_letter = ?
             WHERE id = ? AND student_id = ? AND is_current = 1
             """)) {
      statement.setDouble(1, assignmentMark);
      statement.setDouble(2, midtermMark);
      statement.setDouble(3, finalMark);
      statement.setDouble(4, totalMark);
      statement.setString(5, gradeLetter);
      statement.setInt(6, courseId);
      statement.setInt(7, studentId);
      return statement.executeUpdate() > 0;
    }
  }

  public static Student registerStudent(RegistrationData registrationData) throws SQLException {
    ensureInitializedQuietly();

    String username = registrationData.username().trim();
    if (usernameExists(username)) {
      throw new SQLException("That Roll No. / Username is already registered.");
    }

    int studentId = insertStudent(registrationData);
    insertCourseSeeds(studentId);
    return findStudentById(studentId);
  }

  private static List<CourseRecord> getAllCourses(int studentId) throws SQLException {
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             SELECT id, semester_label, is_current, course_code, course_title, instructor,
                    schedule_info, credits, attendance_percentage, assignment_mark,
                    midterm_mark, final_mark, total_mark, grade_letter
             FROM portal_course_records
             WHERE student_id = ?
             ORDER BY is_current DESC, course_code ASC
             """)) {
      statement.setInt(1, studentId);
      return readCourses(statement);
    }
  }

  private static List<CourseRecord> readCourses(PreparedStatement statement) throws SQLException {
    List<CourseRecord> courses = new ArrayList<>();

    try (ResultSet resultSet = statement.executeQuery()) {
      while (resultSet.next()) {
        courses.add(new CourseRecord(
            resultSet.getInt("id"),
            resultSet.getString("semester_label"),
            resultSet.getBoolean("is_current"),
            resultSet.getString("course_code"),
            resultSet.getString("course_title"),
            resultSet.getString("instructor"),
            resultSet.getString("schedule_info"),
            resultSet.getInt("credits"),
            resultSet.getDouble("attendance_percentage"),
            resultSet.getDouble("assignment_mark"),
            resultSet.getDouble("midterm_mark"),
            resultSet.getDouble("final_mark"),
            resultSet.getDouble("total_mark"),
            resultSet.getString("grade_letter")
        ));
      }
    }

    return courses;
  }

  private static double calculateGpa(List<CourseRecord> courses) {
    double totalWeightedPoints = 0.0;
    int totalCredits = 0;

    for (CourseRecord course : courses) {
      double gradePoint = switch (course.gradeLetter()) {
        case "A+" -> 10.0;
        case "A" -> 9.0;
        case "B+" -> 8.0;
        case "B" -> 7.0;
        case "C+" -> 6.0;
        case "C" -> 5.0;
        default -> 0.0;
      };

      totalWeightedPoints += gradePoint * course.credits();
      totalCredits += course.credits();
    }

    return totalCredits == 0 ? 0.0 : totalWeightedPoints / totalCredits;
  }

  private static String calculateGradeLetter(double totalMark) {
    if (totalMark >= 90) {
      return "A+";
    }
    if (totalMark >= 80) {
      return "A";
    }
    if (totalMark >= 70) {
      return "B+";
    }
    if (totalMark >= 60) {
      return "B";
    }
    if (totalMark >= 50) {
      return "C+";
    }
    if (totalMark >= 40) {
      return "C";
    }
    return "F";
  }

  private static double roundTwo(double value) {
    return Math.round(value * 100.0) / 100.0;
  }

  private static void createDatabaseIfNeeded() throws SQLException {
    try (Connection connection = openRootConnection();
         Statement statement = connection.createStatement()) {
      statement.execute("CREATE DATABASE IF NOT EXISTS `" + config.dbName() + "`");
    }
  }

  private static void createTablesIfNeeded() throws SQLException {
    try (Connection connection = openConnection();
         Statement statement = connection.createStatement()) {
      statement.execute("""
          CREATE TABLE IF NOT EXISTS portal_students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            department VARCHAR(100) NOT NULL,
            first_name VARCHAR(50) NULL,
            last_name VARCHAR(50) NULL,
            mobile_no VARCHAR(20) NULL,
            date_of_birth DATE NULL,
            email_id VARCHAR(120) NULL,
            age INT NULL,
            gender VARCHAR(20) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
          """);

      statement.execute("""
          CREATE TABLE IF NOT EXISTS portal_course_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            semester_label VARCHAR(40) NOT NULL,
            is_current BOOLEAN NOT NULL DEFAULT FALSE,
            course_code VARCHAR(20) NOT NULL,
            course_title VARCHAR(120) NOT NULL,
            instructor VARCHAR(100) NOT NULL,
            schedule_info VARCHAR(100) NOT NULL,
            credits INT NOT NULL,
            attendance_percentage DECIMAL(5,2) NOT NULL,
            assignment_mark DECIMAL(5,2) NOT NULL,
            midterm_mark DECIMAL(5,2) NOT NULL,
            final_mark DECIMAL(5,2) NOT NULL,
            total_mark DECIMAL(5,2) NOT NULL,
            grade_letter VARCHAR(4) NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_portal_course_student
              FOREIGN KEY (student_id) REFERENCES portal_students(id)
              ON DELETE CASCADE
          )
          """);

      statement.execute("""
          CREATE TABLE IF NOT EXISTS portal_announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            publish_date DATE NOT NULL,
            priority_level VARCHAR(20) NOT NULL,
            description TEXT NOT NULL
          )
          """);
    }

    ensureStudentRegistrationColumns();
  }

  private static void seedDataIfNeeded() throws SQLException {
    seedStudentsIfNeeded();
    seedAnnouncementsIfNeeded();
  }

  private static void seedStudentsIfNeeded() throws SQLException {
    if (tableCount("portal_students") > 0) {
      return;
    }

    int demoStudentId = insertStudent("student1", "password123", "Demo Student", "Computer Science");
    int caseStudyStudentId = insertStudent("case2026", "CaseStudy123", "Case Study Student", "Information Technology");

    insertCourseSeeds(demoStudentId);
    insertCourseSeeds(caseStudyStudentId);
  }

  private static void seedAnnouncementsIfNeeded() throws SQLException {
    if (tableCount("portal_announcements") > 0) {
      return;
    }

    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             INSERT INTO portal_announcements (title, publish_date, priority_level, description)
             VALUES (?, ?, ?, ?)
             """)) {
      insertAnnouncement(statement,
          "Internal Assessment Window Opens on April 22",
          LocalDate.of(2026, 4, 22),
          "high",
          "Carry your ID card and report to the assigned room 15 minutes before the start time.");
      insertAnnouncement(statement,
          "Attendance Lock for April Updates",
          LocalDate.of(2026, 4, 11),
          "medium",
          "Faculty will finalize attendance updates at 6:00 PM. Verify your latest class percentages.");
      insertAnnouncement(statement,
          "Mini Project Review Submission Deadline",
          LocalDate.of(2026, 4, 9),
          "medium",
          "Upload the final presentation deck and source archive before 5:00 PM on Friday.");
    }
  }

  private static void insertAnnouncement(
      PreparedStatement statement,
      String title,
      LocalDate publishDate,
      String priority,
      String description
  ) throws SQLException {
    statement.setString(1, title);
    statement.setDate(2, Date.valueOf(publishDate));
    statement.setString(3, priority);
    statement.setString(4, description);
    statement.executeUpdate();
  }

  private static int insertStudent(String username, String password, String fullName, String department)
      throws SQLException {
    RegistrationData registrationData = new RegistrationData(
        extractFirstName(fullName),
        extractLastName(fullName),
        username,
        null,
        null,
        null,
        password,
        null,
        null,
        department
    );

    return insertStudent(registrationData);
  }

  private static int insertStudent(RegistrationData registrationData) throws SQLException {
    String fullName = registrationData.firstName().trim() + " " + registrationData.lastName().trim();

    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             INSERT INTO portal_students (
               username, password_hash, full_name, department, first_name, last_name,
               mobile_no, date_of_birth, email_id, age, gender
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             """, Statement.RETURN_GENERATED_KEYS)) {
      statement.setString(1, registrationData.username().trim());
      statement.setString(2, PasswordUtil.hashPassword(registrationData.password()));
      statement.setString(3, fullName.trim());
      statement.setString(4, registrationData.department());
      statement.setString(5, registrationData.firstName().trim());
      statement.setString(6, registrationData.lastName().trim());
      statement.setString(7, registrationData.mobileNo());
      if (registrationData.dateOfBirth() != null) {
        statement.setDate(8, Date.valueOf(registrationData.dateOfBirth()));
      } else {
        statement.setNull(8, java.sql.Types.DATE);
      }
      statement.setString(9, registrationData.emailId());
      if (registrationData.age() != null) {
        statement.setInt(10, registrationData.age());
      } else {
        statement.setNull(10, java.sql.Types.INTEGER);
      }
      statement.setString(11, registrationData.gender());
      statement.executeUpdate();

      try (ResultSet keys = statement.getGeneratedKeys()) {
        keys.next();
        return keys.getInt(1);
      }
    }
  }

  private static void insertCourseSeeds(int studentId) throws SQLException {
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             INSERT INTO portal_course_records (
               student_id, semester_label, is_current, course_code, course_title, instructor,
               schedule_info, credits, attendance_percentage, assignment_mark, midterm_mark,
               final_mark, total_mark, grade_letter
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             """)) {
      insertCourse(statement, studentId, "Semester 3", false, "DB301", "Database Management Systems",
          "Dr. Anita Rao", "Mon/Wed 09:00 AM", 4, 88.0, 17.0, 25.0, 42.0);
      insertCourse(statement, studentId, "Semester 3", false, "CN302", "Computer Networks",
          "Prof. Rahul Sen", "Tue/Thu 11:00 AM", 3, 91.0, 18.0, 24.0, 44.0);
      insertCourse(statement, studentId, "Semester 3", false, "SE303", "Software Engineering",
          "Ms. Priya Nair", "Fri 10:00 AM", 3, 86.0, 16.0, 23.0, 40.0);

      insertCourse(statement, studentId, "Semester 4", true, "WAD401", "Web Application Development",
          "Dr. Kavita Sharma", "Mon/Wed 10:00 AM", 4, 92.0, 18.0, 26.0, 44.0);
      insertCourse(statement, studentId, "Semester 4", true, "MAD402", "Mobile Application Development",
          "Mr. Vinay Kulkarni", "Tue/Thu 01:00 PM", 3, 87.0, 17.0, 24.0, 42.0);
      insertCourse(statement, studentId, "Semester 4", true, "AI403", "Applied Artificial Intelligence",
          "Dr. Sneha Iyer", "Wed/Fri 02:00 PM", 4, 89.0, 19.0, 25.0, 45.0);
      insertCourse(statement, studentId, "Semester 4", true, "PM404", "Project Management",
          "Prof. Harish Babu", "Sat 09:30 AM", 2, 84.0, 16.0, 22.0, 38.0);
    }
  }

  private static void insertCourse(
      PreparedStatement statement,
      int studentId,
      String semesterLabel,
      boolean current,
      String code,
      String title,
      String instructor,
      String scheduleInfo,
      int credits,
      double attendancePercentage,
      double assignmentMark,
      double midtermMark,
      double finalMark
  ) throws SQLException {
    double totalMark = assignmentMark + midtermMark + finalMark;
    String gradeLetter = calculateGradeLetter(totalMark);

    statement.setInt(1, studentId);
    statement.setString(2, semesterLabel);
    statement.setBoolean(3, current);
    statement.setString(4, code);
    statement.setString(5, title);
    statement.setString(6, instructor);
    statement.setString(7, scheduleInfo);
    statement.setInt(8, credits);
    statement.setDouble(9, attendancePercentage);
    statement.setDouble(10, assignmentMark);
    statement.setDouble(11, midtermMark);
    statement.setDouble(12, finalMark);
    statement.setDouble(13, totalMark);
    statement.setString(14, gradeLetter);
    statement.executeUpdate();
  }

  private static int tableCount(String tableName) throws SQLException {
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement(
             "SELECT COUNT(*) AS count FROM " + tableName);
         ResultSet resultSet = statement.executeQuery()) {
      resultSet.next();
      return resultSet.getInt("count");
    }
  }

  private static Connection openRootConnection() throws SQLException {
    return DriverManager.getConnection(config.rootJdbcUrl(), config.dbUser(), config.dbPassword());
  }

  private static Connection openConnection() throws SQLException {
    return DriverManager.getConnection(config.jdbcUrl(), config.dbUser(), config.dbPassword());
  }

  private static synchronized void ensureInitialized() throws Exception {
    if (initialized) {
      return;
    }

    if (config == null) {
      config = AppConfig.load();
    }

    Class.forName("com.mysql.cj.jdbc.Driver");
    createDatabaseIfNeeded();
    createTablesIfNeeded();
    seedDataIfNeeded();
    initialized = true;
  }

  private static void ensureInitializedQuietly() throws SQLException {
    try {
      ensureInitialized();
    } catch (SQLException error) {
      throw error;
    } catch (Exception error) {
      throw new SQLException("Unable to initialize the portal repository.", error);
    }
  }

  private static boolean usernameExists(String username) throws SQLException {
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("""
             SELECT 1
             FROM portal_students
             WHERE username = ?
             LIMIT 1
             """)) {
      statement.setString(1, username);

      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next();
      }
    }
  }

  private static void ensureStudentRegistrationColumns() throws SQLException {
    ensureStudentColumn("first_name", "ALTER TABLE portal_students ADD COLUMN first_name VARCHAR(50) NULL");
    ensureStudentColumn("last_name", "ALTER TABLE portal_students ADD COLUMN last_name VARCHAR(50) NULL");
    ensureStudentColumn("mobile_no", "ALTER TABLE portal_students ADD COLUMN mobile_no VARCHAR(20) NULL");
    ensureStudentColumn("date_of_birth", "ALTER TABLE portal_students ADD COLUMN date_of_birth DATE NULL");
    ensureStudentColumn("email_id", "ALTER TABLE portal_students ADD COLUMN email_id VARCHAR(120) NULL");
    ensureStudentColumn("age", "ALTER TABLE portal_students ADD COLUMN age INT NULL");
    ensureStudentColumn("gender", "ALTER TABLE portal_students ADD COLUMN gender VARCHAR(20) NULL");
  }

  private static void ensureStudentColumn(String columnName, String ddl) throws SQLException {
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement("SHOW COLUMNS FROM portal_students LIKE ?");
         Statement ddlStatement = connection.createStatement()) {
      statement.setString(1, columnName);

      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          ddlStatement.execute(ddl);
        }
      }
    }
  }

  private static String extractFirstName(String fullName) {
    String[] parts = fullName.trim().split("\\s+", 2);
    return parts.length == 0 ? fullName : parts[0];
  }

  private static String extractLastName(String fullName) {
    String[] parts = fullName.trim().split("\\s+", 2);
    return parts.length < 2 ? "" : parts[1];
  }

  public record Student(int id, String username, String fullName, String department) {
  }

  public record DashboardSummary(
      String currentSemester,
      double sgpa,
      double cgpa,
      double overallAttendance
  ) {
  }

  public record CourseRecord(
      int id,
      String semesterLabel,
      boolean current,
      String courseCode,
      String courseTitle,
      String instructor,
      String scheduleInfo,
      int credits,
      double attendancePercentage,
      double assignmentMark,
      double midtermMark,
      double finalMark,
      double totalMark,
      String gradeLetter
  ) {
  }

  public record AnnouncementRecord(
      int id,
      String title,
      LocalDate publishDate,
      String priority,
      String description
  ) {
  }

  public record RegistrationData(
      String firstName,
      String lastName,
      String username,
      String mobileNo,
      LocalDate dateOfBirth,
      String emailId,
      String password,
      Integer age,
      String gender,
      String department
  ) {
  }
}
