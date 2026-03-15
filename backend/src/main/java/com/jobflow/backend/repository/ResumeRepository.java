package com.jobflow.backend.repository;

import com.jobflow.backend.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    List<Resume> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Resume> findByUserIdAndId(UUID userId, UUID id);
}
