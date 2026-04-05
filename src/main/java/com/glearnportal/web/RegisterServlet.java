package com.glearnportal.web;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDate;

import com.glearnportal.data.PortalRepository;
import com.glearnportal.data.PortalRepository.RegistrationData;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class RegisterServlet extends HttpServlet {
  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    String firstName = value(request, "firstName");
    String lastName = value(request, "lastName");
    String username = value(request, "username");
    String mobileNo = value(request, "mobileNo");
    String dateOfBirth = value(request, "dateOfBirth");
    String emailId = value(request, "emailId");
    String password = value(request, "password");
    String confirmPassword = value(request, "confirmPassword");
    String age = value(request, "age");
    String gender = value(request, "gender");

    if (firstName.isBlank() || lastName.isBlank() || username.isBlank()
        || mobileNo.isBlank() || dateOfBirth.isBlank() || emailId.isBlank()
        || password.isBlank() || confirmPassword.isBlank()
        || age.isBlank() || gender.isBlank()) {
      redirectWithError(request, response, "All registration fields are required.");
      return;
    }

    if (!password.equals(confirmPassword)) {
      redirectWithError(request, response, "Password and Confirm Password must match.");
      return;
    }

    try {
      RegistrationData registrationData = new RegistrationData(
          firstName,
          lastName,
          username,
          mobileNo,
          LocalDate.parse(dateOfBirth),
          emailId,
          password,
          Integer.valueOf(age),
          gender,
          "Computer Science and Engineering"
      );

      PortalRepository.registerStudent(registrationData);
      response.sendRedirect(request.getContextPath()
          + "/login.html?message="
          + encode("Registration successful. Log in with your Roll No. / Username and password."));
    } catch (NumberFormatException error) {
      redirectWithError(request, response, "Age must be a valid number.");
    } catch (RuntimeException error) {
      redirectWithError(request, response, "Date of birth or registration data is invalid.");
    } catch (SQLException error) {
      redirectWithError(request, response, error.getMessage());
    }
  }

  private void redirectWithError(
      HttpServletRequest request,
      HttpServletResponse response,
      String message
  ) throws IOException {
    response.sendRedirect(request.getContextPath() + "/register.html?error=" + encode(message));
  }

  private String value(HttpServletRequest request, String name) {
    String rawValue = request.getParameter(name);
    return rawValue == null ? "" : rawValue.trim();
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
