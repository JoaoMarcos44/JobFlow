package com.jobflow.backend.controller;

import com.jobflow.backend.dto.JobResponse;
import com.jobflow.backend.dto.MatchResponse;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserRepository;
import com.jobflow.backend.service.JobService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;
    private final UserRepository userRepository;

    public JobController(JobService jobService, UserRepository userRepository) {
        this.jobService = jobService;
        this.userRepository = userRepository;
    }

    @GetMapping("/feed")
    public Page<JobResponse> feed(
            Authentication auth,
            @RequestParam(required = false) String technology,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = auth != null ? userRepository.findByEmailIgnoreCase(auth.getName()).orElse(null) : null;
        Pageable pageable = PageRequest.of(page, size);
        return jobService.getFeed(user, technology, pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getById(Authentication auth, @PathVariable UUID id) {
        User user = auth != null ? userRepository.findByEmailIgnoreCase(auth.getName()).orElse(null) : null;
        return jobService.getById(user, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/match")
    public ResponseEntity<MatchResponse> getMatch(Authentication auth, @PathVariable UUID id) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return jobService.getMatchAnalysis(user, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
