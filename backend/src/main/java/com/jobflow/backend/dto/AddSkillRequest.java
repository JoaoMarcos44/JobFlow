package com.jobflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddSkillRequest(
        @NotBlank @Size(max = 100) String skillName
) {}
