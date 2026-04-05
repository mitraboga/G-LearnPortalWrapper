package com.glearnportal.web;

import java.io.IOException;
import java.sql.SQLException;

import com.glearnportal.data.PortalRepository;
import com.glearnportal.data.PortalRepository.Student;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

public class LoginServlet extends HttpServlet {
  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    String username = request.getParameter("username");
    String password = request.getParameter("password");

    if (username == null || username.isBlank() || password == null || password.isBlank()) {
      sendInvalid(response, request, "Username and password are required.");
      return;
    }

    try {
      Student student = PortalRepository.authenticate(username.trim(), password.trim());

      if (student == null) {
        sendInvalid(response, request, "Invalid username or password.");
        return;
      }

      HttpSession session = request.getSession(true);
      session.invalidate();
      session = request.getSession(true);
      session.setAttribute("studentId", student.id());
      session.setMaxInactiveInterval(8 * 60 * 60);

      if (isApiRequest(request)) {
        ServletUtil.writeJson(response, HttpServletResponse.SC_OK,
            "{\"success\":true,\"message\":\"Login successful.\"}");
        return;
      }

      response.sendRedirect(request.getContextPath() + "/dashboard.html");
    } catch (SQLException error) {
      throw new ServletException("Unable to log in.", error);
    }
  }

  private void sendInvalid(HttpServletResponse response, HttpServletRequest request, String message)
      throws IOException {
    if (isApiRequest(request)) {
      ServletUtil.writeJson(response, HttpServletResponse.SC_UNAUTHORIZED,
          "{\"success\":false,\"message\":\"" + ServletUtil.escapeJson(message) + "\"}");
      return;
    }

    response.sendRedirect(request.getContextPath() + "/login.html?error="
        + java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8));
  }

  private boolean isApiRequest(HttpServletRequest request) {
    return request.getServletPath().startsWith("/api/");
  }
}
