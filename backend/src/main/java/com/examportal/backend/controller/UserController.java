package com.examportal.backend.controller;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.entity.enums.RoleName;
import com.examportal.backend.entity.enums.UserStatus;
import com.examportal.backend.service.PortalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final PortalService portalService;

    public UserController(PortalService portalService) {
        this.portalService = portalService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ApiDtos.UserDto>> getUsers(@RequestParam(required = false) String keyword,
                                                          @RequestParam(required = false) UserStatus status,
                                                          @RequestParam(required = false) RoleName role) {
        return ResponseEntity.ok(portalService.getUsers(keyword, status, role));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiDtos.UserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(portalService.getUser(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiDtos.UserDto> createUser(@Valid @RequestBody ApiDtos.UserPayload payload) {
        return ResponseEntity.ok(portalService.saveUser(payload, null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiDtos.UserDto> updateUser(@PathVariable Long id, @Valid @RequestBody ApiDtos.UserPayload payload) {
        return ResponseEntity.ok(portalService.saveUser(payload, id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiDtos.UserDto> updateStatus(@PathVariable Long id, @RequestParam UserStatus status) {
        return ResponseEntity.ok(portalService.updateUserStatus(id, status));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiDtos.UserDto> updateRole(@PathVariable Long id, @RequestParam RoleName role) {
        return ResponseEntity.ok(portalService.updateUserRole(id, role));
    }
}
