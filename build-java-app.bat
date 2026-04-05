@echo off
setlocal

set "ROOT=%~dp0"
set "SRC_DIR=%ROOT%src\main\java"
set "OUT_DIR=%ROOT%build\classes"
set "LIB_DIR=%ROOT%java-lib"
set "SOURCES_FILE=%ROOT%build\sources.txt"
set "CP=%LIB_DIR%\tomcat-embed-core-10.1.31.jar;%LIB_DIR%\mysql-connector-j-9.3.0.jar;%LIB_DIR%\jakarta.annotation-api-2.1.1.jar"
set "JAVAC_OUT=%ROOT%build\javac.out"
set "JAVAC_ERR=%ROOT%build\javac.err"

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
if not exist "%ROOT%build" mkdir "%ROOT%build"

dir /s /b "%SRC_DIR%\*.java" > "%SOURCES_FILE%"

if not exist "%LIB_DIR%\tomcat-embed-core-10.1.31.jar" (
  echo Missing Tomcat embedded JAR in java-lib.
  exit /b 1
)

if not exist "%LIB_DIR%\mysql-connector-j-9.3.0.jar" (
  echo Missing MySQL Connector/J JAR in java-lib.
  exit /b 1
)

if not exist "%LIB_DIR%\jakarta.annotation-api-2.1.1.jar" (
  echo Missing Jakarta Annotation API JAR in java-lib.
  exit /b 1
)

javac -encoding UTF-8 -cp "%CP%" -d "%OUT_DIR%" @"%SOURCES_FILE%" 1>"%JAVAC_OUT%" 2>"%JAVAC_ERR%"
if errorlevel 1 (
  type "%JAVAC_OUT%"
  type "%JAVAC_ERR%"
  exit /b %errorlevel%
)

echo Build completed successfully.
