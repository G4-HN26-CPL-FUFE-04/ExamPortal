package com.examportal.backend.repository;

import com.examportal.backend.entity.QuestionBank;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    List<QuestionBank> findBySubject_Id(Long subjectId);
    List<QuestionBank> findBySubject_IdOrderByNameAsc(Long subjectId);
    long countBySubject_Id(Long subjectId);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    boolean existsBySubject_IdAndNameIgnoreCase(Long subjectId, String name);
    boolean existsBySubject_IdAndNameIgnoreCaseAndIdNot(Long subjectId, String name, Long id);
    Optional<QuestionBank> findBySubject_IdAndNameIgnoreCase(Long subjectId, String name);

    @Modifying
    void deleteBySubject_Id(Long subjectId);
}
