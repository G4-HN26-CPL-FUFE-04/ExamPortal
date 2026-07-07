package com.examportal.backend.repository;

import com.examportal.backend.entity.QuestionOption;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    List<QuestionOption> findByQuestion_IdOrderByOptionLabelAsc(Long questionId);
}
