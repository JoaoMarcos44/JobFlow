package com.jobflow.backend.exception;

/**
 * E-mail já usado no registo — mapeada para HTTP 409.
 */
public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException() {
        super("Este e-mail já está registado.");
    }
}
