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

    private final SavedJobRepository savedJobRepository;
    private final JobService jobService;
    private final MatchService matchService;

    public SavedJobService(
            SavedJobRepository savedJobRepository,
            JobService jobService,
            MatchService matchService
    ) {
        this.savedJobRepository = savedJobRepository;
        this.jobService = jobService;
        this.matchService = matchService;
    }

    @Transactional(readOnly = true)
    public Page<SavedJobResponse> listByUser(User user, Pageable pageable) {
        return savedJobRepository.findByUserIdOrderBySavedAtDesc(user.getId(), pageable)
                .map(this::toSavedJobResponse);
    }

    public Optional<SavedJobResponse> getById(User user, UUID savedJobId) {
        return savedJobRepository.findByUserIdAndIdWithJob(user.getId(), savedJobId)
                .map(this::toSavedJobResponse);
    }

    public SavedJobResponse saveFromCodante(User user, SaveSavedJobFromCodanteRequest body) {
        Job job = jobService.upsertJobFromCodante(body.codanteJob());
        return save(user, new SavedJobRequest(job.getId(), body.notes(), body.status()));
    }

    public SavedJobResponse save(User user, SavedJobRequest request) {
        Job job = jobService.findJobById(request.jobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        if (savedJobRepository.existsByUserIdAndJobId(user.getId(), job.getId())) {
            throw new IllegalArgumentException("Job already saved");
        }
        SavedJob savedJob = new SavedJob(user, job);
        savedJob.setMatchScore(matchService.calculateMatchScore(user, job));
        savedJob.setNotes(request.notes());
        if (request.status() != null && !request.status().isBlank()) {
            savedJob.setStatus(request.status().trim());
        }
        savedJobRepository.save(savedJob);
        return toSavedJobResponse(savedJob);
    }

    public Optional<SavedJobResponse> update(User user, UUID savedJobId, String notes, String status) {
        return savedJobRepository.findByUserIdAndIdWithJob(user.getId(), savedJobId)
                .map(savedJob -> {
                    if (notes != null) {
                        savedJob.setNotes(notes);
                    }
                    if (status != null && !status.isBlank()) {
                        savedJob.setStatus(status.trim());
                    }
                    savedJob.setUpdatedAt(Instant.now());
                    savedJobRepository.save(savedJob);
                    return toSavedJobResponse(savedJob);
                });
    }

    public boolean delete(User user, UUID savedJobId) {
        return savedJobRepository.findByUserIdAndId(user.getId(), savedJobId)
                .map(savedJob -> {
                    savedJobRepository.delete(savedJob);
                    return true;
                })
                .orElse(false);
    }

    private SavedJobResponse toSavedJobResponse(SavedJob savedJob) {
        Job job = savedJob.getJob();
        JobResponse jobResponse = JobMapper.toResponse(job, savedJob.getMatchScore());
        return new SavedJobResponse(
                savedJob.getId(),
                jobResponse,
                savedJob.getNotes(),
                savedJob.getMatchScore(),
                savedJob.getStatus(),
                savedJob.getSavedAt(),
                savedJob.getUpdatedAt()
        );
    }
}
