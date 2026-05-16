package com.jobflow.backend.service;

import com.jobflow.backend.model.User;
import com.jobflow.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {

    private final UserRepository users;

    public AuthenticatedUserService(UserRepository users) {
        this.users = users;
    }

    /** Utilizador autenticado ou {@code null} se não houver sessão ou registo. */
    public User resolveUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return users.findByEmailIgnoreCase(auth.getName()).orElse(null);
    }

    public User requireUser(Authentication auth) {
        User user = resolveUser(auth);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        return user;
    }
}
