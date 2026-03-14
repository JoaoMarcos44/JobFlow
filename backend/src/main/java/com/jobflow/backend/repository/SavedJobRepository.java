package com.jobflow.backend.repository;

import com.jobflow.backend.model.SavedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface SavedJobRepository extends JpaRepository<SavedJob, UUID> {
    Page<SavedJob> findByUserIdOrderBySavedAtDesc(UUID userId, Pageable pageable);
    Optional<SavedJob> findByUserIdAndId(UUID userId, UUID savedJobId);
    Optional<SavedJob> findByUserIdAndJobId(UUID userId, UUID jobId);
    boolean existsByUserIdAndJobId(UUID userId, UUID jobId);

    @Query("SELECT s FROM SavedJob s JOIN FETCH s.job WHERE s.user.id = :userId AND s.id = :id")
    Optional<SavedJob> findByUserIdAndIdWithJob(UUID userId, UUID id);
}
