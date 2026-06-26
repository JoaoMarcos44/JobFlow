package com.jobflow.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobflow.backend.dto.AiJobAnalysisResponse;
import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserSkillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiMatchService {

    private static final Logger log = LoggerFactory.getLogger(AiMatchService.class);
    private static final int DESCRIPTION_MAX = 600;
    private static final int REQUIREMENTS_MAX = 400;

    private final OllamaService ollamaService;
    private final UserSkillRepository userSkillRepository;
    private final ObjectMapper objectMapper;

    public AiMatchService(OllamaService ollamaService,
                          UserSkillRepository userSkillRepository,
                          ObjectMapper objectMapper) {
        this.ollamaService = ollamaService;
        this.userSkillRepository = userSkillRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Analisa semanticamente a compatibilidade entre o utilizador e a vaga.
     * Vai além da simples correspondência de keywords, considerando equivalências
     * semânticas (ex: "JS" ↔ "JavaScript") e contexto da descrição.
     */
    public AiJobAnalysisResponse analyze(User user, Job job) {
        List<String> userSkills = userSkillRepository.findByUserIdOrderBySkillNameAsc(user.getId())
                .stream()
                .map(s -> s.getSkillName())
                .toList();

        String systemPrompt = buildSystemPrompt();
        String userMessage = buildUserMessage(job, userSkills);

        String rawJson = ollamaService.chat(systemPrompt, userMessage);
        return parseResponse(rawJson);
    }

    private String buildSystemPrompt() {
        return """
                Você é um assistente de carreira especializado em tecnologia.
                A sua tarefa é analisar a compatibilidade entre um candidato e uma vaga de emprego.
                Considere equivalências semânticas entre tecnologias (ex: "JS" = "JavaScript", "Postgres" = "PostgreSQL").
                Responda SEMPRE em português de Portugal.
                Responda APENAS com o JSON solicitado, sem texto adicional, sem markdown, sem explicações fora do JSON.
                """;
    }

    private String buildUserMessage(Job job, List<String> userSkills) {
        String description = truncate(job.getDescription(), DESCRIPTION_MAX);
        String requirements = truncate(job.getRequirements(), REQUIREMENTS_MAX);
        String techs = job.getTechnologies() != null
                ? String.join(", ", job.getTechnologies())
                : "Não especificadas";
        String skills = userSkills.isEmpty() ? "Nenhuma skill registada" : String.join(", ", userSkills);

        return """
                Vaga: "%s" na empresa "%s"
                Tecnologias exigidas: %s
                Descrição: %s
                Requisitos: %s

                Skills do candidato: %s

                Responda APENAS com este JSON (sem texto adicional):
                {
                  "pontuacao": <número 0-100 considerando compatibilidade semântica e experiência implícita>,
                  "resumo": "<análise de 2-3 frases sobre a compatibilidade do candidato com a vaga>",
                  "skillsFaltantes": ["<skill1>", "<skill2>"],
                  "planoEstudo": ["<recurso ou ação concreta para aprender skill1>", "<para skill2>"],
                  "bulletsCoverLetter": ["<bullet point 1 para carta de apresentação>", "<bullet point 2>"],
                  "recomendacao": "<Candidatar-se agora | Desenvolver skills primeiro | Não recomendado>"
                }
                """.formatted(
                job.getTitle(), job.getCompany(), techs, description, requirements, skills
        );
    }

    private AiJobAnalysisResponse parseResponse(String rawJson) {
        try {
            String clean = extractJsonObject(rawJson);
            JsonNode node = objectMapper.readTree(clean);

            int pontuacao = clamp(node.path("pontuacao").asInt(0), 0, 100);
            String resumo = node.path("resumo").asText("Análise não disponível.");
            List<String> skillsFaltantes = toStringList(node.get("skillsFaltantes"));
            List<String> planoEstudo = toStringList(node.get("planoEstudo"));
            List<String> bullets = toStringList(node.get("bulletsCoverLetter"));
            String recomendacao = node.path("recomendacao").asText("Consulte a análise.");

            return new AiJobAnalysisResponse(pontuacao, resumo, skillsFaltantes, planoEstudo, bullets, recomendacao);
        } catch (Exception e) {
            log.warn("Falha ao analisar resposta da IA (job analysis): {}", e.getMessage());
            return new AiJobAnalysisResponse(
                    0,
                    "Não foi possível interpretar a resposta da IA. Tente novamente.",
                    List.of(), List.of(), List.of(),
                    "Indisponível"
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

    private static String truncate(String text, int max) {
        if (text == null) return "";
        String t = text.strip();
        return t.length() > max ? t.substring(0, max) + "…" : t;
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
