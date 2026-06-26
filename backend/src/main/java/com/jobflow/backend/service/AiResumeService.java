package com.jobflow.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobflow.backend.dto.AiResumeAnalysisResponse;
import com.jobflow.backend.model.Resume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiResumeService {

    private static final Logger log = LoggerFactory.getLogger(AiResumeService.class);

    private final OllamaService ollamaService;
    private final ResumeTextExtractorService textExtractor;
    private final ObjectMapper objectMapper;

    public AiResumeService(OllamaService ollamaService,
                           ResumeTextExtractorService textExtractor,
                           ObjectMapper objectMapper) {
        this.ollamaService = ollamaService;
        this.textExtractor = textExtractor;
        this.objectMapper = objectMapper;
    }

    /**
     * Extrai texto do currículo, envia para o LLM local e devolve skills detetadas,
     * nível estimado e sugestões de melhoria — tudo processado offline.
     */
    public AiResumeAnalysisResponse analyze(Resume resume) {
        String resumeText = textExtractor.extractText(resume.getFileContent(), resume.getContentType());

        String systemPrompt = buildSystemPrompt();
        String userMessage = buildUserMessage(resume.getFileName(), resumeText);

        String rawJson = ollamaService.chat(systemPrompt, userMessage);
        return parseResponse(rawJson);
    }

    private String buildSystemPrompt() {
        return """
                Você é um especialista em Recursos Humanos e coach de carreira em tecnologia.
                Analise currículos e extraia informação estruturada de forma precisa.
                Responda SEMPRE em português de Portugal.
                Responda APENAS com o JSON solicitado, sem texto adicional, sem markdown.
                """;
    }

    private String buildUserMessage(String fileName, String resumeText) {
        return """
                Analise o seguinte currículo ("%s") e extraia:
                1. Skills técnicas detetadas (linguagens, frameworks, ferramentas, plataformas)
                2. Nível de experiência estimado (Junior, Pleno ou Sénior)
                3. Três sugestões concretas de melhoria do currículo
                4. Um resumo de perfil profissional em 2 frases

                Texto do currículo:
                ---
                %s
                ---

                Responda APENAS com este JSON (sem texto adicional):
                {
                  "skillsDetectadas": ["<skill1>", "<skill2>", "..."],
                  "nivelEstimado": "<Junior | Pleno | Sénior>",
                  "sugestoesAperfeicoamento": ["<sugestão 1>", "<sugestão 2>", "<sugestão 3>"],
                  "resumoPerfil": "<resumo profissional em 2 frases>"
                }
                """.formatted(fileName, resumeText);
    }

    private AiResumeAnalysisResponse parseResponse(String rawJson) {
        try {
            String clean = extractJsonObject(rawJson);
            JsonNode node = objectMapper.readTree(clean);

            List<String> skills = toStringList(node.get("skillsDetectadas"));
            String nivel = node.path("nivelEstimado").asText("Não determinado");
            List<String> sugestoes = toStringList(node.get("sugestoesAperfeicoamento"));
            String perfil = node.path("resumoPerfil").asText("Perfil não disponível.");

            return new AiResumeAnalysisResponse(skills, nivel, sugestoes, perfil);
        } catch (Exception e) {
            log.warn("Falha ao analisar resposta da IA (resume analysis): {}", e.getMessage());
            return new AiResumeAnalysisResponse(
                    List.of(),
                    "Não determinado",
                    List.of("Não foi possível interpretar a resposta da IA. Tente novamente."),
                    "Análise indisponível."
            );
        }
    }

    private static String extractJsonObject(String raw) {
        if (raw == null) return "{}";
        String s = raw.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").strip();
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        return (start >= 0 && end > start) ? s.substring(start, end + 1) : s;
    }

    private static List<String> toStringList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> result = new ArrayList<>();
        node.forEach(n -> {
            String text = n.asText("").strip();
            if (!text.isEmpty()) result.add(text);
        });
        return List.copyOf(result);
    }
}
