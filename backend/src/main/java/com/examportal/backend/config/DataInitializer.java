package com.examportal.backend.config;

import com.examportal.backend.entity.Role;
import com.examportal.backend.entity.enums.RoleName;
import com.examportal.backend.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import java.sql.Connection;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner seedData(RoleRepository roleRepository, JdbcTemplate jdbcTemplate) {
        return args -> {
            try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
                if (connection.getMetaData().getDatabaseProductName().contains("Microsoft SQL Server")) {
                    jdbcTemplate.update("UPDATE roles SET name = 'TEACHER' WHERE name = 'INSTRUCTOR' AND NOT EXISTS (SELECT 1 FROM roles WHERE name = 'TEACHER')");
                    jdbcTemplate.update("UPDATE users SET role_id = (SELECT TOP 1 id FROM roles WHERE name = 'TEACHER') WHERE role_id IN (SELECT id FROM roles WHERE name = 'INSTRUCTOR') AND EXISTS (SELECT 1 FROM roles WHERE name = 'TEACHER')");
                    jdbcTemplate.update("DELETE FROM roles WHERE name = 'INSTRUCTOR' AND EXISTS (SELECT 1 FROM roles WHERE name = 'TEACHER')");
                }
            }
            for (RoleName roleName : RoleName.values()) {
                roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(new Role(roleName)));
            }
        };
    }
}
