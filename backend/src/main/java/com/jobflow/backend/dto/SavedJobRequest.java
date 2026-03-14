package com.jobflow.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SavedJobRequest(
        @NotNull UUID jobId,
        String notes,
        String status
) {}
