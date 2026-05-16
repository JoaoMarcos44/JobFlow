package com.jobflow.backend.service;

import com.jobflow.backend.dto.CodanteJobPayload;
import com.jobflow.backend.dto.JobResponse;
import com.jobflow.backend.dto.MatchResponse;
import com.jobflow.backend.mapper.JobMapper;
import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.MatchAnalysis;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.JobRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final MatchService matchService;

    public JobService(JobRepository jobRepository, MatchService matchService) {
        this.jobRepository = jobRepository;
        this.matchService = matchService;
    }

    /** {@code technology} reservado para filtro futuro; hoje a lista vem completa da base. */
    public Page<JobResponse> getFeed(User user, String technology, Pageable pageable) {
        Page<Job> page = jobRepository.findAll(pageable);
        if (user == null) {
            return page.map(job -> JobMapper.toResponse(job, null));
        }
        return page.map(job -> {
            int score = matchService.calculateMatchScore(user, job);
            return JobMapper.toResponse(job, score);
        });
    }

    public Optional<JobResponse> getById(User user, UUID jobId) {
        return jobRepository.findById(jobId).map(job -> {
            Integer score = user != null ? matchService.calculateMatchScore(user, job) : null;
            return JobMapper.toResponse(job, score);
        });
    }

    public Optional<MatchResponse> getMatchAnalysis(User user, UUID jobId) {
        if (user == null) {
            return Optional.empty();
        }
        return jobRepository.findById(jobId).map(job -> {
            MatchAnalysis analysis = matchService.getOrCreateAnalysis(user, job);
            return new MatchResponse(
                    analysis.getMatchScore(),
                    analysis.getAnalysisText(),
                    analysis.getMissingSkills()
            );
        });
    }

    public Optional<Job> findJobById(UUID jobId) {
        return jobRepository.findById(jobId);
    }

    @Transactional
    public Job upsertJobFromCodante(CodanteJobPayload payload) {
        Job job = jobRepository.findByCodanteId(payload.id()).orElseGet(() -> {
            Job newJob = new Job(payload.title(), payload.company());
            newJob.setCodanteId(payload.id());
            return newJob;
        });
        applyCodantePayload(job, payload);
        return jobRepository.save(job);
    }

    private static void applyCodantePayload(Job job, CodanteJobPayload payload) {
        job.setTitle(payload.title());
        job.setCompany(payload.company());
        job.setLocation(payload.city() != null ? payload.city() : "");
        job.setDescription(payload.description() != null ? payload.description() : "");
        job.setRequirements(payload.requirements() != null ? payload.requirements() : "");
        if (payload.companyWebsite() != null && !payload.companyWebsite().isBlank()) {
            job.setSourceUrl(payload.companyWebsite());
        }
        if (payload.createdAt() != null && payload.createdAt().length() >= 10) {
            try {
                job.setPostedDate(LocalDate.parse(payload.createdAt().substring(0, 10)));
            } catch (Exception ignored) {
                // mantém postedDate
            }
        }
    }
}
