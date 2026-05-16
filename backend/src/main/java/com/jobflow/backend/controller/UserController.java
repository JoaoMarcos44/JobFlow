package com.jobflow.backend.controller;

import com.jobflow.backend.dto.AddSkillRequest;
import com.jobflow.backend.dto.ChangeEmailRequest;
import com.jobflow.backend.dto.ChangePasswordRequest;
import com.jobflow.backend.dto.ProfileResponse;
import com.jobflow.backend.dto.ProfileUpdateRequest;
import com.jobflow.backend.model.User;
import com.jobflow.backend.service.AuthenticatedUserService;
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
    private final AuthenticatedUserService currentUser;

    public UserController(UserService userService, AuthenticatedUserService currentUser) {
        this.userService = userService;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        return Map.of("email", authentication.getName());
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> profile(Authentication authentication) {
        return userService.getProfileByEmail(authentication.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication
    ) {
        return userService.updateProfile(authentication.getName(), request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/skills")
    public List<String> skills(Authentication authentication) {
        User user = currentUser.requireUser(authentication);
        return userService.getSkills(user.getId());
    }

    @PostMapping("/skills")
    public ResponseEntity<Void> addSkill(@Valid @RequestBody AddSkillRequest request, Authentication authentication) {
        User user = currentUser.requireUser(authentication);
        try {
            userService.addSkill(user, request.skillName());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/skills/{skill}")
    public ResponseEntity<Void> removeSkill(Authentication authentication, @PathVariable String skill) {
        User user = currentUser.requireUser(authentication);
        return userService.removeSkill(user, skill) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        try {
            userService.changePassword(authentication.getName(), request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/email")
    public ResponseEntity<Void> changeEmail(@Valid @RequestBody ChangeEmailRequest request, Authentication authentication) {
        try {
            userService.changeEmail(authentication.getName(), request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
