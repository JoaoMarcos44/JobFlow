package com.jobflow.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobflow.backend.dto.AiInterviewCoachResponse;
import com.jobflow.backend.dto.AiInterviewCoachResponse.RespostaModelo;
import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserSkillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiInterviewCoachService {

    private static final Logger log = LoggerFactory.getLogger(AiInterviewCoachService.class);
    private static final int DESCRIPTION_MAX = 800;
    private static final int REQUIREMENTS_MAX = 500;

    private final OllamaService ollamaService;
    private final UserSkillRepository userSkillRepository;
    private final ObjectMapper objectMapper;

    public AiInterviewCoachService(OllamaService ollamaService,
                                   UserSkillRepository userSkillRepository,
                                   ObjectMapper objectMapper) {
        this.ollamaService = ollamaService;
        this.userSkillRepository = userSkillRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Gera um plano de preparação para entrevista personalizado,
     * com perguntas técnicas, comportamentais, respostas modelo e dicas.
     * Tudo processado localmente via Ollama — nenhum dado sai da máquina.
     */
    public AiInterviewCoachResponse generateCoaching(User user, Job job) {
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
                Você é um coach de carreira sénior especializado em preparação para entrevistas técnicas em tecnologia.
                A sua tarefa é gerar um plano de preparação completo e personalizado para uma entrevista de emprego.
                Considere as skills do candidato para personalizar as respostas modelo.
                Gere perguntas realistas que são frequentemente feitas em entrevistas para posições similares.
                Responda SEMPRE em português de Portugal.
                Responda APENAS com o JSON solicitado, sem texto adicional, sem markdown, sem explicações fora do JSON.
                """;
    }

    private String buildUserMessage(Job job, List<String> userSkills) {
        String description = truncate(job.getDescription(), DESCRIPTION_MAX);
        String requirements = truncate(job.getRequirements(), REQUIREMENTS_MAX);
        String techs = job.getTechnologies() != null && !job.getTechnologies().isEmpty()
                ? String.join(", ", job.getTechnologies())
                : "Não especificadas";
        String skills = userSkills.isEmpty() ? "Nenhuma skill registada" : String.join(", ", userSkills);
        String benefits = truncate(job.getBenefits(), 300);

        return """
                Vaga: "%s" na empresa "%s"
                Localização: %s
                Tecnologias exigidas: %s
                Descrição: %s
                Requisitos: %s
                Benefícios: %s

                Skills do candidato: %s

                Gere um plano de preparação para entrevista. Responda APENAS com este JSON (sem texto adicional):
                {
                  "perguntasTecnicas": ["<pergunta técnica 1>", "<pergunta técnica 2>", "<pergunta técnica 3>", "<pergunta técnica 4>", "<pergunta técnica 5>"],
                  "perguntasComportamentais": ["<pergunta comportamental 1>", "<pergunta comportamental 2>", "<pergunta comportamental 3>"],
                  "respostasModelo": [
                    {"pergunta": "<uma das perguntas acima>", "sugestaoResposta": "<resposta modelo personalizada com as skills do candidato>"},
                    {"pergunta": "<outra pergunta>", "sugestaoResposta": "<resposta modelo personalizada>"},
                    {"pergunta": "<outra pergunta>", "sugestaoResposta": "<resposta modelo personalizada>"}
                  ],
                  "dicasPreparacao": ["<dica específica 1>", "<dica específica 2>", "<dica específica 3>", "<dica específica 4>"],
                  "pontosFortes": ["<ponto forte do candidato relevante para esta vaga 1>", "<ponto forte 2>", "<ponto forte 3>"],
                  "resumoVaga": "<resumo de 2-3 frases sobre o que a empresa procura e como se preparar>"
                }
                """.formatted(
                job.getTitle(),
                job.getCompany(),
                job.getLocation() != null ? job.getLocation() : "Não especificada",
                techs,
                description,
                requirements,
                benefits,
                skills
        );
    }

    private AiInterviewCoachResponse parseResponse(String rawJson) {
        try {
            String clean = extractJsonObject(rawJson);
            JsonNode node = objectMapper.readTree(clean);

            List<String> perguntasTecnicas = toStringList(node.get("perguntasTecnicas"));
            List<String> perguntasComportamentais = toStringList(node.get("perguntasComportamentais"));
            List<RespostaModelo> respostasModelo = toRespostaModeloList(node.get("respostasModelo"));
            List<String> dicasPreparacao = toStringList(node.get("dicasPreparacao"));
            List<String> pontosFortes = toStringList(node.get("pontosFortes"));
            String resumoVaga = node.path("resumoVaga").asText("Resumo não disponível.");

            return new AiInterviewCoachResponse(
                    perguntasTecnicas,
                    perguntasComportamentais,
                    respostasModelo,
                    dicasPreparacao,
                    pontosFortes,
                    resumoVaga
            );
        } catch (Exception e) {
            log.warn("Falha ao analisar resposta da IA (interview coach): {}", e.getMessage());
            return new AiInterviewCoachResponse(
                    List.of("Não foi possível gerar perguntas técnicas. Tente novamente."),
                    List.of("Não foi possível gerar perguntas comportamentais. Tente novamente."),
                    List.of(),
                    List.of("Reveja a descrição da vaga e prepare exemplos práticos das suas skills."),
                    List.of(),
                    "Análise indisponível. Verifique se o Ollama está ativo e tente novamente."
            );
        }
    }

    private List<RespostaModelo> toRespostaModeloList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<RespostaModelo> result = new ArrayList<>();
        node.forEach(n -> {
            String pergunta = n.path("pergunta").asText("").strip();
            String sugestao = n.path("sugestaoResposta").asText("").strip();
            if (!pergunta.isEmpty() && !sugestao.isEmpty()) {
                result.add(new RespostaModelo(pergunta, sugestao));
            }
        });
        return List.copyOf(result);
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
}
