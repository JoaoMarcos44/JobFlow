package com.jobflow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Size(max = 255) String name,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 72) String password
) {}