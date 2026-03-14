package com.jobflow.backend.dto;

import com.jobflow.backend.model.UserLevel;

import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @Size(max = 255) String name,
        UserLevel level,
        @Size(max = 2048) String avatarUrl
) {}
