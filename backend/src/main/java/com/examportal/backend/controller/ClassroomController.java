package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.service.PortalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classrooms")
public class ClassroomController {
    private final PortalService portalService;

    public ClassroomController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    @GetMapping
    public ResponseEntity<List<ApiDtos.ClassroomDto>> getClassrooms() {
        return ResponseEntity.ok(portalService.getClassrooms());
    }

    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiDtos.ClassroomDto> getClassroom(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getClassroom(id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<ApiDtos.ClassroomDto> createClassroom(@Valid @RequestBody ApiDtos.ClassroomPayload payload) {
        return ResponseEntity.ok(portalService.saveClassroom(payload, null));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiDtos.ClassroomDto> updateClassroom(@PathVariable Long id,
                                                                @Valid @RequestBody ApiDtos.ClassroomPayload payload) {
        return ResponseEntity.ok(portalService.saveClassroom(payload, id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClassroom(@PathVariable Long id) {
        portalService.deleteClassroom(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{id}/join-code")
    public ResponseEntity<ApiDtos.ClassroomDto> regenerateJoinCode(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.regenerateClassroomJoinCode(id));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/join")
    public ResponseEntity<ApiDtos.ClassroomDto> joinClassroom(@Valid @RequestBody ApiDtos.ClassroomJoinPayload payload) {
        return ResponseEntity.ok(portalService.joinClassroom(payload));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/{id}/members")
    public ResponseEntity<List<ApiDtos.ClassroomMemberDto>> getClassroomMembers(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getClassroomMembers(id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PatchMapping("/{classroomId}/members/{memberId}/approve")
    public ResponseEntity<ApiDtos.ClassroomMemberDto> approveMember(@PathVariable Long classroomId,
                                                                    @PathVariable Long memberId) {
        return ResponseEntity.ok(portalService.approveClassroomMember(classroomId, memberId));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{classroomId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long classroomId, @PathVariable Long memberId) {
        portalService.removeClassroomMember(classroomId, memberId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('STUDENT')")
    @DeleteMapping("/{id}/membership")
    public ResponseEntity<Void> leaveClassroom(@PathVariable Long id) {
        portalService.leaveClassroom(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    @GetMapping("/{id}/exam-assignments")
    public ResponseEntity<List<ApiDtos.ClassroomExamAssignmentDto>> getAssignments(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getClassroomAssignments(id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{id}/exam-assignments")
    public ResponseEntity<ApiDtos.ClassroomExamAssignmentDto> assignExamSession(
        @PathVariable Long id,
        @Valid @RequestBody ApiDtos.ClassroomExamAssignmentPayload payload
    ) {
        return ResponseEntity.ok(portalService.assignExamSessionToClassroom(id, payload));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{classroomId}/exam-assignments/{assignmentId}")
    public ResponseEntity<Void> removeAssignment(@PathVariable Long classroomId, @PathVariable Long assignmentId) {
        portalService.removeClassroomAssignment(classroomId, assignmentId);
        return ResponseEntity.noContent().build();
    }
}
