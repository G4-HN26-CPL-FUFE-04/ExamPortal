package com.examportal.backend.config;

import com.examportal.backend.entity.Role;
import com.examportal.backend.entity.Subject;
import com.examportal.backend.entity.User;
import com.examportal.backend.entity.enums.RoleName;
import com.examportal.backend.entity.enums.UserStatus;
import com.examportal.backend.repository.RoleRepository;
import com.examportal.backend.repository.SubjectRepository;
import com.examportal.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner seedData(RoleRepository roleRepository, UserRepository userRepository,
                               SubjectRepository subjectRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            for (RoleName roleName : RoleName.values()) {
                roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(new Role(roleName)));
            }

            if (userRepository.count() > 0) {
                return;
            }

            User admin = new User();
            admin.setFullName("System Admin");
            admin.setEmail("admin@examportal.local");
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            admin.setRole(roleRepository.findByName(RoleName.ADMIN).orElseThrow());
            admin.setStatus(UserStatus.ACTIVE);
            userRepository.save(admin);

            User instructor = new User();
            instructor.setFullName("Lead Instructor");
            instructor.setEmail("instructor@examportal.local");
            instructor.setPasswordHash(passwordEncoder.encode("Instructor@123"));
            instructor.setRole(roleRepository.findByName(RoleName.INSTRUCTOR).orElseThrow());
            instructor.setStatus(UserStatus.ACTIVE);
            userRepository.save(instructor);

            User student = new User();
            student.setFullName("Demo Student");
            student.setEmail("student@examportal.local");
            student.setPasswordHash(passwordEncoder.encode("Student@123"));
            student.setRole(roleRepository.findByName(RoleName.STUDENT).orElseThrow());
            student.setStatus(UserStatus.ACTIVE);
            userRepository.save(student);

            Subject subject = new Subject();
            subject.setName("Java Fundamentals");
            subject.setDescription("Core Java and OOP");
            subject.setCreatedBy(instructor);
            subjectRepository.save(subject);
        };
    }
}
