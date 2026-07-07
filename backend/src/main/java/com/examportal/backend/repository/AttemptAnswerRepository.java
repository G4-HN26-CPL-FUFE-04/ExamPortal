package com.examportal.backend.repository;

import com.examportal.backend.entity.AttemptAnswer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {
    List<AttemptAnswer> findByAttempt_Id(Long attemptId);
    List<AttemptAnswer> findByAttempt_IdIn(List<Long> attemptIds);
}
