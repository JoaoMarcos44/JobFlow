package com.jobflow.backend.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record JobResponse(
        UUID id,
        String title,
        String company,
        String location,
        String description,
        String requirements,
        String benefits,
        List<String> technologies,
        String sourceUrl,
        LocalDate postedDate,
        Integer codanteId,
        Integer matchScore
) {}
