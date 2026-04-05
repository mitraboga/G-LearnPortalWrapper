package com.glearnportal;

public record AppConfig(
    String dbHost,
    int dbPort,
    String dbName,
    String dbUser,
    String dbPassword,
    int port
) {
  public static AppConfig load() {
    return new AppConfig(
        getenv("DB_HOST", "localhost"),
        Integer.parseInt(getenv("DB_PORT", "3306")),
        getenv("DB_NAME", "studentdb"),
        getenv("DB_USER", "root"),
        getenv("DB_PASSWORD", "zsxdc3ROUTE66!"),
        Integer.parseInt(getenv("PORT", "500"))
    );
  }

  public String rootJdbcUrl() {
    return "jdbc:mysql://" + dbHost + ":" + dbPort + "/?serverTimezone=UTC&allowPublicKeyRetrieval=true&useSSL=false";
  }

  public String jdbcUrl() {
    return "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName
        + "?serverTimezone=UTC&allowPublicKeyRetrieval=true&useSSL=false";
  }

  private static String getenv(String key, String fallback) {
    String value = System.getenv(key);
    return value == null || value.isBlank() ? fallback : value;
  }
}
