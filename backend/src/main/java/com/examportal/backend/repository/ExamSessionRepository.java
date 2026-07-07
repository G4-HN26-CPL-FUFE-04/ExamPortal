package com.examportal.backend.repository;

import com.examportal.backend.entity.ExamSession;
import com.examportal.backend.entity.enums.SessionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {
    List<ExamSession> findByStatus(SessionStatus status);
}
