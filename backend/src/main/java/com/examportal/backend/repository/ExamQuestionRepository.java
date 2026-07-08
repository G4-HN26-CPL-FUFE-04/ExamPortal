package com.examportal.backend.repository;

import com.examportal.backend.entity.ExamQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {
    List<ExamQuestion> findByExam_IdOrderByDisplayOrderAscIdAsc(Long examId);
    List<ExamQuestion> findByQuestion_IdIn(List<Long> questionIds);
    boolean existsByExam_IdAndQuestion_Id(Long examId, Long questionId);
    boolean existsByIdAndExam_Id(Long id, Long examId);
    java.util.Optional<ExamQuestion> findByIdAndExam_Id(Long id, Long examId);
    void deleteByExam_IdAndQuestion_Id(Long examId, Long questionId);
    long countByExam_Id(Long examId);

    @Modifying
    void deleteByQuestion_IdIn(List<Long> questionIds);
}
