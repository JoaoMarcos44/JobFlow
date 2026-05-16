package com.jobflow.backend.config;

import com.jobflow.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String bearerToken = authorizationHeader.substring(7).trim();
            try {
                Claims claims = jwtService.parseClaims(bearerToken);
                String email = resolveEmailFromClaims(claims);
                if (email != null && !email.isBlank()) {
                    var authentication = new UsernamePasswordAuthenticationToken(email, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception ignored) {
                // token inválido — pedido segue sem autenticação
            }
        }

        filterChain.doFilter(request, response);
    }

    private static String resolveEmailFromClaims(Claims claims) {
        String email = claims.getSubject();
        if (email == null || email.isBlank() || !email.contains("@")) {
            String legacyEmail = claims.get("email", String.class);
            if (legacyEmail != null && !legacyEmail.isBlank()) {
                return legacyEmail;
            }
        }
        return email;
    }
}
