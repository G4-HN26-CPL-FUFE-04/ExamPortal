package com.examportal.backend.repository;

import com.examportal.backend.entity.Attempt;
import com.examportal.backend.entity.enums.AttemptStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    List<Attempt> findByStudent_IdOrderByStartedAtDesc(Long studentId);
    long countByStudent_IdAndExamSession_Id(Long studentId, Long sessionId);
    List<Attempt> findByExamSession_Id(Long sessionId);
    long countByStatus(AttemptStatus status);
}
