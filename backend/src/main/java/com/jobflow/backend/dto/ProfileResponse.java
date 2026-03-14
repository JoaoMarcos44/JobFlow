package com.jobflow.backend.dto;

import com.jobflow.backend.model.UserLevel;

import java.util.List;
import java.util.UUID;

public record ProfileResponse(
        UUID id,
        String name,
        String email,
        UserLevel level,
        String avatarUrl,
        List<String> skills
) {}
