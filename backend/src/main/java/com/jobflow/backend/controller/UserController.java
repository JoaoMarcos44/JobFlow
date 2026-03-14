package com.jobflow.backend.controller;

import com.jobflow.backend.dto.ChangeEmailRequest;
import com.jobflow.backend.dto.ChangePasswordRequest;
import com.jobflow.backend.dto.ProfileResponse;
import com.jobflow.backend.dto.ProfileUpdateRequest;
import com.jobflow.backend.repository.UserRepository;
import com.jobflow.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        return Map.of("email", auth.getName());
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> profile(Authentication auth) {
        return userService.getProfileByEmail(auth.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody ProfileUpdateRequest request, Authentication auth) {
        return userService.updateProfile(auth.getName(), request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/skills")
    public List<String> skills(Authentication auth) {
        var user = userRepository.findByEmailIgnoreCase(auth.getName()).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return userService.getSkills(user.getId());
    }

    @PostMapping("/skills")
    public ResponseEntity<Void> addSkill(@Valid @RequestBody com.jobflow.backend.dto.AddSkillRequest request, Authentication auth) {
        var user = userRepository.findByEmailIgnoreCase(auth.getName()).orElseThrow(() -> new IllegalArgumentException("User not found"));
        try {
            userService.addSkill(user, request.skillName());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/skills/{skill}")
    public ResponseEntity<Void> removeSkill(Authentication auth, @PathVariable String skill) {
        var user = userRepository.findByEmailIgnoreCase(auth.getName()).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return userService.removeSkill(user, skill) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication auth) {
        try {
            userService.changePassword(auth.getName(), request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/email")
    public ResponseEntity<Void> changeEmail(@Valid @RequestBody ChangeEmailRequest request, Authentication auth) {
        try {
            userService.changeEmail(auth.getName(), request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}