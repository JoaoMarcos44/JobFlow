package com.jobflow.backend.config;

import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Cria ou repõe utilizador de demonstração em desenvolvimento local.
 */
@Component
@Profile("!test")
public class DevUserDataLoader implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.dev.seedAdmin:true}")
    private boolean seedAdmin;

    @Value("${app.dev.adminEmail:admin@jobflow.com}")
    private String adminEmail;

    @Value("${app.dev.adminPassword:admin12}")
    private String adminPassword;

    @Value("${app.dev.resetAdminPassword:false}")
    private boolean resetAdminPassword;

    public DevUserDataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seedAdmin) {
            return;
        }
        String email = adminEmail == null ? "" : adminEmail.trim().toLowerCase();
        if (email.isBlank()) {
            return;
        }
        String plainPassword = adminPassword == null ? "" : adminPassword;
        if (plainPassword.isBlank()) {
            return;
        }
        String encodedPassword = passwordEncoder.encode(plainPassword);
        userRepository.findByEmailIgnoreCase(email).ifPresentOrElse(
                existing -> {
                    if (resetAdminPassword) {
                        existing.setPasswordHash(encodedPassword);
                        userRepository.save(existing);
                    }
                },
                () -> userRepository.save(new User(email, encodedPassword))
        );
    }
}
