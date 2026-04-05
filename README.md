# G-Learn Portal Wrapper

Web Application Development case study project implementing a GITAM University G-Learn style academic portal wrapper.

## Stack

- HTML, CSS, JavaScript
- Java Servlets
- Embedded Tomcat
- JDBC
- MySQL
- XML

## Features

- Student registration and login
- Dashboard with SGPA, CGPA, courses, and announcements
- Courses and grades view
- Attendance view with overall and course-wise percentages
- MySQL-backed student, course, and announcement records

## Run

1. Ensure MySQL is running.
2. From the project root, run:

```powershell
.\run-java-app.bat
```

3. Open:

```text
http://localhost:500/
```

## Main Application Paths

- `src/main/java`
- `src/main/webapp`
- `src/main/webapp/WEB-INF/web.xml`

## Notes

- The older Express prototype is intentionally disabled in `server.js`.
- The Java servlet app creates and uses the `studentdb` schema by default.
