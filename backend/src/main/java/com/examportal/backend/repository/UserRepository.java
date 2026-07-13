package com.examportal.backend.repository;

import com.examportal.backend.entity.User;
import com.examportal.backend.entity.enums.RoleName;
import com.examportal.backend.entity.enums.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    long countByRole_Name(RoleName roleName);
    List<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String fullName, String email);
    List<User> findByStatus(UserStatus status);
    List<User> findByRole_Name(RoleName roleName);
}
