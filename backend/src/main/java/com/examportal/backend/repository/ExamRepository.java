package com.examportal.backend.repository;

import com.examportal.backend.entity.Exam;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findBySubject_Id(Long subjectId);

    @Modifying
    void deleteBySubject_Id(Long subjectId);
}
