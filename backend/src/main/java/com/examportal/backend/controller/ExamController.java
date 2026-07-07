package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.service.PortalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
        return ResponseEntity.ok(portalService.getExams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiDtos.ExamDto> getExam(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getExam(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PostMapping
    public ResponseEntity<ApiDtos.ExamDto> createExam(@Valid @RequestBody ApiDtos.ExamPayload payload) {
        return ResponseEntity.ok(portalService.saveExam(payload, null));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiDtos.ExamDto> updateExam(@PathVariable Long id, @Valid @RequestBody ApiDtos.ExamPayload payload) {
        return ResponseEntity.ok(portalService.saveExam(payload, id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable Long id) {
        portalService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PostMapping("/{id}/questions")
    public ResponseEntity<ApiDtos.ExamDto> addQuestion(@PathVariable Long id,
                                                       @Valid @RequestBody ApiDtos.ExamQuestionPayload payload) {
        return ResponseEntity.ok(portalService.addQuestionToExam(id, payload));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<Void> removeQuestion(@PathVariable Long id, @PathVariable Long questionId) {
        portalService.removeQuestionFromExam(id, questionId);
        return ResponseEntity.noContent().build();
    }
}
