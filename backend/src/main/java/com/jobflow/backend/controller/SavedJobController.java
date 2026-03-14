package com.jobflow.backend.controller;

import com.jobflow.backend.dto.SavedJobRequest;
import com.jobflow.backend.dto.SavedJobResponse;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserRepository;
import com.jobflow.backend.service.SavedJobService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/saved-jobs")
public class SavedJobController {

    private final SavedJobService savedJobService;
    private final UserRepository userRepository;

    public SavedJobController(SavedJobService savedJobService, UserRepository userRepository) {
        this.savedJobService = savedJobService;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @GetMapping
    public Page<SavedJobResponse> list(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = currentUser(auth);
        Pageable pageable = PageRequest.of(page, size);
        return savedJobService.listByUser(user, pageable);
    }

    @PostMapping
    public ResponseEntity<SavedJobResponse> save(@Valid @RequestBody SavedJobRequest request, Authentication auth) {
        User user = currentUser(auth);
        try {
            return ResponseEntity.ok(savedJobService.save(user, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedJobResponse> getById(Authentication auth, @PathVariable UUID id) {
        User user = currentUser(auth);
        return savedJobService.getById(user, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedJobResponse> update(
            Authentication auth,
            @PathVariable UUID id,
            @RequestBody(required = false) UpdateSavedJobBody body
    ) {
        User user = currentUser(auth);
        String notes = body != null ? body.notes() : null;
        String status = body != null ? body.status() : null;
        return savedJobService.update(user, id, notes, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
        User user = currentUser(auth);
        return savedJobService.delete(user, id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    public record UpdateSavedJobBody(String notes, String status) {}
}
