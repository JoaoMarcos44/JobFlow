package com.jobflow.backend.service;

import com.jobflow.backend.dto.JobResponse;
import com.jobflow.backend.dto.MatchResponse;
import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.MatchAnalysis;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.JobRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final MatchService matchService;

    public JobService(JobRepository jobRepository, MatchService matchService) {
        this.jobRepository = jobRepository;
        this.matchService = matchService;
    }

    public Page<JobResponse> getFeed(User user, String technologyFilter, Pageable pageable) {
        Page<Job> page = jobRepository.findAll(pageable);
        if (user == null) {
            return page.map(j -> toResponse(j, null));
        }
        return page.map(job -> {
            int score = matchService.calculateMatchScore(user, job);
            return toResponse(job, score);
        });
    }

    public Optional<JobResponse> getById(User user, UUID jobId) {
        return jobRepository.findById(jobId)
                .map(job -> {
                    Integer score = user != null ? matchService.calculateMatchScore(user, job) : null;
                    return toResponse(job, score);
                });
    }

    public Optional<MatchResponse> getMatchAnalysis(User user, UUID jobId) {
        if (user == null) return Optional.empty();
        return jobRepository.findById(jobId)
                .map(job -> {
                    MatchAnalysis a = matchService.getOrCreateAnalysis(user, job);
                    return new MatchResponse(a.getMatchScore(), a.getAnalysisText(), a.getMissingSkills());
                });
    }

    public Optional<Job> findJobById(UUID jobId) {
        return jobRepository.findById(jobId);
    }

    private static JobResponse toResponse(Job j, Integer matchScore) {
        return new JobResponse(
                j.getId(),
                j.getTitle(),
                j.getCompany(),
                j.getLocation(),
                j.getDescription(),
                j.getRequirements(),
                j.getBenefits(),
                j.getTechnologies() != null ? j.getTechnologies() : List.of(),
                j.getSourceUrl(),
                j.getPostedDate(),
                matchScore
        );
    }
}
