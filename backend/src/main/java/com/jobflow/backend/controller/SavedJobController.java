package com.jobflow.backend.controller;

import com.jobflow.backend.dto.SaveSavedJobFromCodanteRequest;
import com.jobflow.backend.dto.SavedJobRequest;
import com.jobflow.backend.dto.SavedJobResponse;
import com.jobflow.backend.model.User;
import com.jobflow.backend.service.AuthenticatedUserService;
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
    private final AuthenticatedUserService currentUser;

    public SavedJobController(SavedJobService savedJobService, AuthenticatedUserService currentUser) {
        this.savedJobService = savedJobService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public Page<SavedJobResponse> list(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = currentUser.requireUser(authentication);
        Pageable pageable = PageRequest.of(page, size);
        return savedJobService.listByUser(user, pageable);
    }

    @PostMapping
    public ResponseEntity<SavedJobResponse> save(
            @Valid @RequestBody SavedJobRequest request,
            Authentication authentication
    ) {
        User user = currentUser.requireUser(authentication);
        try {
            return ResponseEntity.ok(savedJobService.save(user, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/from-codante")
    public ResponseEntity<SavedJobResponse> saveFromCodante(
            @Valid @RequestBody SaveSavedJobFromCodanteRequest request,
            Authentication authentication
    ) {
        User user = currentUser.requireUser(authentication);
        try {
            return ResponseEntity.ok(savedJobService.saveFromCodante(user, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedJobResponse> getById(Authentication authentication, @PathVariable UUID id) {
        User user = currentUser.requireUser(authentication);
        return savedJobService.getById(user, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedJobResponse> update(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody(required = false) UpdateSavedJobBody body
    ) {
        User user = currentUser.requireUser(authentication);
        String notes = body != null ? body.notes() : null;
        String status = body != null ? body.status() : null;
        return savedJobService.update(user, id, notes, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID id) {
        User user = currentUser.requireUser(authentication);
        return savedJobService.delete(user, id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    public record UpdateSavedJobBody(String notes, String status) {}
}
