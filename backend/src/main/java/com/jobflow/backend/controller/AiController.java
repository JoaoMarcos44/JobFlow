package com.jobflow.backend.controller;

import com.jobflow.backend.dto.AiCoverLetterResponse;
import com.jobflow.backend.dto.AiInterviewCoachResponse;
import com.jobflow.backend.dto.AiJobAnalysisResponse;
import com.jobflow.backend.dto.AiResumeAnalysisResponse;
import com.jobflow.backend.dto.AiStatusResponse;
import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.Resume;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.JobRepository;
import com.jobflow.backend.service.AiCoverLetterService;
import com.jobflow.backend.service.AiInterviewCoachService;
import com.jobflow.backend.service.AiMatchService;
import com.jobflow.backend.service.AiResumeService;
import com.jobflow.backend.service.AuthenticatedUserService;
import com.jobflow.backend.service.OllamaService;
import com.jobflow.backend.service.ResumeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final OllamaService ollamaService;
    private final AiMatchService aiMatchService;
    private final AiResumeService aiResumeService;
    private final AiInterviewCoachService aiInterviewCoachService;
    private final AiCoverLetterService aiCoverLetterService;
    private final JobRepository jobRepository;
    private final ResumeService resumeService;
    private final AuthenticatedUserService currentUser;

    public AiController(OllamaService ollamaService,
                        AiMatchService aiMatchService,
                        AiResumeService aiResumeService,
                        AiInterviewCoachService aiInterviewCoachService,
                        AiCoverLetterService aiCoverLetterService,
                        JobRepository jobRepository,
                        ResumeService resumeService,
                        AuthenticatedUserService currentUser) {
        this.ollamaService = ollamaService;
        this.aiMatchService = aiMatchService;
        this.aiResumeService = aiResumeService;
        this.aiInterviewCoachService = aiInterviewCoachService;
        this.aiCoverLetterService = aiCoverLetterService;
        this.jobRepository = jobRepository;
        this.resumeService = resumeService;
        this.currentUser = currentUser;
    }

    /** Verifica se o Ollama está a correr localmente. Não requer autenticação. */
    @GetMapping("/status")
    public AiStatusResponse status() {
        boolean available = ollamaService.isAvailable();
        return new AiStatusResponse(
                available,
                ollamaService.getModel(),
                ollamaService.getBaseUrl(),
                available
                        ? "Ollama ativo e pronto para análises offline."
                        : "Ollama não encontrado. Execute 'ollama serve' para ativar a IA offline."
        );
    }

    /**
     * Análise semântica de compatibilidade entre o utilizador autenticado e uma vaga.
     * Processa tudo localmente via Ollama — nenhum dado sai da sua máquina.
     */
    @PostMapping("/jobs/{id}/analyze")
    public ResponseEntity<AiJobAnalysisResponse> analyzeJob(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        User user = currentUser.requireUser(authentication);
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaga não encontrada."));
        return ResponseEntity.ok(aiMatchService.analyze(user, job));
    }

    /**
     * Extrai skills do currículo usando o LLM local.
     * O ficheiro é lido da base de dados e processado localmente — sem envio para a cloud.
     */
    @PostMapping("/resumes/{id}/extract-skills")
    public ResponseEntity<AiResumeAnalysisResponse> extractSkillsFromResume(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        User user = currentUser.requireUser(authentication);
        Resume resume = resumeService.getById(user, id)
                .orElseThrow(() -> new IllegalArgumentException("Currículo não encontrado."));
        return ResponseEntity.ok(aiResumeService.analyze(resume));
    }

    /**
     * Gera um plano de preparação para entrevista personalizado.
     * Inclui perguntas técnicas, comportamentais, respostas modelo e dicas.
     * Processado localmente via Ollama — nenhum dado sai da sua máquina.
     */
    @PostMapping("/jobs/{id}/interview-coach")
    public ResponseEntity<AiInterviewCoachResponse> interviewCoach(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        User user = currentUser.requireUser(authentication);
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaga não encontrada."));
        return ResponseEntity.ok(aiInterviewCoachService.generateCoaching(user, job));
    }

    /**
     * Gera uma carta de apresentação personalizada para uma vaga.
     * Considera as skills do candidato e os requisitos da posição.
     * Processado localmente via Ollama — nenhum dado sai da sua máquina.
     */
    @PostMapping("/jobs/{id}/cover-letter")
    public ResponseEntity<AiCoverLetterResponse> generateCoverLetter(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        User user = currentUser.requireUser(authentication);
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaga não encontrada."));
        return ResponseEntity.ok(aiCoverLetterService.generate(user, job));
    }
}
