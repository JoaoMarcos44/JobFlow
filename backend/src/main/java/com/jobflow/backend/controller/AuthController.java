package com.jobflow.backend.controller;

import com.jobflow.backend.dto.AuthResponse;
import com.jobflow.backend.dto.ForgotPasswordRequest;
import com.jobflow.backend.dto.LoginRequest;
import com.jobflow.backend.dto.ProfileResponse;
import com.jobflow.backend.dto.RegisterRequest;
import com.jobflow.backend.service.AuthService;
import com.jobflow.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(new AuthResponse(authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(new AuthResponse(authService.login(request)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(Map.of(
                "message",
                "Se o e-mail existir na nossa base, receberá instruções para redefinir a palavra-passe."
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> me(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        return userService.getProfileByEmail(authentication.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}