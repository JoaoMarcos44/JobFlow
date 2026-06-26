package com.jobflow.backend.dto;

import java.util.List;

public record AiResumeAnalysisResponse(
        List<String> skillsDetectadas,
        String nivelEstimado,
        List<String> sugestoesAperfeicoamento,
        String resumoPerfil
) {}
