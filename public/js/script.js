const gradePoints = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
};

const assessmentData = {
  CS101: { assignment: 18, midterm: 26, final: 44 },
  MA201: { assignment: 17, midterm: 25, final: 42 },
  EC105: { assignment: 19, midterm: 27, final: 45 },
  UI210: { assignment: 18, midterm: 24, final: 43 },
};

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;

  if (page === "login") {
    await initLoginPage();
    return;
  }

  try {
    const user = await fetchCurrentUser();
    setupShell(user, page);

    if (page === "dashboard") {
      await initDashboardPage();
    }

    if (page === "attendance") {
      await initAttendancePage();
    }

    if (page === "marks") {
      await initMarksPage();
    }
  } catch (_error) {
    window.location.replace("/login?error=Please%20log%20in%20to%20continue.");
  }
});

async function initLoginPage() {
  const form = document.querySelector("[data-login-form]");
  const messageBox = document.getElementById("loginMessage");
  const submitButton = document.querySelector("[data-submit-button]");
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const info = params.get("message");

  if (error) {
    showMessage(messageBox, error, "error");
  } else if (info) {
    showMessage(messageBox, info, "success");
  }

  try {
    await fetchCurrentUser();
    window.location.replace("/dashboard");
    return;
  } catch (_error) {
    // No active session. Stay on the login page.
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = "Signing In...";
    hideMessage(messageBox);

    const formData = new FormData(form);
    const payload = {
      username: String(formData.get("username") || "").trim(),
      password: String(formData.get("password") || "").trim(),
    };

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      window.location.assign("/dashboard");
    } catch (errorObject) {
      showMessage(messageBox, errorObject.message, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Log In";
    }
  });
}

function setupShell(user, page) {
  document.querySelectorAll(".js-user-name").forEach((node) => {
    node.textContent = user.full_name || user.username || "Student";
  });

  const todayNode = document.querySelector(".js-today");
  if (todayNode) {
    todayNode.textContent = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const activeLink = document.querySelector(`[data-nav-link="${page}"]`);
  if (activeLink) {
    activeLink.classList.add("is-active");
  }

  const logoutButton = document.querySelector("[data-logout]");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await fetch("/api/logout", {
          method: "POST",
        });
      } finally {
        window.location.assign("/login?message=You%20have%20been%20logged%20out.");
      }
    });
  }
}

async function initDashboardPage() {
  const [courses, announcements] = await Promise.all([
    loadCourses(),
    loadAnnouncements(),
  ]);

  renderDashboardSummary(courses, announcements);
  renderCourses(courses);
  renderAnnouncements(announcements);
}

async function initAttendancePage() {
  const courses = await loadCourses();
  const summaryNode = document.querySelector("[data-attendance-summary]");
  const tableBody = document.querySelector("[data-attendance-body]");
  const averageAttendance = Math.round(
    courses.reduce((total, course) => total + course.attendance, 0) / courses.length
  );

  summaryNode.innerHTML = [
    createSummaryCard("Average Attendance", `${averageAttendance}%`),
    createSummaryCard(
      "Best Attendance",
      `${Math.max(...courses.map((course) => course.attendance))}%`
    ),
    createSummaryCard(
      "Courses To Monitor",
      `${courses.filter((course) => course.attendance < 85).length}`
    ),
  ].join("");

  tableBody.innerHTML = courses
    .map((course) => {
      const status = getAttendanceStatus(course.attendance);
      return `
        <tr>
          <td>
            <strong>${course.code}</strong><br />
            <span class="meta">${course.title}</span>
          </td>
          <td>${course.instructor}</td>
          <td>${course.schedule}</td>
          <td>${course.attendance}%</td>
          <td><span class="status-badge ${status.className}">${status.label}</span></td>
        </tr>
      `;
    })
    .join("");
}

async function initMarksPage() {
  const courses = await loadCourses();
  const summaryNode = document.querySelector("[data-marks-summary]");
  const tableBody = document.querySelector("[data-marks-body]");
  const gpa = (
    courses.reduce((total, course) => total + (gradePoints[course.grade] || 0), 0) /
    courses.length
  ).toFixed(2);
  const topGrade = courses.reduce((best, course) => {
    if (!best) {
      return course.grade;
    }

    return (gradePoints[course.grade] || 0) > (gradePoints[best] || 0)
      ? course.grade
      : best;
  }, "");

  summaryNode.innerHTML = [
    createSummaryCard("Current GPA", gpa),
    createSummaryCard("Top Grade", topGrade || "A"),
    createSummaryCard("Courses Evaluated", `${courses.length}`),
  ].join("");

  tableBody.innerHTML = courses
    .map((course) => {
      const marks = assessmentData[course.code] || {
        assignment: 16,
        midterm: 24,
        final: 40,
      };
      const total = marks.assignment + marks.midterm + marks.final;

      return `
        <tr>
          <td>
            <strong>${course.code}</strong><br />
            <span class="meta">${course.title}</span>
          </td>
          <td>${marks.assignment}/20</td>
          <td>${marks.midterm}/30</td>
          <td>${marks.final}/50</td>
          <td>${total}/100</td>
          <td><span class="status-badge status-good">${course.grade}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderDashboardSummary(courses, announcements) {
  const summaryNode = document.querySelector("[data-summary-cards]");
  const averageAttendance = Math.round(
    courses.reduce((total, course) => total + course.attendance, 0) / courses.length
  );
  const announcementDate = announcements[0] ? announcements[0].date : "No updates";

  summaryNode.innerHTML = [
    createSummaryCard("Enrolled Courses", `${courses.length}`),
    createSummaryCard("Average Attendance", `${averageAttendance}%`),
    createSummaryCard("Latest Notice", announcementDate),
    createSummaryCard(
      "Strong Grades",
      `${courses.filter((course) => (gradePoints[course.grade] || 0) >= 3.7).length}`
    ),
  ].join("");
}

function renderCourses(courses) {
  const courseList = document.querySelector("[data-course-list]");
  courseList.innerHTML = courses
    .map(
      (course) => `
        <article class="course-card">
          <p class="eyebrow">${course.code}</p>
          <h3>${course.title}</h3>
          <div class="course-meta">
            <span>Instructor: ${course.instructor}</span>
            <span>Schedule: ${course.schedule}</span>
            <span>Credits: ${course.credits}</span>
          </div>
          <span class="pill">Attendance ${course.attendance}%</span>
        </article>
      `
    )
    .join("");
}

function renderAnnouncements(announcements) {
  const list = document.querySelector("[data-announcement-list]");
  list.innerHTML = announcements
    .map(
      (item) => `
        <article class="announcement-item ${item.priority}">
          <h3>${item.title}</h3>
          <p class="meta">${item.date} | Priority: ${item.priority}</p>
          <p>${item.description}</p>
        </article>
      `
    )
    .join("");
}

function createSummaryCard(label, value) {
  return `
    <article class="summary-card">
      <span class="label">${label}</span>
      <span class="value">${value}</span>
    </article>
  `;
}

function getAttendanceStatus(value) {
  if (value >= 90) {
    return { label: "Excellent", className: "status-good" };
  }

  if (value >= 85) {
    return { label: "On Track", className: "status-warning" };
  }

  return { label: "Needs Attention", className: "status-risk" };
}

async function loadCourses() {
  const xmlDocument = await fetchXml("/xml/courses.xml");
  const courseNodes = [...xmlDocument.querySelectorAll("course")];

  return courseNodes.map((node) => ({
    code: node.getAttribute("code") || "COURSE",
    title: getNodeText(node, "title"),
    instructor: getNodeText(node, "instructor"),
    schedule: getNodeText(node, "schedule"),
    credits: Number(getNodeText(node, "credits")) || 0,
    attendance: Number(getNodeText(node, "attendance")) || 0,
    grade: getNodeText(node, "grade") || "B",
  }));
}

async function loadAnnouncements() {
  const xmlDocument = await fetchXml("/xml/annoucements.xml");
  const items = [...xmlDocument.querySelectorAll("announcement")];

  return items.map((node) => ({
    priority: node.getAttribute("priority") || "medium",
    title: getNodeText(node, "title"),
    date: getNodeText(node, "date"),
    description: getNodeText(node, "description"),
  }));
}

async function fetchXml(path) {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  const content = await response.text();
  return new window.DOMParser().parseFromString(content, "application/xml");
}

async function fetchCurrentUser() {
  const response = await fetch("/api/me", {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Authentication required.");
  }

  const result = await response.json();
  return result.user;
}

function getNodeText(parent, selector) {
  return parent.querySelector(selector)?.textContent?.trim() || "";
}

function showMessage(node, message, type) {
  node.textContent = message;
  node.className = `notice notice-${type}`;
}

function hideMessage(node) {
  node.textContent = "";
  node.className = "notice hidden";
}
