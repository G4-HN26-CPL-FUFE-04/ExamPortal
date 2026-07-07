package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.service.PortalService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exams")
public class ExamController {
    private final PortalService portalService;

    public ExamController(PortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping
    public ResponseEntity<List<ApiDtos.ExamDto>> getExams() {
        return ResponseEntity.ok(portalService.getPublishedExams());
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiDtos.ExamDto> publishExam(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.publishExam(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<ApiDtos.ExamDto> unpublishExam(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.unpublishExam(id));
    }
}
