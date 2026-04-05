package com.jobflow.backend.repository;

import com.jobflow.backend.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {

    Optional<Job> findByCodanteId(Integer codanteId);
}
