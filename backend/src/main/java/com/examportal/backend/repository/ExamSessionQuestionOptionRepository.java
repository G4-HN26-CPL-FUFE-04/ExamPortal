package com.examportal.backend.repository;

import com.examportal.backend.entity.ExamSessionQuestionOption;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamSessionQuestionOptionRepository extends JpaRepository<ExamSessionQuestionOption, Long> {
    List<ExamSessionQuestionOption> findByExamSessionQuestion_IdOrderByOptionLabelAsc(Long examSessionQuestionId);
    List<ExamSessionQuestionOption> findByExamSessionQuestion_IdIn(List<Long> examSessionQuestionIds);
}
