package com.examportal.backend.repository;

import com.examportal.backend.entity.QuestionOption;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    List<QuestionOption> findByQuestion_IdIn(List<Long> questionIds);
    List<QuestionOption> findByQuestion_IdOrderByOptionLabelAsc(Long questionId);

    @Modifying
    void deleteByQuestion_IdIn(List<Long> questionIds);
}
