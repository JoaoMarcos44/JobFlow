package com.jobflow.backend.controller;

import com.jobflow.backend.dto.JobResponse;
import com.jobflow.backend.dto.MatchResponse;
import com.jobflow.backend.model.User;
import com.jobflow.backend.service.AuthenticatedUserService;
import com.jobflow.backend.service.JobService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;
    private final AuthenticatedUserService currentUser;

    public JobController(JobService jobService, AuthenticatedUserService currentUser) {
        this.jobService = jobService;
        this.currentUser = currentUser;
    }

    @GetMapping("/feed")
    public Page<JobResponse> feed(
            Authentication authentication,
            @RequestParam(required = false) String technology,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = currentUser.resolveUser(authentication);
        Pageable pageable = PageRequest.of(page, size);
        return jobService.getFeed(user, technology, pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getById(Authentication authentication, @PathVariable UUID id) {
        User user = currentUser.resolveUser(authentication);
        return jobService.getById(user, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/match")
    public ResponseEntity<MatchResponse> getMatch(Authentication authentication, @PathVariable UUID id) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        User user = currentUser.requireUser(authentication);
        return jobService.getMatchAnalysis(user, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
