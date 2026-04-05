package com.glearnportal.web;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

import com.glearnportal.data.PortalRepository;
import com.glearnportal.data.PortalRepository.CourseRecord;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class CoursesXmlServlet extends HttpServlet {
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
      List<CourseRecord> courses = PortalRepository.getCurrentCourses(studentId);
      StringBuilder xml = new StringBuilder();
      xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
      xml.append("<courses>");

      for (CourseRecord course : courses) {
        xml.append("<course id=\"").append(course.id()).append("\" code=\"")
            .append(ServletUtil.escapeXml(course.courseCode())).append("\" semester=\"")
            .append(ServletUtil.escapeXml(course.semesterLabel())).append("\">")
            .append("<title>").append(ServletUtil.escapeXml(course.courseTitle())).append("</title>")
            .append("<instructor>").append(ServletUtil.escapeXml(course.instructor())).append("</instructor>")
            .append("<schedule>").append(ServletUtil.escapeXml(course.scheduleInfo())).append("</schedule>")
            .append("<credits>").append(course.credits()).append("</credits>")
            .append("<attendancePercentage>").append(ServletUtil.formatDouble(course.attendancePercentage()))
            .append("</attendancePercentage>")
            .append("<assignmentMark>").append(ServletUtil.formatDouble(course.assignmentMark()))
            .append("</assignmentMark>")
            .append("<midtermMark>").append(ServletUtil.formatDouble(course.midtermMark()))
            .append("</midtermMark>")
            .append("<finalMark>").append(ServletUtil.formatDouble(course.finalMark()))
            .append("</finalMark>")
            .append("<totalMark>").append(ServletUtil.formatDouble(course.totalMark()))
            .append("</totalMark>")
            .append("<gradeLetter>").append(ServletUtil.escapeXml(course.gradeLetter())).append("</gradeLetter>")
            .append("</course>");
      }

      xml.append("</courses>");
      ServletUtil.writeXml(response, xml.toString());
    } catch (SQLException error) {
      throw new ServletException("Unable to load courses.", error);
    }
  }
}
