package com.examportal.backend.repository;

import com.examportal.backend.entity.Topic;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findBySubject_Id(Long subjectId);
}
