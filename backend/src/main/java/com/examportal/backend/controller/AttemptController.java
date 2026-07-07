package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.service.PortalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AttemptController {
    private final PortalService portalService;

    public AttemptController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/attempts/{id}/answers")
    public ResponseEntity<ApiDtos.AttemptDto> saveAnswers(@PathVariable Long id,
                                                          @Valid @RequestBody ApiDtos.AttemptSubmitPayload payload) {
        return ResponseEntity.ok(portalService.submitAttempt(id, new ApiDtos.AttemptSubmitPayload(payload.answers(), false)));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/attempts/{id}/submit")
    public ResponseEntity<ApiDtos.AttemptDto> submitAttempt(@PathVariable Long id,
                                                            @RequestBody(required = false) ApiDtos.AttemptSubmitPayload payload) {
        ApiDtos.AttemptSubmitPayload request = payload == null
            ? new ApiDtos.AttemptSubmitPayload(List.of(), false)
            : payload;
        return ResponseEntity.ok(portalService.submitAttempt(id, request));
    }

    @GetMapping("/attempts/{id}")
    public ResponseEntity<ApiDtos.AttemptDto> getAttempt(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getAttempt(id));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/my-attempts")
    public ResponseEntity<List<ApiDtos.AttemptDto>> myAttempts() {
        return ResponseEntity.ok(portalService.getMyAttempts());
    }
}
