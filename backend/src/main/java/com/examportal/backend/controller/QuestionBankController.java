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
@RequestMapping("/api/question-banks")
public class QuestionBankController {
    private final PortalService portalService;

    public QuestionBankController(PortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping
    public ResponseEntity<List<ApiDtos.QuestionBankDto>> getQuestionBanks(@RequestParam Long subjectId) {
        return ResponseEntity.ok(portalService.getQuestionBanks(subjectId));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PostMapping
    public ResponseEntity<ApiDtos.QuestionBankDto> createQuestionBank(
        @Valid @RequestBody ApiDtos.QuestionBankPayload payload
    ) {
        return ResponseEntity.ok(portalService.saveQuestionBank(payload, null));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiDtos.QuestionBankDto> updateQuestionBank(
        @PathVariable Long id,
        @Valid @RequestBody ApiDtos.QuestionBankPayload payload
    ) {
        return ResponseEntity.ok(portalService.saveQuestionBank(payload, id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestionBank(@PathVariable Long id) {
        portalService.deleteQuestionBank(id);
        return ResponseEntity.noContent().build();
    }
}
