package com.jobflow.backend.controller;

import com.jobflow.backend.dto.ResumeSummaryResponse;
import com.jobflow.backend.model.Resume;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserRepository;
import com.jobflow.backend.service.ResumeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService resumeService;
    private final UserRepository userRepository;

    public ResumeController(ResumeService resumeService, UserRepository userRepository) {
        this.resumeService = resumeService;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @GetMapping
    public List<ResumeSummaryResponse> list(Authentication auth) {
        return resumeService.listByUser(currentUser(auth));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeSummaryResponse> upload(
            Authentication auth,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        User user = currentUser(auth);
        ResumeSummaryResponse created = resumeService.upload(user, file);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> download(Authentication auth, @PathVariable UUID id) {
        User user = currentUser(auth);
        return resumeService.getById(user, id)
                .map(resume -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(resume.getContentType()));
                    headers.setContentDispositionFormData("attachment", resume.getFileName());
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(resume.getFileContent());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeSummaryResponse> replace(
            Authentication auth,
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        User user = currentUser(auth);
        try {
            return ResponseEntity.ok(resumeService.replace(user, id, file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
        User user = currentUser(auth);
        return resumeService.delete(user, id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
