package com.examportal.backend.repository;

import com.examportal.backend.entity.ClassroomMember;
import com.examportal.backend.entity.enums.ClassroomMemberStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassroomMemberRepository extends JpaRepository<ClassroomMember, Long> {
    List<ClassroomMember> findByClassroom_IdOrderByStatusAscJoinedAtAsc(Long classroomId);
    Optional<ClassroomMember> findByClassroom_IdAndUser_Id(Long classroomId, Long userId);
    List<ClassroomMember> findByUser_IdOrderByJoinedAtDesc(Long userId);
    List<ClassroomMember> findByUser_IdAndStatusOrderByJoinedAtDesc(Long userId, ClassroomMemberStatus status);
    long countByClassroom_IdAndStatus(Long classroomId, ClassroomMemberStatus status);
    void deleteByClassroom_Id(Long classroomId);
}
