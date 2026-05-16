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

    private static final long MAX_BYTES = 10 * 1024 * 1024;
    private static final List<String> KNOWN_TYPES = List.of(
            "application/pdf",
            "application/x-pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final ResumeRepository resumes;

    public ResumeService(ResumeRepository resumes) {
        this.resumes = resumes;
    }

    @Transactional(readOnly = true)
    public List<ResumeSummaryResponse> listByUser(User user) {
        return resumes.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<Resume> getById(User user, UUID id) {
        return resumes.findByUserIdAndId(user.getId(), id);
    }

    @Transactional
    public ResumeSummaryResponse upload(User user, MultipartFile file) throws IOException {
        assertValidFile(file, true);
        String contentType = file.getContentType();
        String fileName = fileNameOrDefault(file, contentType, defaultNameFor(contentType));
        Resume resume = new Resume(user, fileName, contentType, file.getBytes());
        resumes.save(resume);
        return toSummary(resume);
    }

    @Transactional
    public ResumeSummaryResponse replace(User user, UUID id, MultipartFile file) throws IOException {
        Resume resume = resumes.findByUserIdAndId(user.getId(), id)
                .orElseThrow(() -> new IllegalArgumentException("Currículo não encontrado"));
        assertValidFile(file, false);
        String contentType = file.getContentType();
        String fileName = fileNameOrDefault(file, contentType, resume.getFileName());
        resume.setFileName(fileName);
        resume.setContentType(contentType != null ? contentType : resume.getContentType());
        resume.setFileContent(file.getBytes());
        resumes.save(resume);
        return toSummary(resume);
    }

    @Transactional
    public boolean delete(User user, UUID id) {
        return resumes.findByUserIdAndId(user.getId(), id)
                .map(r -> {
                    resumes.delete(r);
                    return true;
                })
                .orElse(false);
    }

    private void assertValidFile(MultipartFile file, boolean includeReceivedTypeInError) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Ficheiro vazio");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Ficheiro demasiado grande (máx. 10 MB)");
        }
        String contentType = file.getContentType();
        if (!isAllowedType(contentType)) {
            if (includeReceivedTypeInError) {
                throw new IllegalArgumentException("Apenas PDF e DOCX são permitidos. Recebido: " + contentType);
            }
            throw new IllegalArgumentException("Apenas PDF e DOCX são permitidos.");
        }
    }

    private static boolean isAllowedType(String contentType) {
        if (contentType == null) {
            return false;
        }
        return KNOWN_TYPES.contains(contentType)
                || contentType.contains("pdf")
                || contentType.contains("wordprocessingml");
    }

    private static String fileNameOrDefault(MultipartFile file, String contentType, String whenBlank) {
        String cleaned = sanitizeFileName(file.getOriginalFilename());
        if (cleaned == null || cleaned.isBlank()) {
            return whenBlank;
        }
        return cleaned;
    }

    private static String defaultNameFor(String contentType) {
        boolean pdf = contentType != null && contentType.contains("pdf");
        return "curriculo." + (pdf ? "pdf" : "docx");
    }

    private ResumeSummaryResponse toSummary(Resume resume) {
        return new ResumeSummaryResponse(
                resume.getId(),
                resume.getFileName(),
                resume.getContentType(),
                resume.getCreatedAt()
        );
    }

    private static String sanitizeFileName(String name) {
        if (name == null) {
            return null;
        }
        return name.replaceAll("[^a-zA-Z0-9._\\-\\s]", "_").trim();
    }
}
