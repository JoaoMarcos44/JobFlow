package com.jobflow.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobflow.backend.dto.LoginRequest;
import com.jobflow.backend.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Casos de uso automatizados da API de autenticação (alinhados com o front Angular).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthApiIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    private static String randomEmail() {
        return "u" + UUID.randomUUID().toString().replace("-", "") + "@example.com";
    }

    @Test
    @DisplayName("Registo devolve JWT e aceita nome opcional")
    void registerReturnsToken() throws Exception {
        String email = randomEmail();
        RegisterRequest body = new RegisterRequest("Tester", email, "secret123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(not(emptyString())));
    }

    @Test
    @DisplayName("Login com credenciais corretas devolve token")
    void loginSuccessAfterRegister() throws Exception {
        String email = randomEmail();
        String password = "secret123";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(null, email, password))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(not(emptyString())));
    }

    @Test
    @DisplayName("Login com palavra-passe errada → 401 + error")
    void loginWrongPassword401() throws Exception {
        String email = randomEmail();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(null, email, "secret123"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "wrongpass1"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Registo duplicado → 409 CONFLICT")
    void registerDuplicateEmail409() throws Exception {
        String email = randomEmail();
        RegisterRequest body = new RegisterRequest(null, email, "secret123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Utilizador inexistente no login → 401")
    void loginUnknownUser401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("nobody-404@example.com", "secret123"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }
}
