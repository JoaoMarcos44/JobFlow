package com.jobflow.backend.dto;

import java.util.List;

public record AiInterviewCoachResponse(
        List<String> perguntasTecnicas,
        List<String> perguntasComportamentais,
        List<RespostaModelo> respostasModelo,
        List<String> dicasPreparacao,
        List<String> pontosFortes,
        String resumoVaga
) {
    /**
     * Cada resposta modelo associa uma pergunta provável à sugestão de resposta
     * personalizada com as skills do candidato.
     */
    public record RespostaModelo(String pergunta, String sugestaoResposta) {}
}
