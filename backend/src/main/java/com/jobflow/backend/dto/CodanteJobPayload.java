package com.jobflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Payload para importar uma vaga do feed Codante para a tabela {@code jobs}. */
public record CodanteJobPayload(
        @NotNull Integer id,
        @NotBlank String title,
        @NotBlank String company,
        String companyWebsite,
        String city,
        String schedule,
        Integer salary,
        String description,
        String requirements,
        String createdAt,
        String updatedAt
) {}
