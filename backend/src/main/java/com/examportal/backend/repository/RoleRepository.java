package com.examportal.backend.repository;

import com.examportal.backend.entity.Role;
import com.examportal.backend.entity.enums.RoleName;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
