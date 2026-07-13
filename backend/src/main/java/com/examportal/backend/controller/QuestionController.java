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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {
    private final PortalService portalService;

    public QuestionController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping
    public ResponseEntity<List<ApiDtos.QuestionSummaryDto>> getQuestions(@RequestParam(required = false) String keyword,
                                                                         @RequestParam(required = false) Long subjectId,
                                                                         @RequestParam(required = false) Long questionBankId) {
        return ResponseEntity.ok(portalService.getQuestions(keyword, subjectId, questionBankId));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiDtos.QuestionDetailDto> getQuestion(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getQuestion(id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<ApiDtos.QuestionDetailDto> createQuestion(@Valid @RequestBody ApiDtos.QuestionPayload payload) {
        return ResponseEntity.ok(portalService.saveQuestion(payload, null));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiDtos.QuestionDetailDto> updateQuestion(@PathVariable Long id,
                                                                    @Valid @RequestBody ApiDtos.QuestionPayload payload) {
        return ResponseEntity.ok(portalService.saveQuestion(payload, id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        portalService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
