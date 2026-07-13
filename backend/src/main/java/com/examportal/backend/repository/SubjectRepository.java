package com.examportal.backend.repository;

import com.examportal.backend.entity.Subject;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    Optional<Subject> findByNameIgnoreCase(String name);
    List<Subject> findByCreatedBy_IdOrderByNameAsc(Long userId);
}
