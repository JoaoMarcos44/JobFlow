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
 * Seed dev admin user for local demos.
 * Disabled in tests via profile.
 */
@Component
@Profile("!test")
public class DevUserDataLoader implements ApplicationRunner {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    @Value("${app.dev.seedAdmin:true}")
    private boolean seedAdmin;

    @Value("${app.dev.adminEmail:admin@jobflow.com}")
    private String adminEmail;

    @Value("${app.dev.adminPassword:admin}")
    private String adminPassword;

    @Value("${app.dev.resetAdminPassword:false}")
    private boolean resetAdminPassword;

    public DevUserDataLoader(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seedAdmin) return;
        String email = adminEmail == null ? "" : adminEmail.trim().toLowerCase();
        if (email.isBlank()) return;
        String pw = adminPassword == null ? "" : adminPassword;
        if (pw.isBlank()) return;
        users.findByEmailIgnoreCase(email).ifPresentOrElse(existing -> {
            if (!resetAdminPassword) return;
            existing.setPasswordHash(encoder.encode(pw));
            users.save(existing);
        }, () -> users.save(new User(email, encoder.encode(pw))));
    }
}

