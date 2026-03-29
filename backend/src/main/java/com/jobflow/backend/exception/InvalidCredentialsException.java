package com.jobflow.backend.exception;

/**
 * Falha de autenticação — mapeada para HTTP 401 (alinhado com {@code AuthService} no front).
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Email ou palavra-passe inválidos.");
    }
}
