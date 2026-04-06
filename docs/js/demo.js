const STORAGE_KEYS = {
  users: "glearn-pages-demo-users",
  session: "glearn-pages-demo-session",
};

const COURSE_TEMPLATE = [
  {
    semesterLabel: "Semester 4",
    current: true,
    code: "WAD401",
    title: "Web Application Development",
    instructor: "Dr. Kavita Sharma",
    schedule: "Mon/Wed 10:00 AM",
    credits: 4,
    attendancePercentage: 92,
    assignmentMark: 18,
    midtermMark: 26,
    finalMark: 44,
  },
  {
    semesterLabel: "Semester 4",
    current: true,
    code: "MAD402",
    title: "Mobile Application Development",
    instructor: "Mr. Vinay Kulkarni",
    schedule: "Tue/Thu 01:00 PM",
    credits: 3,
    attendancePercentage: 87,
    assignmentMark: 17,
    midtermMark: 24,
    finalMark: 42,
  },
  {
    semesterLabel: "Semester 4",
    current: true,
    code: "AI403",
    title: "Applied Artificial Intelligence",
    instructor: "Dr. Sneha Iyer",
    schedule: "Wed/Fri 02:00 PM",
    credits: 4,
    attendancePercentage: 89,
    assignmentMark: 19,
    midtermMark: 25,
    finalMark: 45,
  },
  {
    semesterLabel: "Semester 4",
    current: true,
    code: "PM404",
    title: "Project Management",
    instructor: "Prof. Harish Babu",
    schedule: "Sat 09:30 AM",
    credits: 2,
    attendancePercentage: 84,
    assignmentMark: 16,
    midtermMark: 22,
    finalMark: 38,
  },
];

const HISTORY_TEMPLATE = [
  {
    semesterLabel: "Semester 3",
    current: false,
    code: "DB301",
    title: "Database Management Systems",
    instructor: "Dr. Anita Rao",
    schedule: "Mon/Wed 09:00 AM",
    credits: 4,
    attendancePercentage: 88,
    assignmentMark: 17,
    midtermMark: 25,
    finalMark: 42,
  },
  {
    semesterLabel: "Semester 3",
    current: false,
    code: "CN302",
    title: "Computer Networks",
    instructor: "Prof. Rahul Sen",
    schedule: "Tue/Thu 11:00 AM",
    credits: 3,
    attendancePercentage: 91,
    assignmentMark: 18,
    midtermMark: 24,
    finalMark: 44,
  },
  {
    semesterLabel: "Semester 3",
    current: false,
    code: "SE303",
    title: "Software Engineering",
    instructor: "Ms. Priya Nair",
    schedule: "Fri 10:00 AM",
    credits: 3,
    attendancePercentage: 86,
    assignmentMark: 16,
    midtermMark: 23,
    finalMark: 40,
  },
];

const ANNOUNCEMENTS = [
  {
    priority: "high",
    title: "Internal Assessment Window Opens on April 22",
    date: "2026-04-22",
    description:
      "Carry your ID card and report to the assigned room 15 minutes before the start time.",
  },
  {
    priority: "medium",
    title: "Attendance Lock for April Updates",
    date: "2026-04-11",
    description:
      "Faculty will finalize attendance updates at 6:00 PM. Verify your latest class percentages.",
  },
  {
    priority: "medium",
    title: "Mini Project Review Submission Deadline",
    date: "2026-04-09",
    description:
      "Upload the final presentation deck and source archive before 5:00 PM on Friday.",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  seedDemoUsers();

  const page = document.body.dataset.page || inferPage();

  if (page === "login") {
    initLoginPage();
    return;
  }

  if (page === "register") {
    initRegisterPage();
    return;
  }

  try {
    const me = fetchCurrentUser();
    const courses = loadCourses();

    setupShell(me.user, me.summary);

    if (page === "dashboard") {
      renderDashboard(me.user, me.summary, courses, loadAnnouncements());
    }

    if (page === "attendance") {
      renderAttendance(me.summary, courses);
      bindAttendanceUpdate(courses);
    }

    if (page === "marks") {
      renderMarks(me.summary, courses);
      bindMarksUpdate(courses);
    }
  } catch (_error) {
    redirectTo("login.html?error=Please%20log%20in%20to%20continue.");
  }
});

function inferPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("register.html")) {
    return "register";
  }
  if (path.endsWith("marks.html")) {
    return "marks";
  }
  if (path.endsWith("attendance.html")) {
    return "attendance";
  }
  if (path.endsWith("dashboard.html")) {
    return "dashboard";
  }
  return "login";
}

function initLoginPage() {
  const form = document.querySelector("[data-login-form]");
  const messageBox = document.getElementById("loginMessage");
  const submitButton = document.querySelector("[data-submit-button]");
  const passwordInput = document.getElementById("password");
  const passwordToggle = document.querySelector("[data-password-toggle]");
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const info = params.get("message");

  if (!form || !messageBox || !submitButton) {
    return;
  }

  if (error) {
    showLoginMessage(messageBox, error, "error");
  } else if (info) {
    showLoginMessage(messageBox, info, "success");
  }

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      passwordToggle.innerHTML = `<span class="material-symbols-outlined text-xl">${
        isPassword ? "visibility_off" : "visibility"
      }</span>`;
      passwordToggle.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  const originalButtonMarkup = submitButton.innerHTML;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<span>Signing In...</span><span class="material-symbols-outlined text-lg">progress_activity</span>';
    hideLoginMessage(messageBox);

    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const user = getUsers().find(
      (entry) =>
        entry.username.toLowerCase() === username.toLowerCase() &&
        entry.password === password
    );

    if (!user) {
      showLoginMessage(messageBox, "Invalid username or password.", "error");
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonMarkup;
      return;
    }

    localStorage.setItem(STORAGE_KEYS.session, user.username);
    redirectTo("dashboard.html");
  });
}

function initRegisterPage() {
  const form = document.querySelector("[data-register-form]");
  const messageNode = document.getElementById("formMessage");
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  if (!form || !messageNode) {
    return;
  }

  if (error) {
    messageNode.textContent = error;
    messageNode.className =
      "mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (typeof window.validateRegistrationForm === "function" && !window.validateRegistrationForm()) {
      return;
    }

    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const users = getUsers();

    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      messageNode.textContent = "That Roll No. / Username is already registered.";
      messageNode.className =
        "mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700";
      return;
    }

    const nextId = users.reduce((maxId, user) => Math.max(maxId, user.id), 0) + 1;
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const newUser = {
      id: nextId,
      username,
      password: String(formData.get("password") || ""),
      fullName: `${firstName} ${lastName}`.trim(),
      department: "Computer Science and Engineering",
      firstName,
      lastName,
      mobileNo: String(formData.get("mobileNo") || "").trim(),
      dateOfBirth: String(formData.get("dateOfBirth") || "").trim(),
      emailId: String(formData.get("emailId") || "").trim(),
      age: Number(formData.get("age") || 0),
      gender: String(formData.get("gender") || "").trim(),
      currentSemester: "Semester 4",
      courses: createCoursesForSeed(nextId),
      history: createHistoryForSeed(nextId),
    };

    users.push(newUser);
    saveUsers(users);
    redirectTo("login.html?message=Registration%20successful.%20Log%20in%20with%20your%20new%20account.");
  });
}

function setupShell(user, summary) {
  document.querySelectorAll(".js-user-name").forEach((node) => {
    node.textContent = user.fullName;
  });

  document.querySelectorAll(".js-department").forEach((node) => {
    node.textContent = user.department;
  });

  document.querySelectorAll(".js-current-semester").forEach((node) => {
    node.textContent = summary.currentSemester;
  });

  document.querySelectorAll(".js-username").forEach((node) => {
    node.textContent = user.username;
  });

  document.querySelectorAll("[data-logout]").forEach((button) => {
    if (button.dataset.logoutBound === "true") {
      return;
    }

    button.dataset.logoutBound = "true";
    button.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.session);
      redirectTo("login.html?message=You%20have%20been%20logged%20out.");
    });
  });
}

function renderDashboard(_user, summary, courses, announcements) {
  const metrics = document.querySelector("[data-dashboard-metrics]");
  const courseList = document.querySelector("[data-dashboard-course-list]");
  const highlight = document.querySelector("[data-dashboard-highlight]");
  const announcementList = document.querySelector("[data-dashboard-announcement-list]");
  const topCourse = getTopCourse(courses, (course) => course.totalMark);
  const averageTotal = average(courses.map((course) => course.totalMark));

  if (metrics) {
    metrics.innerHTML = [
      createDashboardMetricCard("SGPA", summary.sgpa.toFixed(2), "Current semester performance", "school"),
      createDashboardMetricCard("CGPA", summary.cgpa.toFixed(2), "Overall academic average", "workspace_premium"),
      createDashboardMetricCard(
        "Attendance",
        `${formatNumber(summary.overallAttendance)}%`,
        "Average across current courses",
        "fact_check"
      ),
      createDashboardMetricCard("Courses", `${courses.length}`, summary.currentSemester, "grid_view"),
    ].join("");
  }

  if (courseList) {
    courseList.innerHTML =
      courses
        .map((course) => {
          const attendanceStatus = getAttendanceStatus(course.attendancePercentage);
          const gradeClasses = getGradePillClasses(course.gradeLetter);

          return `
            <article class="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">${escapeHtml(course.code)}</p>
                  <h3 class="mt-1 text-lg font-bold text-on-surface">${escapeHtml(course.title)}</h3>
                </div>
                <span class="rounded-full px-3 py-1 text-xs font-bold ${gradeClasses}">
                  ${escapeHtml(course.gradeLetter)}
                </span>
              </div>
              <div class="mt-4 space-y-2 text-sm text-on-surface-variant">
                <p><span class="font-semibold text-on-surface">Faculty:</span> ${escapeHtml(course.instructor)}</p>
                <p><span class="font-semibold text-on-surface">Schedule:</span> ${escapeHtml(course.schedule)}</p>
                <p><span class="font-semibold text-on-surface">Credits:</span> ${course.credits} | <span class="font-semibold text-on-surface">Total:</span> ${formatNumber(course.totalMark)}/100</p>
              </div>
              <div class="mt-5 flex items-center justify-between gap-3">
                <span class="text-sm font-bold text-primary">Attendance ${formatNumber(course.attendancePercentage)}%</span>
                <span class="rounded-full px-3 py-1 text-[10px] font-bold uppercase ${attendanceStatus.pillClass}">
                  ${attendanceStatus.label}
                </span>
              </div>
            </article>
          `;
        })
        .join("") ||
      '<article class="rounded-2xl border border-surface-container-high bg-white p-5 text-sm text-on-surface-variant shadow-sm">No current courses found for this student.</article>';
  }

  if (highlight) {
    if (topCourse) {
      highlight.innerHTML = `
        <div class="relative z-10">
          <span class="text-xs font-bold uppercase tracking-widest text-white/70">Top Performing Course</span>
          <h3 class="mt-3 text-2xl font-extrabold tracking-tight">${escapeHtml(topCourse.title)}</h3>
          <p class="mt-2 text-sm text-white/80">${escapeHtml(topCourse.code)} &bull; Grade ${escapeHtml(
            topCourse.gradeLetter
          )}</p>
          <div class="mt-6 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-white/10 p-4">
              <p class="text-[10px] font-bold uppercase tracking-widest text-white/60">Total</p>
              <p class="mt-2 text-2xl font-black">${formatNumber(topCourse.totalMark)}</p>
            </div>
            <div class="rounded-xl bg-white/10 p-4">
              <p class="text-[10px] font-bold uppercase tracking-widest text-white/60">Attendance</p>
              <p class="mt-2 text-2xl font-black">${formatNumber(topCourse.attendancePercentage)}%</p>
            </div>
          </div>
          <p class="mt-5 text-sm text-white/80">
            Semester average: ${formatNumber(averageTotal)}/100. Best course records are highlighted here for quick review.
          </p>
        </div>
        <div class="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-teal-600/30 blur-3xl"></div>
      `;
    } else {
      highlight.innerHTML =
        '<div class="relative z-10"><span class="text-xs font-bold uppercase tracking-widest text-white/70">Top Performing Course</span><p class="mt-3 text-sm text-white/80">Course performance will appear here after records are loaded.</p></div>';
    }
  }

  if (announcementList) {
    announcementList.innerHTML =
      announcements
        .map((item) => {
          const accent = getAnnouncementClasses(item.priority);
          return `
            <article class="rounded-xl border bg-white p-5 shadow-sm ${accent.border}">
              <div class="mb-3 flex items-center justify-between gap-3">
                <span class="rounded-full px-3 py-1 text-[10px] font-bold uppercase ${accent.badge}">
                  ${escapeHtml(item.priority)}
                </span>
                <span class="text-xs font-semibold text-on-surface-variant">${escapeHtml(formatDateLabel(item.date))}</span>
              </div>
              <h3 class="text-lg font-bold text-on-surface">${escapeHtml(item.title)}</h3>
              <p class="mt-2 text-sm leading-relaxed text-on-surface-variant">${escapeHtml(item.description)}</p>
            </article>
          `;
        })
        .join("") ||
      '<article class="rounded-xl border border-surface-container-high bg-white p-5 text-sm text-on-surface-variant shadow-sm">No announcements are available right now.</article>';
  }
}

function renderMarks(summary, courses) {
  const averageTotal = average(courses.map((course) => course.totalMark));
  const averageAssignment = average(courses.map((course) => course.assignmentMark));
  const topCourse = getTopCourse(courses, (course) => course.totalMark);
  const overallGrade = calculateGradeLetter(averageTotal);
  const assignmentBody = document.querySelector("[data-marks-assignment-body]");
  const resultsBody = document.querySelector("[data-marks-results-body]");

  setText("[data-marks-overall-grade]", overallGrade);
  setText(
    "[data-marks-overall-caption]",
    topCourse
      ? `Strongest course: ${topCourse.code} ${topCourse.title}`
      : "Course performance will appear here."
  );
  setText("[data-marks-attendance-value]", `${formatNumber(summary.overallAttendance)}%`);
  setText(
    "[data-marks-attendance-copy]",
    `Average attendance across ${courses.length || 0} current courses.`
  );
  setStyleWidth("[data-marks-attendance-bar]", summary.overallAttendance);
  setText("[data-marks-average-total]", formatNumber(averageTotal));
  setText(
    "[data-marks-average-caption]",
    `SGPA ${summary.sgpa.toFixed(2)} | CGPA ${summary.cgpa.toFixed(2)}`
  );
  setText("[data-marks-assignment-average]", formatNumber(averageAssignment));
  setText("[data-marks-results-average]", formatNumber(averageTotal));
  setText("[data-marks-results-grade]", overallGrade);

  if (assignmentBody) {
    assignmentBody.innerHTML =
      courses
        .map((course) => `
          <tr class="transition-colors hover:bg-surface-container-low/50">
            <td class="px-6 py-4">
              <div class="font-bold text-on-surface">${escapeHtml(course.title)}</div>
              <div class="text-[10px] text-on-surface-variant">${escapeHtml(course.code)}</div>
            </td>
            <td class="px-6 py-4 text-sm text-on-surface-variant">
              ${escapeHtml(course.instructor)}<br />
              <span class="text-[10px]">${escapeHtml(course.schedule)}</span>
            </td>
            <td class="px-6 py-4 text-center text-sm font-semibold">20.00</td>
            <td class="px-6 py-4 text-center text-sm font-bold text-primary">${formatNumber(
              course.assignmentMark
            )}</td>
            <td class="px-6 py-4 text-right">
              <span class="rounded px-2 py-1 text-[10px] font-bold bg-teal-100 text-teal-800">RELEASED</span>
            </td>
          </tr>
        `)
        .join("") ||
      '<tr><td class="px-6 py-4 text-sm text-on-surface-variant" colspan="5">No marks data is available.</td></tr>';
  }

  if (resultsBody) {
    resultsBody.innerHTML =
      courses
        .map((course) => `
          <tr class="transition-colors hover:bg-surface-container-low/50">
            <td class="px-6 py-4">
              <div class="font-bold text-on-surface">${escapeHtml(course.title)}</div>
              <div class="text-[10px] text-on-surface-variant">${escapeHtml(course.code)}</div>
            </td>
            <td class="px-6 py-4 text-center text-sm">${formatNumber(course.midtermMark)}/30</td>
            <td class="px-6 py-4 text-center text-sm">${formatNumber(course.finalMark)}/50</td>
            <td class="px-6 py-4 text-center text-sm font-bold text-tertiary">${formatNumber(
              course.totalMark
            )}/100</td>
            <td class="px-6 py-4 text-center">
              <span class="rounded-full px-3 py-1 text-[10px] font-bold ${getGradePillClasses(
                course.gradeLetter
              )}">
                ${escapeHtml(course.gradeLetter)}
              </span>
            </td>
            <td class="px-6 py-4 text-right text-sm font-semibold">${course.credits}</td>
          </tr>
        `)
        .join("") ||
      '<tr><td class="px-6 py-4 text-sm text-on-surface-variant" colspan="6">No semester results are available.</td></tr>';
  }

  const bestCourseNode = document.querySelector("[data-marks-best-course]");
  if (bestCourseNode) {
    if (topCourse) {
      bestCourseNode.innerHTML = `
        <div class="flex gap-4">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span class="material-symbols-outlined text-3xl">workspace_premium</span>
          </div>
          <div>
            <p class="text-sm font-bold text-on-surface">${escapeHtml(topCourse.title)}</p>
            <p class="mb-3 text-xs text-on-surface-variant">${escapeHtml(topCourse.code)} | ${escapeHtml(
              topCourse.instructor
            )}</p>
            <p class="text-xs leading-relaxed text-on-surface-variant">
              Highest current total: ${formatNumber(topCourse.totalMark)}/100 with attendance at
              ${formatNumber(topCourse.attendancePercentage)}%. This course is currently leading the semester profile.
            </p>
          </div>
        </div>
      `;
    } else {
      bestCourseNode.innerHTML =
        '<p class="text-sm text-on-surface-variant">Performance insights will appear once course records are available.</p>';
    }
  }
}

function renderAttendance(summary, courses) {
  const tableBody = document.querySelector("[data-attendance-body]");
  const bestAttendanceCourse = getTopCourse(courses, (course) => course.attendancePercentage);
  const courseCount = courses.length;
  const aboveThreshold = courses.filter((course) => course.attendancePercentage >= 75).length;
  const alertCount = courses.filter((course) => course.attendancePercentage < 75).length;

  setText("[data-attendance-overall]", `${formatNumber(summary.overallAttendance)}%`);
  setText("[data-attendance-course-count]", `${courseCount}`);
  setText("[data-attendance-good-count]", `${aboveThreshold}`);
  setText(
    "[data-attendance-best-course]",
    bestAttendanceCourse
      ? `${bestAttendanceCourse.code} | ${formatNumber(bestAttendanceCourse.attendancePercentage)}%`
      : "No attendance data"
  );
  setText(
    "[data-attendance-alert-count]",
    alertCount === 0 ? "All courses above 75%" : `${alertCount} course(s) below 75%`
  );
  setText(
    "[data-attendance-semester-copy]",
    `${summary.currentSemester} average: ${formatNumber(summary.overallAttendance)}%`
  );
  updateGauge("[data-attendance-gauge]", summary.overallAttendance);

  if (tableBody) {
    tableBody.innerHTML =
      courses
        .map((course) => {
          const status = getAttendanceStatus(course.attendancePercentage);
          return `
            <tr class="transition-colors hover:bg-surface-container-low">
              <td class="px-6 py-5">
                <div class="flex flex-col">
                  <span class="text-sm font-bold">${escapeHtml(course.title)}</span>
                  <span class="text-xs text-on-surface-variant">${escapeHtml(course.code)} | ${escapeHtml(
                    course.instructor
                  )}</span>
                </div>
              </td>
              <td class="px-6 py-5">
                <span class="rounded-full px-2 py-1 text-[10px] font-bold uppercase ${status.pillClass}">
                  ${status.label}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div class="h-full rounded-full ${status.barClass}" style="width: ${clampPercent(
                    course.attendancePercentage
                  )}%"></div>
                </div>
              </td>
              <td class="px-6 py-5 text-right font-bold ${status.valueClass}">
                ${formatNumber(course.attendancePercentage)}%
              </td>
            </tr>
          `;
        })
        .join("") ||
      '<tr><td class="px-6 py-5 text-sm text-on-surface-variant" colspan="4">No attendance data is available.</td></tr>';
  }
}

function bindAttendanceUpdate(courses) {
  const form = document.querySelector("[data-attendance-form]");
  const select = document.querySelector("[data-attendance-course]");
  const messageNode = document.querySelector("[data-attendance-message]");

  if (!form || !select) {
    return;
  }

  select.innerHTML = courses
    .map(
      (course) => `<option value="${course.id}">${escapeHtml(course.code)} - ${escapeHtml(
        course.title
      )}</option>`
    )
    .join("");

  if (!courses.length) {
    return;
  }

  select.addEventListener("change", () => populateAttendanceForm(select.value, courses, form));
  populateAttendanceForm(select.value || courses[0].id, courses, form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const courseId = String(formData.get("courseId") || "");
    const nextPercentage = clampValue(formData.get("attendancePercentage"), 0, 100);
    const updatedCourse = updateCourseRecord(courseId, (course) => {
      course.attendancePercentage = nextPercentage;
    });

    if (!updatedCourse) {
      showInlineMessage(messageNode, "Unable to update attendance.", false);
      return;
    }

    const index = courses.findIndex((course) => String(course.id) === String(updatedCourse.id));
    if (index >= 0) {
      courses[index] = updatedCourse;
    }

    const me = fetchCurrentUser();
    renderAttendance(me.summary, courses);
    populateAttendanceForm(updatedCourse.id, courses, form);
    select.value = String(updatedCourse.id);
    showInlineMessage(
      messageNode,
      `Attendance updated for ${updatedCourse.code} to ${formatNumber(updatedCourse.attendancePercentage)}%.`,
      true
    );
  });
}

function bindMarksUpdate(courses) {
  const form = document.querySelector("[data-marks-form]");
  const select = document.querySelector("[data-marks-course]");
  const messageNode = document.querySelector("[data-marks-message]");

  if (!form || !select) {
    return;
  }

  select.innerHTML = courses
    .map(
      (course) => `<option value="${course.id}">${escapeHtml(course.code)} - ${escapeHtml(
        course.title
      )}</option>`
    )
    .join("");

  if (!courses.length) {
    return;
  }

  select.addEventListener("change", () => populateMarksForm(select.value, courses, form));
  populateMarksForm(select.value || courses[0].id, courses, form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const courseId = String(formData.get("courseId") || "");
    const updatedCourse = updateCourseRecord(courseId, (course) => {
      course.assignmentMark = clampValue(formData.get("assignmentMark"), 0, 20);
      course.midtermMark = clampValue(formData.get("midtermMark"), 0, 30);
      course.finalMark = clampValue(formData.get("finalMark"), 0, 50);
    });

    if (!updatedCourse) {
      showInlineMessage(messageNode, "Unable to update marks.", false);
      return;
    }

    const index = courses.findIndex((course) => String(course.id) === String(updatedCourse.id));
    if (index >= 0) {
      courses[index] = updatedCourse;
    }

    const me = fetchCurrentUser();
    renderMarks(me.summary, courses);
    populateMarksForm(updatedCourse.id, courses, form);
    select.value = String(updatedCourse.id);
    showInlineMessage(
      messageNode,
      `Marks updated for ${updatedCourse.code}. Total is now ${formatNumber(updatedCourse.totalMark)}/100.`,
      true
    );
  });
}

function populateAttendanceForm(courseId, courses, form) {
  const selectedCourse = courses.find((course) => String(course.id) === String(courseId));
  if (!selectedCourse) {
    return;
  }

  form.elements.attendancePercentage.value = formatNumber(selectedCourse.attendancePercentage);
}

function populateMarksForm(courseId, courses, form) {
  const selectedCourse = courses.find((course) => String(course.id) === String(courseId));
  if (!selectedCourse) {
    return;
  }

  form.elements.assignmentMark.value = formatNumber(selectedCourse.assignmentMark);
  form.elements.midtermMark.value = formatNumber(selectedCourse.midtermMark);
  form.elements.finalMark.value = formatNumber(selectedCourse.finalMark);
}

function fetchCurrentUser() {
  const user = getCurrentUserRecord();
  if (!user) {
    throw new Error("Authentication required.");
  }

  return {
    success: true,
    user,
    summary: buildSummary(user),
  };
}

function loadCourses() {
  const user = getCurrentUserRecord();
  if (!user) {
    throw new Error("Authentication required.");
  }

  return user.courses.map((course) => normalizeCourse(course));
}

function loadAnnouncements() {
  return ANNOUNCEMENTS.map((item) => ({ ...item }));
}

function seedDemoUsers() {
  const existingUsers = getUsers();
  if (existingUsers.length) {
    return;
  }

  saveUsers([
    createDemoUser({
      id: 1,
      username: "student1",
      password: "password123",
      fullName: "Mitra Boga",
      department: "Computer Science and Engineering",
      emailId: "mboga@gitam.in",
      mobileNo: "9876543210",
      dateOfBirth: "2004-03-16",
      age: 22,
      gender: "Female",
      seed: 1,
    }),
    createDemoUser({
      id: 2,
      username: "case2026",
      password: "CaseStudy123",
      fullName: "Case Study Student",
      department: "Computer Science and Engineering",
      emailId: "case2026@gitam.in",
      mobileNo: "9123456780",
      dateOfBirth: "2003-11-02",
      age: 22,
      gender: "Male",
      seed: 2,
    }),
  ]);
}

function createDemoUser(details) {
  return {
    id: details.id,
    username: details.username,
    password: details.password,
    fullName: details.fullName,
    department: details.department,
    firstName: details.fullName.split(" ")[0] || details.fullName,
    lastName: details.fullName.split(" ").slice(1).join(" "),
    mobileNo: details.mobileNo,
    dateOfBirth: details.dateOfBirth,
    emailId: details.emailId,
    age: details.age,
    gender: details.gender,
    currentSemester: "Semester 4",
    courses: createCoursesForSeed(details.seed),
    history: createHistoryForSeed(details.seed),
  };
}

function createCoursesForSeed(seed) {
  const variants = [
    [
      { assignment: 0, midterm: 0, final: 0, attendance: 0 },
      { assignment: 0, midterm: 1, final: -1, attendance: -1 },
      { assignment: 1, midterm: 0, final: 0, attendance: 1 },
      { assignment: 0, midterm: -1, final: 0, attendance: 0 },
    ],
    [
      { assignment: -1, midterm: 0, final: 1, attendance: -2 },
      { assignment: 1, midterm: 1, final: 0, attendance: 0 },
      { assignment: 0, midterm: -1, final: 1, attendance: 2 },
      { assignment: -1, midterm: 0, final: -1, attendance: -3 },
    ],
    [
      { assignment: 0, midterm: -2, final: 0, attendance: -1 },
      { assignment: -1, midterm: 0, final: -2, attendance: -2 },
      { assignment: 1, midterm: 1, final: 0, attendance: 1 },
      { assignment: 0, midterm: -1, final: 1, attendance: 0 },
    ],
  ];
  const profile = variants[Math.abs(seed - 1) % variants.length];

  return COURSE_TEMPLATE.map((course, index) => {
    const drift = profile[index % profile.length];
    return normalizeCourse({
      ...course,
      id: seed * 100 + index + 1,
      attendancePercentage: clampValue(course.attendancePercentage + drift.attendance, 0, 100),
      assignmentMark: clampValue(course.assignmentMark + drift.assignment, 0, 20),
      midtermMark: clampValue(course.midtermMark + drift.midterm, 0, 30),
      finalMark: clampValue(course.finalMark + drift.final, 0, 50),
    });
  });
}

function createHistoryForSeed(seed) {
  const variants = [
    [
      { assignment: 0, midterm: 0, final: 0, attendance: 0 },
      { assignment: 0, midterm: -1, final: 1, attendance: 1 },
      { assignment: 1, midterm: 0, final: -1, attendance: -1 },
    ],
    [
      { assignment: -1, midterm: 1, final: 0, attendance: -1 },
      { assignment: 0, midterm: 0, final: 0, attendance: 0 },
      { assignment: 0, midterm: -1, final: 1, attendance: 1 },
    ],
    [
      { assignment: 0, midterm: -1, final: 0, attendance: 0 },
      { assignment: 1, midterm: 0, final: 1, attendance: -2 },
      { assignment: -1, midterm: 1, final: 0, attendance: 1 },
    ],
  ];
  const profile = variants[Math.abs(seed - 1) % variants.length];

  return HISTORY_TEMPLATE.map((course, index) => {
    const drift = profile[index % profile.length];
    return normalizeCourse({
      ...course,
      id: seed * 1000 + index + 1,
      attendancePercentage: clampValue(course.attendancePercentage + drift.attendance, 0, 100),
      assignmentMark: clampValue(course.assignmentMark + drift.assignment, 0, 20),
      midtermMark: clampValue(course.midtermMark + drift.midterm, 0, 30),
      finalMark: clampValue(course.finalMark + drift.final, 0, 50),
    });
  });
}

function buildSummary(record) {
  const currentCourses = Array.isArray(record.courses)
    ? record.courses.map((course) => normalizeCourse(course))
    : [];
  const historyCourses = Array.isArray(record.history)
    ? record.history.map((course) => normalizeCourse(course))
    : [];
  const allCourses = [...historyCourses, ...currentCourses];

  return {
    currentSemester: record.currentSemester || currentCourses[0]?.semesterLabel || "Semester 4",
    sgpa: calculateGpa(currentCourses),
    cgpa: calculateGpa(allCourses),
    overallAttendance: roundTwo(average(currentCourses.map((course) => course.attendancePercentage))),
  };
}

function calculateGpa(courses) {
  if (!courses.length) {
    return 0;
  }

  const totals = courses.reduce(
    (accumulator, course) => {
      const credits = Number(course.credits) || 0;
      accumulator.credits += credits;
      accumulator.points += getGradePoint(course.gradeLetter) * credits;
      return accumulator;
    },
    { credits: 0, points: 0 }
  );

  if (!totals.credits) {
    return 0;
  }

  return roundTwo(totals.points / totals.credits);
}

function getGradePoint(letter) {
  switch (letter) {
    case "A+":
      return 10;
    case "A":
      return 9;
    case "B+":
      return 8;
    case "B":
      return 7;
    case "C+":
      return 6;
    case "C":
      return 5;
    default:
      return 0;
  }
}

function updateCourseRecord(courseId, mutate) {
  const username = localStorage.getItem(STORAGE_KEYS.session);
  if (!username) {
    return null;
  }

  const users = getUsers();
  const userIndex = users.findIndex(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
  if (userIndex === -1) {
    return null;
  }

  const courseIndex = users[userIndex].courses.findIndex(
    (course) => String(course.id) === String(courseId)
  );
  if (courseIndex === -1) {
    return null;
  }

  const workingCourse = { ...users[userIndex].courses[courseIndex] };
  mutate(workingCourse);
  users[userIndex].courses[courseIndex] = normalizeCourse(workingCourse);
  saveUsers(users);
  return { ...users[userIndex].courses[courseIndex] };
}

function getCurrentUserRecord() {
  const username = localStorage.getItem(STORAGE_KEYS.session);
  if (!username) {
    return null;
  }

  const user = getUsers().find(
    (entry) => entry.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) {
    return null;
  }

  return {
    ...user,
    courses: user.courses.map((course) => normalizeCourse(course)),
    history: Array.isArray(user.history) ? user.history.map((course) => normalizeCourse(course)) : [],
  };
}

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.users);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function normalizeCourse(course) {
  const assignmentMark = clampValue(course.assignmentMark, 0, 20);
  const midtermMark = clampValue(course.midtermMark, 0, 30);
  const finalMark = clampValue(course.finalMark, 0, 50);
  const totalMark = roundTwo(assignmentMark + midtermMark + finalMark);

  return {
    ...course,
    assignmentMark,
    midtermMark,
    finalMark,
    totalMark,
    gradeLetter: calculateGradeLetter(totalMark),
    attendancePercentage: roundTwo(clampValue(course.attendancePercentage, 0, 100)),
  };
}

function createDashboardMetricCard(label, value, copy, icon) {
  return `
    <article class="rounded-xl border border-transparent bg-surface-container-lowest p-6 shadow-sm">
      <div class="flex items-start justify-between">
        <span class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">${escapeHtml(
          label
        )}</span>
        <div class="rounded-lg bg-primary/10 p-2">
          <span class="material-symbols-outlined text-primary">${escapeHtml(icon)}</span>
        </div>
      </div>
      <div class="mt-5">
        <h3 class="text-4xl font-extrabold tracking-tight text-primary">${escapeHtml(value)}</h3>
        <p class="mt-2 text-sm text-on-surface-variant">${escapeHtml(copy)}</p>
      </div>
    </article>
  `;
}

function getAttendanceStatus(value) {
  if (value >= 85) {
    return {
      label: "Good",
      pillClass: "bg-green-100 text-green-700",
      barClass: "bg-primary",
      valueClass: "text-primary",
    };
  }

  if (value >= 75) {
    return {
      label: "Average",
      pillClass: "bg-tertiary-fixed text-tertiary",
      barClass: "bg-tertiary",
      valueClass: "text-tertiary",
    };
  }

  return {
    label: "Low",
    pillClass: "bg-error-container text-error",
    barClass: "bg-error",
    valueClass: "text-error",
  };
}

function getGradePillClasses(letter) {
  if (letter === "A+" || letter === "A") {
    return "bg-teal-100 text-teal-800";
  }
  if (letter === "B+" || letter === "B") {
    return "bg-secondary-container text-secondary";
  }
  if (letter === "C+" || letter === "C") {
    return "bg-tertiary-fixed text-tertiary";
  }
  return "bg-error-container text-error";
}

function getAnnouncementClasses(priority) {
  if (priority === "high") {
    return {
      border: "border-l-4 border-l-error border-error-container/70",
      badge: "bg-error-container text-error",
    };
  }

  if (priority === "medium") {
    return {
      border: "border-l-4 border-l-tertiary border-tertiary-fixed/60",
      badge: "bg-tertiary-fixed text-tertiary",
    };
  }

  return {
    border: "border-l-4 border-l-primary border-primary-fixed/60",
    badge: "bg-primary-fixed text-primary",
  };
}

function showInlineMessage(node, message, success) {
  if (!node) {
    return;
  }

  node.textContent = message;
  node.className = success
    ? "mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
    : "mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700";
}

function showLoginMessage(node, message, type) {
  if (!node) {
    return;
  }

  node.textContent = message;
  node.className =
    type === "success"
      ? "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
      : "mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700";
}

function hideLoginMessage(node) {
  if (!node) {
    return;
  }

  node.textContent = "";
  node.className = "hidden";
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) {
    node.textContent = value;
  }
}

function setStyleWidth(selector, value) {
  const node = document.querySelector(selector);
  if (node) {
    node.style.width = `${clampPercent(value)}%`;
  }
}

function updateGauge(selector, value) {
  const node = document.querySelector(selector);
  if (!node) {
    return;
  }

  const circumference = 628.3;
  node.style.strokeDashoffset = `${circumference * (1 - clampPercent(value) / 100)}`;
}

function getTopCourse(courses, selector) {
  if (!courses.length) {
    return null;
  }

  return courses.reduce((best, current) => (selector(current) > selector(best) ? current : best));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  return total / values.length;
}

function calculateGradeLetter(totalMark) {
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

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function roundTwo(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatDateLabel(value) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatNumber(value) {
  return roundTwo(value).toFixed(2).replace(/\.00$/, "");
}

function redirectTo(path) {
  window.location.assign(path);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
