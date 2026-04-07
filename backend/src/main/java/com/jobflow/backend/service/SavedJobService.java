package com.jobflow.backend.service;

import com.jobflow.backend.dto.JobResponse;
import com.jobflow.backend.dto.SaveSavedJobFromCodanteRequest;
import com.jobflow.backend.dto.SavedJobRequest;
import com.jobflow.backend.dto.SavedJobResponse;
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

    public SavedJobService(SavedJobRepository savedJobRepository, JobService jobService, MatchService matchService) {
        this.savedJobRepository = savedJobRepository;
        this.jobService = jobService;
        this.matchService = matchService;
    }

    @Transactional(readOnly = true)
    public Page<SavedJobResponse> listByUser(User user, Pageable pageable) {
        return savedJobRepository.findByUserIdOrderBySavedAtDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    public Optional<SavedJobResponse> getById(User user, UUID savedJobId) {
        return savedJobRepository.findByUserIdAndIdWithJob(user.getId(), savedJobId)
                .map(this::toResponse);
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
        int score = matchService.calculateMatchScore(user, job);
        SavedJob saved = new SavedJob(user, job);
        saved.setMatchScore(score);
        saved.setNotes(request.notes());
        if (request.status() != null && !request.status().isBlank()) {
            saved.setStatus(request.status().trim());
        }
        savedJobRepository.save(saved);
        return toResponse(saved);
    }

    public Optional<SavedJobResponse> update(User user, UUID savedJobId, String notes, String status) {
        // Fetch join Job to avoid LazyInitializationException when mapping response (open-in-view is false).
        return savedJobRepository.findByUserIdAndIdWithJob(user.getId(), savedJobId)
                .map(s -> {
                    if (notes != null) s.setNotes(notes);
                    if (status != null && !status.isBlank()) s.setStatus(status.trim());
                    s.setUpdatedAt(Instant.now());
                    savedJobRepository.save(s);
                    return toResponse(s);
                });
    }

    public boolean delete(User user, UUID savedJobId) {
        return savedJobRepository.findByUserIdAndId(user.getId(), savedJobId)
                .map(s -> {
                    savedJobRepository.delete(s);
                    return true;
                }).orElse(false);
    }

    private SavedJobResponse toResponse(SavedJob s) {
        Job j = s.getJob();
        JobResponse jobResp = new JobResponse(
                j.getId(), j.getTitle(), j.getCompany(), j.getLocation(),
                j.getDescription(), j.getRequirements(), j.getBenefits(),
                j.getTechnologies() != null ? j.getTechnologies() : java.util.List.of(),
                j.getSourceUrl(), j.getPostedDate(), j.getCodanteId(), s.getMatchScore()
        );
        return new SavedJobResponse(s.getId(), jobResp, s.getNotes(), s.getMatchScore(), s.getStatus(), s.getSavedAt(), s.getUpdatedAt());
    }
}
