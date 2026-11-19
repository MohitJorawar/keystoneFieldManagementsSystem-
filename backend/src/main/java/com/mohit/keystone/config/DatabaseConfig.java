package com.mohit.keystone.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUser;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        String url = dbUrl;
        String user = dbUser;
        String password = dbPassword;

        // Auto-convert standard Render postgres:// or postgresql:// URIs into valid JDBC format
        if (url != null && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(url);
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();

                url = "jdbc:postgresql://" + host + ":" + port + path;

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    user = userInfo[0];
                    if (userInfo.length > 1) {
                        password = userInfo[1];
                    }
                }
            } catch (Exception e) {
                url = "jdbc:" + url.replace("postgres://", "postgresql://");
            }
        }

        config.setJdbcUrl(url);
        if (user != null && !user.isEmpty()) {
            config.setUsername(user);
        }
        if (password != null && !password.isEmpty()) {
            config.setPassword(password);
        }
        config.setDriverClassName("org.postgresql.Driver");

        return new HikariDataSource(config);
    }
}
