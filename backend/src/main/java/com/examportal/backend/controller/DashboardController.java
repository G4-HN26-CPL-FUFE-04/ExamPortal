package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.service.PortalService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final PortalService portalService;

    public DashboardController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/overview")
    public ResponseEntity<ApiDtos.DashboardOverviewDto> overview() {
        return ResponseEntity.ok(portalService.getDashboardOverview());
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/exam-stats")
    public ResponseEntity<List<ApiDtos.DashboardExamStatsDto>> examStats() {
        return ResponseEntity.ok(portalService.getDashboardExamStats());
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/question-stats")
    public ResponseEntity<ApiDtos.DashboardQuestionStatsDto> questionStats() {
        return ResponseEntity.ok(portalService.getDashboardQuestionStats());
    }
}
