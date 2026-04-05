package com.glearnportal.web;

import java.io.IOException;
import java.sql.SQLException;

import com.glearnportal.data.PortalRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class AttendanceUpdateServlet extends HttpServlet {
  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    Integer studentId = ServletUtil.currentStudentId(request);

    if (studentId == null) {
      ServletUtil.writeJson(response, HttpServletResponse.SC_UNAUTHORIZED,
          "{\"success\":false,\"message\":\"Authentication required.\"}");
      return;
    }

    try {
      int courseId = ServletUtil.parseIntParameter(request, "courseId");
      double attendancePercentage = ServletUtil.parseDoubleParameter(request, "attendancePercentage");

      if (attendancePercentage < 0 || attendancePercentage > 100) {
        ServletUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
            "{\"success\":false,\"message\":\"Attendance must be between 0 and 100.\"}");
        return;
      }

      boolean updated = PortalRepository.updateAttendance(studentId, courseId, attendancePercentage);
      if (!updated) {
        ServletUtil.writeJson(response, HttpServletResponse.SC_NOT_FOUND,
            "{\"success\":false,\"message\":\"Course record not found.\"}");
        return;
      }

      ServletUtil.writeJson(response, HttpServletResponse.SC_OK,
          "{\"success\":true,\"message\":\"Attendance updated successfully.\"}");
    } catch (NumberFormatException error) {
      ServletUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
          "{\"success\":false,\"message\":\"Attendance update data is invalid.\"}");
    } catch (SQLException error) {
      throw new ServletException("Unable to update attendance.", error);
    }
  }
}
