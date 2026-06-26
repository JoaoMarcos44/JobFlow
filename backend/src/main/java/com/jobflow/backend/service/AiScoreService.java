package com.jobflow.backend.service;

import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.SavedJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class AiScoreService {

    private static final Logger log = LoggerFactory.getLogger(AiScoreService.class);

    private final AiMatchService aiMatchService;
    private final SavedJobRepository savedJobRepository;

    public AiScoreService(AiMatchService aiMatchService, SavedJobRepository savedJobRepository) {
        this.aiMatchService = aiMatchService;
        this.savedJobRepository = savedJobRepository;
    }

    @Async
    public void updateScoreAsync(UUID savedJobId, User user, Job job) {
        try {
            int pontuacao = aiMatchService.analyze(user, job).pontuacao();
            savedJobRepository.findById(savedJobId).ifPresent(sj -> {
                sj.setMatchScore(pontuacao);
                sj.setUpdatedAt(Instant.now());
                savedJobRepository.save(sj);
                log.info("IA score actualizado: savedJob={} score={}", savedJobId, pontuacao);
            });
        } catch (Exception e) {
            log.warn("IA score falhou para savedJob {}: {}", savedJobId, e.getMessage());
        }
    }
}
