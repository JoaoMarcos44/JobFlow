package com.jobflow.backend.dto;

import java.util.List;

public record AiJobAnalysisResponse(
        int pontuacao,
        String resumo,
        List<String> skillsFaltantes,
        List<String> planoEstudo,
        List<String> bulletsCoverLetter,
        String recomendacao
) {}
