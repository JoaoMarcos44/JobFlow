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

    private final AuthService auth;
    private final UserService userService;

    public AuthController(AuthService auth, UserService userService) {
        this.auth = auth;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(new AuthResponse(auth.register(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(new AuthResponse(auth.login(req)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        auth.requestPasswordReset(req.email());
        return ResponseEntity.ok(Map.of(
                "message",
                "Se o e-mail existir na nossa base, receberá instruções para redefinir a palavra-passe."
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> me(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return userService.getProfileByEmail(auth.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}