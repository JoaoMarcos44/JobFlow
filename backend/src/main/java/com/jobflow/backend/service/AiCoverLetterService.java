package com.jobflow.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobflow.backend.dto.AiCoverLetterResponse;
import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserSkillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiCoverLetterService {

    private static final Logger log = LoggerFactory.getLogger(AiCoverLetterService.class);
    private static final int DESCRIPTION_MAX = 800;
    private static final int REQUIREMENTS_MAX = 500;

    private final OllamaService ollamaService;
    private final UserSkillRepository userSkillRepository;
    private final ObjectMapper objectMapper;

    public AiCoverLetterService(OllamaService ollamaService,
                                UserSkillRepository userSkillRepository,
                                ObjectMapper objectMapper) {
        this.ollamaService = ollamaService;
        this.userSkillRepository = userSkillRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Gera uma carta de apresentação personalizada para uma vaga,
     * com base nas skills do candidato e nos requisitos da posição.
     * Tudo processado localmente via Ollama — nenhum dado sai da máquina.
     */
    public AiCoverLetterResponse generate(User user, Job job) {
        List<String> userSkills = userSkillRepository.findByUserIdOrderBySkillNameAsc(user.getId())
                .stream()
                .map(s -> s.getSkillName())
                .toList();

        String systemPrompt = buildSystemPrompt();
        String userMessage = buildUserMessage(user, job, userSkills);

        String rawJson = ollamaService.chat(systemPrompt, userMessage);
        return parseResponse(rawJson);
    }

    private String buildSystemPrompt() {
        return """
                Você é um redator profissional especializado em cartas de apresentação para vagas de tecnologia.
                A sua tarefa é gerar uma carta de apresentação completa, profissional e personalizada.
                A carta deve ser convincente, destacar as competências relevantes do candidato e demonstrar
                conhecimento sobre a empresa e a posição.
                Use um tom profissional mas acessível, evitando clichés e frases genéricas.
                Responda SEMPRE em português de Portugal.
                Responda APENAS com o JSON solicitado, sem texto adicional, sem markdown, sem explicações fora do JSON.
                """;
    }

    private String buildUserMessage(User user, Job job, List<String> userSkills) {
        String description = truncate(job.getDescription(), DESCRIPTION_MAX);
        String requirements = truncate(job.getRequirements(), REQUIREMENTS_MAX);
        String techs = job.getTechnologies() != null && !job.getTechnologies().isEmpty()
                ? String.join(", ", job.getTechnologies())
                : "Não especificadas";
        String skills = userSkills.isEmpty() ? "Nenhuma skill registada" : String.join(", ", userSkills);
        String benefits = truncate(job.getBenefits(), 300);

        return """
                Dados do candidato:
                  Email: %s
                  Skills: %s

                Dados da vaga:
                  Título: "%s"
                  Empresa: "%s"
                  Localização: %s
                  Tecnologias: %s
                  Descrição: %s
                  Requisitos: %s
                  Benefícios: %s

                Gere uma carta de apresentação personalizada. Responda APENAS com este JSON (sem texto adicional):
                {
                  "cartaCompleta": "<carta de apresentação completa com 3-4 parágrafos, incluindo saudação e despedida>",
                  "assunto": "<linha de assunto sugerida para o email>",
                  "pontosDestaque": ["<ponto forte 1 a destacar na carta>", "<ponto forte 2>", "<ponto forte 3>"],
                  "tomSugerido": "<descrição do tom ideal: ex. Profissional e entusiasta, Técnico e direto, etc.>",
                  "dicaPersonalizacao": "<uma dica concreta para o candidato personalizar ainda mais a carta antes de enviar>"
                }
                """.formatted(
                user.getEmail(),
                skills,
                job.getTitle(),
                job.getCompany(),
                job.getLocation() != null ? job.getLocation() : "Não especificada",
                techs,
                description,
                requirements,
                benefits
        );
    }

    private AiCoverLetterResponse parseResponse(String rawJson) {
        try {
            String clean = extractJsonObject(rawJson);
            JsonNode node = objectMapper.readTree(clean);

            String carta = node.path("cartaCompleta").asText("Carta não disponível.");
            String assunto = node.path("assunto").asText("Candidatura — [Título da Vaga]");
            List<String> pontosDestaque = toStringList(node.get("pontosDestaque"));
            String tom = node.path("tomSugerido").asText("Profissional e acessível");
            String dica = node.path("dicaPersonalizacao").asText(
                    "Pesquise sobre projetos recentes da empresa e mencione-os na carta.");

            return new AiCoverLetterResponse(carta, assunto, pontosDestaque, tom, dica);
        } catch (Exception e) {
            log.warn("Falha ao analisar resposta da IA (cover letter): {}", e.getMessage());
            return new AiCoverLetterResponse(
                    "Não foi possível gerar a carta de apresentação. Verifique se o Ollama está ativo e tente novamente.",
                    "Candidatura",
                    List.of(),
                    "Não determinado",
                    "Tente novamente com o Ollama ativo."
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
}
