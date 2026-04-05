package com.glearnportal;

import java.io.File;

import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;
import org.apache.catalina.webresources.DirResourceSet;
import org.apache.catalina.webresources.StandardRoot;

import com.glearnportal.data.PortalRepository;

public final class GLearnPortalApplication {
  private GLearnPortalApplication() {
  }

  public static void main(String[] args) throws Exception {
    AppConfig config = AppConfig.load();
    PortalRepository.initialize(config);

    Tomcat tomcat = new Tomcat();
    tomcat.setPort(config.port());
    tomcat.setBaseDir(new File("build/tomcat").getAbsolutePath());
    tomcat.getConnector();

    File webappDir = new File("src/main/webapp");
    Context context = tomcat.addWebapp("", webappDir.getAbsolutePath());

    File classesDir = new File("build/classes");
    StandardRoot resources = new StandardRoot(context);
    resources.addPreResources(
        new DirResourceSet(resources, "/WEB-INF/classes", classesDir.getAbsolutePath(), "/")
    );
    context.setResources(resources);

    tomcat.start();

    System.out.println("GLearn Portal running at http://localhost:" + config.port() + "/");
    tomcat.getServer().await();
  }
}
