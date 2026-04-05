package com.glearnportal.web;

import java.io.IOException;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

public class LogoutServlet extends HttpServlet {
  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    HttpSession session = request.getSession(false);
    if (session != null) {
      session.invalidate();
    }

    if (request.getServletPath().startsWith("/api/")) {
      ServletUtil.writeJson(response, HttpServletResponse.SC_OK,
          "{\"success\":true,\"message\":\"Logged out.\"}");
      return;
    }

    response.sendRedirect(request.getContextPath() + "/login.html?message=You%20have%20been%20logged%20out.");
  }
}
