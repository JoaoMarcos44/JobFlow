package com.jobflow.backend.controller;

import com.jobflow.backend.dto.ResumeSummaryResponse;
import com.jobflow.backend.model.Resume;
import com.jobflow.backend.model.User;
import com.jobflow.backend.service.AuthenticatedUserService;
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
    private final AuthenticatedUserService currentUser;

    public ResumeController(ResumeService resumeService, AuthenticatedUserService currentUser) {
        this.resumeService = resumeService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<ResumeSummaryResponse> list(Authentication authentication) {
        return resumeService.listByUser(currentUser.requireUser(authentication));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeSummaryResponse> upload(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        User user = currentUser.requireUser(authentication);
        return ResponseEntity.ok(resumeService.upload(user, file));
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> download(Authentication authentication, @PathVariable UUID id) {
        User user = currentUser.requireUser(authentication);
        return resumeService.getById(user, id)
                .map(this::attachmentResponse)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeSummaryResponse> replace(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        User user = currentUser.requireUser(authentication);
        try {
            return ResponseEntity.ok(resumeService.replace(user, id, file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID id) {
        User user = currentUser.requireUser(authentication);
        return resumeService.delete(user, id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    private ResponseEntity<byte[]> attachmentResponse(Resume resume) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(resume.getContentType()));
        headers.setContentDispositionFormData("attachment", resume.getFileName());
        return ResponseEntity.ok().headers(headers).body(resume.getFileContent());
    }
}
