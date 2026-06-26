package com.jobflow.backend.dto;

public record AiStatusResponse(
        boolean disponivel,
        String modelo,
        String baseUrl,
        String mensagem
) {}
