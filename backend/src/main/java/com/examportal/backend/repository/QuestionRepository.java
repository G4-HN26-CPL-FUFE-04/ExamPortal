package com.examportal.backend.repository;

import com.examportal.backend.entity.Question;
import com.examportal.backend.entity.enums.QuestionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByContentContainingIgnoreCase(String keyword);
    List<Question> findByStatus(QuestionStatus status);
}
