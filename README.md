<h1 align="center">🎓 GLearnPortalWrapper</h1>
<h3 align="center">Full-Stack Academic Portal System • Grades • Attendance • Authentication</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Java-Servlets-orange?logo=java" />
  <img src="https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-blue" />
  <img src="https://img.shields.io/badge/Database-MySQL-green?logo=mysql" />
  <img src="https://img.shields.io/badge/Server-Tomcat-red" />
  <img src="https://img.shields.io/badge/Architecture-3--Tier-purple" />
  <img src="https://img.shields.io/badge/Status-Full%20Stack-brightgreen" />
</p>

---

## 📖 Project Overview

Modern university portals are not just websites — they are **complete information systems**.

**GLearnPortalWrapper** is a **full-stack academic portal system** inspired by GITAM University's G-Learn platform, designed and implemented as part of a Web Application Development case study.

This project demonstrates **end-to-end integration** of:

- Frontend (HTML, CSS, JavaScript)
- Backend (Java Servlets)
- Database (MySQL with JDBC)
- Deployment (Apache Tomcat)
- Data exchange (XML)

The system enables students to **register, authenticate, and access personalized academic data**, including grades, SGPA/CGPA, and attendance — all backed by a persistent relational database.

📄 Full case study report: :contentReference[oaicite:0]{index=0}

---

## 🎯 Problem Statement

The objective was to build a **functional wrapper of the G-Learn portal** that:

- Supports **student registration and login**
- Displays **course grades, SGPA, CGPA**
- Provides a **dedicated attendance module**
- Uses **MySQL for persistent storage**
- Integrates **HTML, CSS, JS, XML, Servlets, Tomcat, JDBC**

👉 The key challenge:

> Moving from a **static UI** → to a **fully integrated system** where frontend, backend, and database work together seamlessly.

---

## 🧠 Evolution of Architecture (Key Highlight)

### ❌ Initial Approach (Outdated)
- JSP-based rendering
- XAMPP + Tomcat setup
- Eclipse IDE workflow
- Tight coupling between UI and backend

### ✅ Final Approach (Production-Aligned)
- Clean separation of concerns
- HTML/CSS/JS frontend
- Java Servlets backend
- JDBC for database access
- MySQL for persistence
- XML for structured data exchange

📌 As highlighted in the report (Page 2–3):  
The shift from JSP-heavy design to a **Servlet + JDBC architecture** improved maintainability and aligned with **modern engineering practices**.

---

## 🏗️ System Architecture

### 3-Tier Architecture

```
Frontend (HTML/CSS/JS)
        ↓
Servlet Backend (Java + Tomcat)
        ↓
Database (MySQL via JDBC)
```

### Layers Explained

#### 🖥️ Presentation Layer
- HTML pages (Login, Register, Dashboard, Attendance, Grades)
- Styled with CSS
- Dynamic updates using JavaScript

#### ⚙️ Application Layer
- Java Servlets handle:
  - Authentication
  - Session management
  - Data processing
  - API-like responses

#### 🗄️ Data Layer
- MySQL database
- Accessed via JDBC
- Stores:
  - Students
  - Course records
  - Attendance
  - Announcements

---

## ⚡ Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Java Servlets
- Apache Tomcat

### Database
- MySQL
- JDBC

### Configuration & Data
- XML (`web.xml`, data feeds)

---

## 🔥 Core Features

### 🔐 Registration Module
- New users create accounts
- Stores:
  - Name, roll number, email, password, etc.
- Data persisted in MySQL

---

### 🔑 Authentication Module
- Login validation via database
- Session-based authentication
- Secure password handling (hashed)

---

### 📊 Dashboard Module
Displays:

- Student profile
- SGPA & CGPA
- Semester details
- Course count
- Announcements
- Academic summary

---

### 📚 Courses & Grades Module
Includes:

- Course code & title
- Instructor & credits
- Assignment / Mid / Final marks
- Total marks & grade
- Marks update functionality

---

### 📈 Attendance Module
Provides:

- Overall attendance %
- Course-wise attendance
- Status indicators
- Attendance update feature

---

## 🧾 Database Design

### Tables

- `portal_students`
- `portal_course_records`
- `portal_announcements`

### Design Highlights

- Normalized schema
- One-to-many relationships (student → courses)
- Persistent and scalable structure

---

## 🔗 Use of XML

XML was used meaningfully in:

- `web.xml` for servlet configuration
- XML-based responses for:
  - Courses
  - Announcements
- Client-side parsing using JavaScript

---

## 🚧 Challenges Faced

### 1. Architecture Transition
Moving from JSP → Servlets required restructuring the entire system.

### 2. Technology Integration
Combining:
- HTML
- CSS
- JavaScript
- XML
- Servlets
- JDBC
- MySQL

👉 The real difficulty was **integration**, not individual tools.

### 3. Session Management
Ensuring each user only sees **their own data**.

### 4. Data Consistency
Keeping registration, login, grades, and attendance synced.

---

## 📊 Key Outcomes

This project successfully:

- Implements **full-stack architecture**
- Demonstrates **real-world system design**
- Enables **dynamic data-driven UI**
- Uses **persistent database storage**
- Fulfills all case study requirements

📌 As stated in the report (Page 10):  
The project shows how **complete web applications are built across layers, not as isolated components**.

---

## 📚 Key Learning Outcomes

- Full-stack development = **integration**
- Servlets remain powerful when used correctly
- JSP-heavy workflows are outdated for modern systems
- JDBC provides fine-grained database control
- MySQL is ideal for structured academic data
- XML still plays a role in Java-based systems

---

## 🚀 Future Scope

This system can be extended with:

- 👨‍🏫 Faculty/admin dashboards  
- 🔐 Role-based access control  
- 📩 Real-time notifications  
- 📄 PDF report generation  
- 📊 Advanced analytics  
- ☁️ Cloud deployment (AWS/GCP)  
- 🔄 REST APIs (JSON-based)

---

## 🛠️ How to Run

### 1. Clone Repo
```bash
git clone https://github.com/your-username/GLearnPortalWrapper.git
cd GLearnPortalWrapper
```

### 2. Setup MySQL
- Create database
- Import schema
- Update credentials in JDBC config

### 3. Run on Tomcat
- Deploy project
- Start server

### 4. Access
```
http://localhost:8080/
```

---

## 👤 Author

<p align="center">
  <b>Mitra Boga</b><br><br>
  <a href="https://www.linkedin.com/in/bogamitra/">
    <img src="https://img.shields.io/badge/LinkedIn-Mitra%20Boga-blue?style=for-the-badge&logo=linkedin"/>
  </a>
  <a href="https://x.com/techtraboga">
    <img src="https://img.shields.io/badge/X-@techtraboga-black?style=for-the-badge&logo=twitter"/>
  </a>
</p>

Frontend + Backend + Database — working together.

That’s what makes this **full-stack.**
