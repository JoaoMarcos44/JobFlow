package com.jobflow.backend.service;

import com.jobflow.backend.dto.LoginRequest;
import com.jobflow.backend.dto.RegisterRequest;
import com.jobflow.backend.exception.EmailAlreadyRegisteredException;
import com.jobflow.backend.exception.InvalidCredentialsException;
import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public String register(RegisterRequest req) {
        String email = normalizeEmail(req.email());
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyRegisteredException();
        }
        User user = new User(email, encoder.encode(req.password()));
        users.save(user);
        return jwt.issueToken(user);
    }

    public String login(LoginRequest req) {
        String email = normalizeEmail(req.email());

        User user = users.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return jwt.issueToken(user);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /**
     * Resposta genérica (sem revelar se o e-mail existe). O front apenas confirma sucesso HTTP.
     * Envio real de e-mail pode ser ligado aqui mais tarde.
     */
    public void requestPasswordReset(String email) {
        normalizeEmail(email);
        // opcional: users.findByEmailIgnoreCase(email).ifPresent(u -> mailService.send(...));
    }
}