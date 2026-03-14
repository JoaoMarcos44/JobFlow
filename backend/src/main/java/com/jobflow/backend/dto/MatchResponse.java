package com.jobflow.backend.dto;

import java.util.List;

public record MatchResponse(
        int matchScore,
        String analysisText,
        List<String> missingSkills
) {}
