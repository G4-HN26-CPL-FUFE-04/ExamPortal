package com.examportal.backend.repository;

import com.examportal.backend.entity.ExamQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {
    List<ExamQuestion> findByExam_IdOrderByDisplayOrderAscIdAsc(Long examId);
    boolean existsByExam_IdAndQuestion_Id(Long examId, Long questionId);
    boolean existsByIdAndExam_Id(Long id, Long examId);
    java.util.Optional<ExamQuestion> findByIdAndExam_Id(Long id, Long examId);
    void deleteByExam_IdAndQuestion_Id(Long examId, Long questionId);
    long countByExam_Id(Long examId);
}
