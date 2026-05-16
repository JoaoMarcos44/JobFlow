package com.jobflow.backend.mapper;

import com.jobflow.backend.dto.JobResponse;
import com.jobflow.backend.model.Job;

import java.util.List;

public final class JobMapper {

    private JobMapper() {}

    public static JobResponse toResponse(Job job, Integer matchScore) {
        List<String> techs = job.getTechnologies() != null ? job.getTechnologies() : List.of();
        return new JobResponse(
                job.getId(),
                job.getTitle(),
                job.getCompany(),
                job.getLocation(),
                job.getDescription(),
                job.getRequirements(),
                job.getBenefits(),
                techs,
                job.getSourceUrl(),
                job.getPostedDate(),
                job.getCodanteId(),
                matchScore
        );
    }
}
