package com.jobflow.backend.service;

import com.jobflow.backend.dto.ResumeSummaryResponse;
import com.jobflow.backend.model.Resume;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.ResumeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ResumeService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "application/x-pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    );

    private final ResumeRepository resumeRepository;

    public ResumeService(ResumeRepository resumeRepository) {
        this.resumeRepository = resumeRepository;
    }

    @Transactional(readOnly = true)
    public List<ResumeSummaryResponse> listByUser(User user) {
        return resumeRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<Resume> getById(User user, UUID id) {
        return resumeRepository.findByUserIdAndId(user.getId(), id);
    }

    @Transactional
    public ResumeSummaryResponse upload(User user, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Ficheiro vazio");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Ficheiro demasiado grande (máx. 10 MB)");
        }
        String contentType = file.getContentType();
        boolean allowed = contentType != null && (ALLOWED_TYPES.contains(contentType)
                || contentType.contains("pdf") || contentType.contains("wordprocessingml"));
        if (!allowed) {
            throw new IllegalArgumentException("Apenas PDF e DOCX são permitidos. Recebido: " + contentType);
        }
        String fileName = sanitizeFileName(file.getOriginalFilename());
        if (fileName == null || fileName.isBlank()) {
            fileName = "curriculo." + (contentType.contains("pdf") ? "pdf" : "docx");
        }
        byte[] content = file.getBytes();
        Resume resume = new Resume(user, fileName, contentType, content);
        resumeRepository.save(resume);
        return toSummary(resume);
    }

    @Transactional
    public boolean delete(User user, UUID id) {
        return resumeRepository.findByUserIdAndId(user.getId(), id)
                .map(r -> {
                    resumeRepository.delete(r);
                    return true;
                })
                .orElse(false);
    }

    private ResumeSummaryResponse toSummary(Resume r) {
        return new ResumeSummaryResponse(r.getId(), r.getFileName(), r.getContentType(), r.getCreatedAt());
    }

    private static String sanitizeFileName(String name) {
        if (name == null) return null;
        return name.replaceAll("[^a-zA-Z0-9._\\-\\s]", "_").trim();
    }
}
