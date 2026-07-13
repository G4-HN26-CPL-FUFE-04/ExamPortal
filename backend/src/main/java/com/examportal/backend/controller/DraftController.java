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
@RequestMapping("/api/drafts")
public class DraftController {
    private final PortalService portalService;

    public DraftController(PortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping
    public ResponseEntity<List<ApiDtos.ExamDto>> getDrafts() {
        return ResponseEntity.ok(portalService.getDrafts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiDtos.ExamDto> getDraft(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getDraft(id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<ApiDtos.ExamDto> createDraft(@Valid @RequestBody ApiDtos.ExamPayload payload) {
        return ResponseEntity.ok(portalService.saveDraft(payload, null));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiDtos.ExamDto> updateDraft(@PathVariable Long id, @Valid @RequestBody ApiDtos.ExamPayload payload) {
        return ResponseEntity.ok(portalService.saveDraft(payload, id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        portalService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{id}/questions")
    public ResponseEntity<ApiDtos.ExamDto> addQuestion(@PathVariable Long id,
                                                       @Valid @RequestBody ApiDtos.ExamQuestionPayload payload) {
        return ResponseEntity.ok(portalService.addQuestionToExam(id, payload));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{id}/questions/bulk")
    public ResponseEntity<ApiDtos.ExamDto> addQuestions(@PathVariable Long id,
                                                        @Valid @RequestBody ApiDtos.ExamBulkQuestionPayload payload) {
        return ResponseEntity.ok(portalService.addQuestionsToExam(id, payload));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<Void> removeQuestion(@PathVariable Long id, @PathVariable Long questionId) {
        portalService.removeQuestionFromExam(id, questionId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id}/questions/reorder")
    public ResponseEntity<ApiDtos.ExamDto> reorderQuestions(@PathVariable Long id,
                                                            @Valid @RequestBody ApiDtos.ExamQuestionReorderPayload payload) {
        return ResponseEntity.ok(portalService.reorderExamQuestions(id, payload));
    }
}
