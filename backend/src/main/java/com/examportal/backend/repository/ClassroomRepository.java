package com.examportal.backend.repository;

import com.examportal.backend.entity.Classroom;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByCreatedBy_IdOrderByCreatedAtDesc(Long createdById);
    boolean existsByJoinCodeIgnoreCase(String joinCode);
    Optional<Classroom> findByJoinCodeIgnoreCase(String joinCode);
}
