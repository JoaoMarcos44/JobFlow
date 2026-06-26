package com.jobflow.backend.service;

import com.jobflow.backend.config.OllamaProperties;
import com.jobflow.backend.exception.AiUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class OllamaService {

    private static final Logger log = LoggerFactory.getLogger(OllamaService.class);

    private final OllamaProperties properties;
    private final RestClient restClient;

    public OllamaService(OllamaProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(properties.timeoutSeconds()));
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(factory)
                .build();
    }

    /**
     * Envia mensagens para o modelo Ollama e retorna a resposta em texto.
     * O campo "format":"json" força o Ollama a devolver JSON válido.
     */
    @SuppressWarnings("unchecked")
    public String chat(String systemPrompt, String userMessage) {
        if (!properties.enabled()) {
            throw new AiUnavailableException("IA local desativada na configuração.");
        }
        Map<String, Object> requestBody = Map.of(
                "model", properties.model(),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ),
                "stream", false,
                "format", "json"
        );
        try {
            Map<String, Object> response = restClient.post()
                    .uri("/api/chat")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new AiUnavailableException("Resposta vazia do Ollama.");
            }
            Map<String, Object> message = (Map<String, Object>) response.get("message");
            if (message == null) {
                throw new AiUnavailableException("Campo 'message' ausente na resposta do Ollama.");
            }
            return (String) message.get("content");
        } catch (RestClientException e) {
            log.warn("Ollama indisponível em {}: {}", properties.baseUrl(), e.getMessage());
            throw new AiUnavailableException(
                    "Ollama não está disponível. Inicie o serviço com 'ollama serve' e tente novamente."
            );
        }
    }

    /** Verifica se o Ollama está acessível. */
    public boolean isAvailable() {
        if (!properties.enabled()) return false;
        try {
            restClient.get().uri("/api/tags").retrieve().toBodilessEntity();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getModel() {
        return properties.model();
    }

    public String getBaseUrl() {
        return properties.baseUrl();
    }
}
