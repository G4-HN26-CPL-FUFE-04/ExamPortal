package com.examportal.backend.repository;

import com.examportal.backend.entity.ExamSession;
import com.examportal.backend.entity.enums.SessionStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {
    List<ExamSession> findByExam_Id(Long examId);
    List<ExamSession> findByStatus(SessionStatus status);
    List<ExamSession> findByCreatedBy_Id(Long userId);
    boolean existsByExam_Id(Long examId);
    boolean existsByExam_IdAndOpenTimeLessThanEqual(Long examId, LocalDateTime openTime);
}
