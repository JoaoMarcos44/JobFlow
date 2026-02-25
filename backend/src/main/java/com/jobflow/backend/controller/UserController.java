package com.jobflow.backend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        // auth.getName() will be set to email in our JWT filter
        return Map.of("email", auth.getName());
    }
}