package com.glearnportal.web;

import java.io.IOException;
import java.sql.SQLException;

import com.glearnportal.data.PortalRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class MarksUpdateServlet extends HttpServlet {
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
      double assignmentMark = ServletUtil.parseDoubleParameter(request, "assignmentMark");
      double midtermMark = ServletUtil.parseDoubleParameter(request, "midtermMark");
      double finalMark = ServletUtil.parseDoubleParameter(request, "finalMark");

      if (assignmentMark < 0 || assignmentMark > 20
          || midtermMark < 0 || midtermMark > 30
          || finalMark < 0 || finalMark > 50) {
        ServletUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
            "{\"success\":false,\"message\":\"Marks are outside the allowed range.\"}");
        return;
      }

      boolean updated = PortalRepository.updateMarks(studentId, courseId, assignmentMark, midtermMark, finalMark);
      if (!updated) {
        ServletUtil.writeJson(response, HttpServletResponse.SC_NOT_FOUND,
            "{\"success\":false,\"message\":\"Course record not found.\"}");
        return;
      }

      ServletUtil.writeJson(response, HttpServletResponse.SC_OK,
          "{\"success\":true,\"message\":\"Marks updated successfully.\"}");
    } catch (NumberFormatException error) {
      ServletUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
          "{\"success\":false,\"message\":\"Marks update data is invalid.\"}");
    } catch (SQLException error) {
      throw new ServletException("Unable to update marks.", error);
    }
  }
}
