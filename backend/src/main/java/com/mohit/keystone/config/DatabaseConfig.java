package com.mohit.keystone.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
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

        // Prioritize active Render DATABASE_URL if present
        String envDbUrl = System.getenv("DATABASE_URL");
        if (envDbUrl != null && !envDbUrl.isBlank()) {
            url = envDbUrl;
        }

        // If the URL still contains an old stale/dead Render database host or is blank, heal it to keystone-db
        if (url == null || url.isBlank() || url.contains("dpg-d9q7rmbm8hqs73e578h0")) {
            url = "postgresql://keystone_user:ZolPrSkrXMV31R5lZxc97bN4t2TkFLl7@dpg-dbvodh2fngtc7389uuag-a:5432/keystone_zvfz";
            user = "keystone_user";
            password = "ZolPrSkrXMV31R5lZxc97bN4t2TkFLl7";
        }

        // Auto-convert standard Render postgres:// or postgresql:// URIs into valid JDBC format
        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            boolean parsed = false;
            try {
                URI uri = new URI(url);
                String host = uri.getHost();
                if (host != null && !host.isBlank()) {
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
                    parsed = true;
                }
            } catch (Exception ignored) {
            }

            if (!parsed) {
                // Regex fallback
                Pattern pattern = Pattern.compile("(?:postgres|postgresql)://(?:([^:]+)(?::([^@]+))?@)?([^:/]+)(?::(\\d+))?(/.*)?");
                Matcher matcher = pattern.matcher(url);
                if (matcher.find()) {
                    if (matcher.group(1) != null) user = matcher.group(1);
                    if (matcher.group(2) != null) password = matcher.group(2);
                    String host = matcher.group(3);
                    String portStr = matcher.group(4);
                    int port = portStr != null ? Integer.parseInt(portStr) : 5432;
                    String path = matcher.group(5) != null ? matcher.group(5) : "/keystone_zvfz";
                    url = "jdbc:postgresql://" + host + ":" + port + path;
                }
            }
        }

        // If password is still matching the old dead database password, replace with new keystone-db password
        if ("tTUPWwi7RtQ6GQRPw4aURHnxrRiTY8rU".equals(password) || password == null || password.isBlank()) {
            password = "ZolPrSkrXMV31R5lZxc97bN4t2TkFLl7";
        }
        if ("postgres".equals(user) || user == null || user.isBlank()) {
            user = "keystone_user";
        }

        config.setJdbcUrl(url);
        config.setUsername(user);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");

        // Connection pool optimization
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}
