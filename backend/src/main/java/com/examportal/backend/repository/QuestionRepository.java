package com.examportal.backend.repository;

import com.examportal.backend.entity.Question;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByContentContainingIgnoreCase(String keyword);
    List<Question> findBySubject_Id(Long subjectId);
    List<Question> findBySubject_IdAndContentContainingIgnoreCase(Long subjectId, String keyword);
}
