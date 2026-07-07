package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.service.PortalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/question-imports")
public class QuestionImportController {
    private final PortalService portalService;

    public QuestionImportController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PostMapping
    public ResponseEntity<ApiDtos.QuestionImportResultDto> importQuestions(
        @Valid @RequestBody ApiDtos.QuestionImportPayload payload
    ) {
        return ResponseEntity.ok(portalService.importQuestions(payload));
    }
}
