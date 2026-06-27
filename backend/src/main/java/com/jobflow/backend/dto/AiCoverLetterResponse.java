package com.jobflow.backend.dto;

import java.util.List;

/**
 * Carta de apresentação gerada pela IA local, personalizada
 * para uma vaga específica com base nas skills do candidato.
 */
public record AiCoverLetterResponse(
        String cartaCompleta,
        String assunto,
        List<String> pontosDestaque,
        String tomSugerido,
        String dicaPersonalizacao
) {}
