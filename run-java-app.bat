@echo off
setlocal

call "%~dp0build-java-app.bat"
if errorlevel 1 exit /b %errorlevel%

set "CP=%~dp0build\classes;%~dp0java-lib\tomcat-embed-core-10.1.31.jar;%~dp0java-lib\mysql-connector-j-9.3.0.jar;%~dp0java-lib\jakarta.annotation-api-2.1.1.jar"
java -cp "%CP%" com.glearnportal.GLearnPortalApplication
