package com.jobflow.backend.repository;

import com.jobflow.backend.model.MatchAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MatchAnalysisRepository extends JpaRepository<MatchAnalysis, UUID> {
    Optional<MatchAnalysis> findFirstByUserIdAndJobIdOrderByCreatedAtDesc(UUID userId, UUID jobId);
}
