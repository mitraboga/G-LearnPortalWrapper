package com.glearnportal.web;

import java.io.IOException;
import java.sql.SQLException;

import com.glearnportal.data.PortalRepository;
import com.glearnportal.data.PortalRepository.DashboardSummary;
import com.glearnportal.data.PortalRepository.Student;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class MeServlet extends HttpServlet {
  @Override
  protected void doGet(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    Integer studentId = ServletUtil.currentStudentId(request);

    if (studentId == null) {
      ServletUtil.writeJson(response, HttpServletResponse.SC_UNAUTHORIZED,
          "{\"success\":false,\"message\":\"Authentication required.\"}");
      return;
    }

    try {
      Student student = PortalRepository.findStudentById(studentId);
      DashboardSummary summary = PortalRepository.getDashboardSummary(studentId);

      if (student == null) {
        ServletUtil.writeJson(response, HttpServletResponse.SC_UNAUTHORIZED,
            "{\"success\":false,\"message\":\"Authentication required.\"}");
        return;
      }

      String json = """
          {
            "success": true,
            "user": {
              "id": %d,
              "username": "%s",
              "fullName": "%s",
              "department": "%s"
            },
            "summary": {
              "currentSemester": "%s",
              "sgpa": %s,
              "cgpa": %s,
              "overallAttendance": %s
            }
          }
          """.formatted(
          student.id(),
          ServletUtil.escapeJson(student.username()),
          ServletUtil.escapeJson(student.fullName()),
          ServletUtil.escapeJson(student.department()),
          ServletUtil.escapeJson(summary.currentSemester()),
          ServletUtil.formatDouble(summary.sgpa()),
          ServletUtil.formatDouble(summary.cgpa()),
          ServletUtil.formatDouble(summary.overallAttendance())
      );

      ServletUtil.writeJson(response, HttpServletResponse.SC_OK, json);
    } catch (SQLException error) {
      throw new ServletException("Unable to load the current student.", error);
    }
  }
}
