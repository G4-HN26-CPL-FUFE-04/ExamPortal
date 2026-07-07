package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.entity.enums.SessionStatus;
import com.examportal.backend.service.PortalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exam-sessions")
public class ExamSessionController {
    private final PortalService portalService;

    public ExamSessionController(PortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping
    public ResponseEntity<List<ApiDtos.ExamSessionDto>> getExamSessions() {
        return ResponseEntity.ok(portalService.getExamSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiDtos.ExamSessionDto> getExamSession(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getExamSession(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PostMapping
    public ResponseEntity<ApiDtos.ExamSessionDto> createSession(@Valid @RequestBody ApiDtos.ExamSessionPayload payload) {
        return ResponseEntity.ok(portalService.saveExamSession(payload, null));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiDtos.ExamSessionDto> updateSession(@PathVariable Long id,
                                                                @Valid @RequestBody ApiDtos.ExamSessionPayload payload) {
        return ResponseEntity.ok(portalService.saveExamSession(payload, id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        portalService.deleteExamSession(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiDtos.ExamSessionDto> updateStatus(@PathVariable Long id, @RequestParam SessionStatus status) {
        return ResponseEntity.ok(portalService.updateExamSessionStatus(id, status));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @GetMapping("/{id}/attempts")
    public ResponseEntity<List<ApiDtos.AttemptDto>> getAttempts(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getAttemptsBySession(id));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{id}/start")
    public ResponseEntity<ApiDtos.AttemptDto> start(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.startAttempt(id));
    }
}
