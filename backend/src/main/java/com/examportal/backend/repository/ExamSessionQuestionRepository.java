package com.examportal.backend.repository;

import com.examportal.backend.entity.ExamSessionQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamSessionQuestionRepository extends JpaRepository<ExamSessionQuestion, Long> {
    List<ExamSessionQuestion> findByExamSession_IdOrderByDisplayOrderAsc(Long examSessionId);
    long countByExamSession_Id(Long examSessionId);
    boolean existsByExamSession_Id(Long examSessionId);
}
