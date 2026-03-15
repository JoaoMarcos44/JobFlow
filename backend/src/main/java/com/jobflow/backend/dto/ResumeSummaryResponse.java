package com.jobflow.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record ResumeSummaryResponse(
        UUID id,
        String fileName,
        String contentType,
        Instant createdAt
) {}
