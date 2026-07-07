package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.service.PortalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final PortalService portalService;

    public AuthController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiDtos.AuthResponse> register(@Valid @RequestBody ApiDtos.RegisterRequest request) {
        return ResponseEntity.ok(portalService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiDtos.AuthResponse> login(@Valid @RequestBody ApiDtos.AuthRequest request) {
        return ResponseEntity.ok(portalService.login(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ApiDtos.ChangePasswordRequest request) {
        portalService.changePassword(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<ApiDtos.UserDto> me() {
        return ResponseEntity.ok(portalService.me());
    }
}
