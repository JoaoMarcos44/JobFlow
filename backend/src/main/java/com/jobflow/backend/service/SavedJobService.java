package com.jobflow.backend.service;

import com.jobflow.backend.dto.JobResponse;
import com.jobflow.backend.dto.SaveSavedJobFromCodanteRequest;
import com.jobflow.backend.dto.SavedJobRequest;
import com.jobflow.backend.dto.SavedJobResponse;
import com.jobflow.backend.mapper.JobMapper;
import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.SavedJob;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.SavedJobRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class SavedJobService {

    private final SavedJobRepository savedJobs;
    private final JobService jobService;
    private final MatchService matchService;

    public SavedJobService(SavedJobRepository savedJobs, JobService jobService, MatchService matchService) {
        this.savedJobs = savedJobs;
        this.jobService = jobService;
        this.matchService = matchService;
    }

    @Transactional(readOnly = true)
    public Page<SavedJobResponse> listByUser(User user, Pageable pageable) {
        return savedJobs.findByUserIdOrderBySavedAtDesc(user.getId(), pageable)
                .map(this::toSavedJobResponse);
    }

    public Optional<SavedJobResponse> getById(User user, UUID savedJobId) {
        return savedJobs.findByUserIdAndIdWithJob(user.getId(), savedJobId)
                .map(this::toSavedJobResponse);
    }

    public SavedJobResponse saveFromCodante(User user, SaveSavedJobFromCodanteRequest body) {
        Job job = jobService.upsertJobFromCodante(body.codanteJob());
        return save(user, new SavedJobRequest(job.getId(), body.notes(), body.status()));
    }

    public SavedJobResponse save(User user, SavedJobRequest request) {
        Job job = jobService.findJobById(request.jobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        if (savedJobs.existsByUserIdAndJobId(user.getId(), job.getId())) {
            throw new IllegalArgumentException("Job already saved");
        }
        SavedJob saved = new SavedJob(user, job);
        saved.setMatchScore(matchService.calculateMatchScore(user, job));
        saved.setNotes(request.notes());
        if (request.status() != null && !request.status().isBlank()) {
            saved.setStatus(request.status().trim());
        }
        savedJobs.save(saved);
        return toSavedJobResponse(saved);
    }

    public Optional<SavedJobResponse> update(User user, UUID savedJobId, String notes, String status) {
        return savedJobs.findByUserIdAndIdWithJob(user.getId(), savedJobId)
                .map(saved -> {
                    if (notes != null) {
                        saved.setNotes(notes);
                    }
                    if (status != null && !status.isBlank()) {
                        saved.setStatus(status.trim());
                    }
                    saved.setUpdatedAt(Instant.now());
                    savedJobs.save(saved);
                    return toSavedJobResponse(saved);
                });
    }

    public boolean delete(User user, UUID savedJobId) {
        return savedJobs.findByUserIdAndId(user.getId(), savedJobId)
                .map(saved -> {
                    savedJobs.delete(saved);
                    return true;
                })
                .orElse(false);
    }

    private SavedJobResponse toSavedJobResponse(SavedJob saved) {
        Job job = saved.getJob();
        JobResponse jobResponse = JobMapper.toResponse(job, saved.getMatchScore());
        return new SavedJobResponse(
                saved.getId(),
                jobResponse,
                saved.getNotes(),
                saved.getMatchScore(),
                saved.getStatus(),
                saved.getSavedAt(),
                saved.getUpdatedAt()
        );
    }
}
