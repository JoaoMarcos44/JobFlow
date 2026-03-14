package com.jobflow.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record SavedJobResponse(
        UUID id,
        JobResponse job,
        String notes,
        Integer matchScore,
        String status,
        Instant savedAt,
        Instant updatedAt
) {}
