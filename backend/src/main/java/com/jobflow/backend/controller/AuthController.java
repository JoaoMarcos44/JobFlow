package com.jobflow.backend.controller;

import com.jobflow.backend.dto.AuthResponse;
import com.jobflow.backend.dto.LoginRequest;
import com.jobflow.backend.dto.RegisterRequest;
import com.jobflow.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(new AuthResponse(auth.register(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(new AuthResponse(auth.login(req)));
    }
}