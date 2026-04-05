package com.glearnportal.web;

import java.io.IOException;
import java.util.Set;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class AuthFilter implements Filter {
  private static final Set<String> PUBLIC_PATHS = Set.of(
      "/",
      "/login.html",
      "/register.html",
      "/register",
      "/login",
      "/api/login",
      "/css/style.css",
      "/js/script.js",
      "/university_logo.svg",
      "/university_logo.png"
  );

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletRequest httpRequest = (HttpServletRequest) request;
    HttpServletResponse httpResponse = (HttpServletResponse) response;

    httpRequest.setCharacterEncoding("UTF-8");
    String path = httpRequest.getRequestURI().substring(httpRequest.getContextPath().length());

    if (isPublicPath(path) || ServletUtil.currentStudentId(httpRequest) != null) {
      chain.doFilter(request, response);
      return;
    }

    if (path.startsWith("/api/")) {
      ServletUtil.writeJson(httpResponse, HttpServletResponse.SC_UNAUTHORIZED,
          "{\"success\":false,\"message\":\"Authentication required.\"}");
      return;
    }

    httpResponse.sendRedirect(httpRequest.getContextPath() + "/login.html?error=Please%20log%20in%20to%20continue.");
  }

  private boolean isPublicPath(String path) {
    if (PUBLIC_PATHS.contains(path)) {
      return true;
    }

    return path.startsWith("/css/")
        || path.startsWith("/js/")
        || path.endsWith(".png")
        || path.endsWith(".svg");
  }
}
