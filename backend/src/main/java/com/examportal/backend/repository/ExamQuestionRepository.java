package com.examportal.backend.repository;

import com.examportal.backend.entity.ExamQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {
    List<ExamQuestion> findByExam_IdOrderByDisplayOrderAsc(Long examId);
    void deleteByExam_IdAndQuestion_Id(Long examId, Long questionId);
    long countByExam_Id(Long examId);
}
