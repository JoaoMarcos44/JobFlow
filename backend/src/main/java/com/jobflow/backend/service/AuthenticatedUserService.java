package com.jobflow.backend.service;

import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {

    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Utilizador autenticado ou {@code null} se não houver sessão ou registo. */
    public User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
    }

    public User requireUser(Authentication authentication) {
        User user = resolveUser(authentication);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        return user;
    }
}
