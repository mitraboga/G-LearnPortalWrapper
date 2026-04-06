# G-Learn Portal Wrapper

Web Application Development case study project implementing a GITAM University G-Learn style academic portal wrapper.

![G-Learn Portal Preview](assets/GLearn_Wrapper_Preview.gif)

## Overview

This project is a full-stack academic portal system built around the course topics covered in Web Application Development:

- HTML, CSS, JavaScript
- Java Servlets
- Apache Tomcat
- JDBC
- MySQL
- XML

It started as a JSP and XAMPP Tomcat prototype in Eclipse, then was reworked into a cleaner servlet-driven architecture with MySQL-backed persistence and a modern frontend wrapper. The final system supports student registration, login, dashboard access, grades, SGPA, CGPA, and attendance.

## Features

- Student registration and login
- Dashboard with SGPA, CGPA, courses, and announcements
- Courses and grades view
- Attendance view with overall and course-wise percentages
- MySQL-backed student, course, and announcement records
- GitHub Pages static demo under `docs/`

## Architecture

```text
Frontend (HTML/CSS/JS)
        ->
Servlet Backend (Java + Tomcat)
        ->
Database (MySQL via JDBC)
```

## Database

The servlet app uses the `studentdb` schema by default with the following main tables:

- `portal_students`
- `portal_course_records`
- `portal_announcements`

## Run Locally

1. Ensure MySQL is running.
2. From the project root, run:

```powershell
.\run-java-app.bat
```

3. Open:

```text
http://localhost:500/
```

## GitHub Pages Demo

The repository also includes a static GitHub Pages build in `docs/`. This is a frontend demo of the same portal UI and flows using browser local storage, because GitHub Pages does not run Java/Tomcat/MySQL backends.

Expected Pages URL after deployment:

```text
https://mitraboga.github.io/G-LearnPortalWrapper/
```

## Main Application Paths

- `src/main/java`
- `src/main/webapp`
- `src/main/webapp/WEB-INF/web.xml`
- `docs`
- `.github/workflows/deploy-pages.yml`

## Notes

- The older Express prototype is intentionally disabled in `server.js`.
- The Java servlet app creates and uses the `studentdb` schema by default.
- `docs/` is the GitHub Pages-compatible static wrapper of the live servlet app.
