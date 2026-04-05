package com.glearnportal.security;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.HexFormat;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public final class PasswordUtil {
  private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
  private static final int ITERATIONS = 65_536;
  private static final int KEY_LENGTH = 256;
  private static final int SALT_BYTES = 16;

  private PasswordUtil() {
  }

  public static String hashPassword(String password) {
    byte[] salt = new byte[SALT_BYTES];
    new SecureRandom().nextBytes(salt);
    byte[] hash = deriveKey(password, salt, ITERATIONS);

    return "pbkdf2$" + ITERATIONS + "$" + HexFormat.of().formatHex(salt) + "$"
        + HexFormat.of().formatHex(hash);
  }

  public static boolean verifyPassword(String password, String storedHash) {
    if (storedHash == null || storedHash.isBlank()) {
      return false;
    }

    String[] parts = storedHash.split("\\$");

    if (parts.length != 4 || !"pbkdf2".equals(parts[0])) {
      return false;
    }

    int iterations = Integer.parseInt(parts[1]);
    byte[] salt = HexFormat.of().parseHex(parts[2]);
    byte[] expectedHash = HexFormat.of().parseHex(parts[3]);
    byte[] actualHash = deriveKey(password, salt, iterations);

    if (actualHash.length != expectedHash.length) {
      return false;
    }

    int diff = 0;
    for (int index = 0; index < actualHash.length; index += 1) {
      diff |= actualHash[index] ^ expectedHash[index];
    }

    return diff == 0;
  }

  private static byte[] deriveKey(String password, byte[] salt, int iterations) {
    try {
      PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, KEY_LENGTH);
      SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
      return factory.generateSecret(spec).getEncoded();
    } catch (NoSuchAlgorithmException | InvalidKeySpecException error) {
      throw new IllegalStateException("Unable to hash password.", error);
    }
  }
}
