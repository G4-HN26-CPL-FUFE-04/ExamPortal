package com.examportal.backend.repository;

import com.examportal.backend.entity.Question;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    long countByQuestionBank_Subject_Id(Long subjectId);
    long countByQuestionBank_Id(Long questionBankId);
    List<Question> findByContentContainingIgnoreCase(String keyword);
    List<Question> findByQuestionBank_Id(Long questionBankId);
    List<Question> findByQuestionBank_IdAndContentContainingIgnoreCase(Long questionBankId, String keyword);
    List<Question> findByQuestionBank_Subject_Id(Long subjectId);
    List<Question> findByQuestionBank_Subject_IdAndContentContainingIgnoreCase(Long subjectId, String keyword);

    @Modifying
    void deleteByQuestionBank_Id(Long questionBankId);
}
