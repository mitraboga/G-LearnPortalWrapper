package com.glearnportal.web;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

import com.glearnportal.data.PortalRepository;
import com.glearnportal.data.PortalRepository.AnnouncementRecord;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class AnnouncementsXmlServlet extends HttpServlet {
  @Override
  protected void doGet(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    try {
      List<AnnouncementRecord> announcements = PortalRepository.getAnnouncements();
      StringBuilder xml = new StringBuilder();
      xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
      xml.append("<announcements>");

      for (AnnouncementRecord announcement : announcements) {
        xml.append("<announcement id=\"").append(announcement.id()).append("\" priority=\"")
            .append(ServletUtil.escapeXml(announcement.priority())).append("\">")
            .append("<title>").append(ServletUtil.escapeXml(announcement.title())).append("</title>")
            .append("<date>").append(announcement.publishDate()).append("</date>")
            .append("<description>").append(ServletUtil.escapeXml(announcement.description()))
            .append("</description>")
            .append("</announcement>");
      }

      xml.append("</announcements>");
      ServletUtil.writeXml(response, xml.toString());
    } catch (SQLException error) {
      throw new ServletException("Unable to load announcements.", error);
    }
  }
}
