package com.jobflow.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record SaveSavedJobFromCodanteRequest(
        @NotNull @Valid CodanteJobPayload codanteJob,
        String notes,
        String status
) {}
