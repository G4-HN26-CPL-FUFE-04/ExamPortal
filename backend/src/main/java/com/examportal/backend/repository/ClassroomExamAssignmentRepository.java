package com.examportal.backend.repository;

import com.examportal.backend.entity.ClassroomExamAssignment;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassroomExamAssignmentRepository extends JpaRepository<ClassroomExamAssignment, Long> {
    List<ClassroomExamAssignment> findByClassroom_IdOrderByAssignedAtDesc(Long classroomId);
    List<ClassroomExamAssignment> findByClassroom_IdIn(Collection<Long> classroomIds);
    List<ClassroomExamAssignment> findByExamSession_Id(Long examSessionId);
    boolean existsByClassroom_IdAndExamSession_Id(Long classroomId, Long examSessionId);
    boolean existsByExamSession_IdAndClassroom_IdIn(Long examSessionId, Collection<Long> classroomIds);
    void deleteByClassroom_Id(Long classroomId);
    void deleteByExamSession_Id(Long examSessionId);
}
