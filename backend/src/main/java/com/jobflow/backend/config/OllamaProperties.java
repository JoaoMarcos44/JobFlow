package com.jobflow.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jobflow.ai.ollama")
public record OllamaProperties(
        String baseUrl,
        String model,
        int timeoutSeconds,
        boolean enabled
) {
    public OllamaProperties {
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "http://localhost:11434";
        if (model == null || model.isBlank()) model = "llama3.2:3b";
        if (timeoutSeconds <= 0) timeoutSeconds = 120;
    }
}
