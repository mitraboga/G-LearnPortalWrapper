package com.glearnportal.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

public final class ServletUtil {
  private ServletUtil() {
  }

  public static Integer currentStudentId(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session == null) {
      return null;
    }

    Object value = session.getAttribute("studentId");
    return value instanceof Integer studentId ? studentId : null;
  }

  public static void writeJson(HttpServletResponse response, int statusCode, String json)
      throws IOException {
    response.setStatus(statusCode);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType("application/json");
    response.getWriter().write(json);
  }

  public static void writeXml(HttpServletResponse response, String xml) throws IOException {
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType("application/xml");
    response.getWriter().write(xml);
  }

  public static String escapeJson(String value) {
    if (value == null) {
      return "";
    }

    return value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\r", "\\r")
        .replace("\n", "\\n");
  }

  public static String escapeXml(String value) {
    if (value == null) {
      return "";
    }

    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&apos;");
  }

  public static String formatDouble(double value) {
    return String.format(Locale.US, "%.2f", value);
  }

  public static double parseDoubleParameter(HttpServletRequest request, String name) {
    return Double.parseDouble(request.getParameter(name));
  }

  public static int parseIntParameter(HttpServletRequest request, String name) {
    return Integer.parseInt(request.getParameter(name));
  }
}
