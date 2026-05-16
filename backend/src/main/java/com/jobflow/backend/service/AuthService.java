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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public String register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyRegisteredException();
        }
        User user = new User(email, passwordEncoder.encode(request.password()));
        userRepository.save(user);
        return jwtService.issueToken(user);
    }

    public String login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return jwtService.issueToken(user);
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
        // opcional: userRepository.findByEmailIgnoreCase(email).ifPresent(user -> mailService.send(...));
    }
}
