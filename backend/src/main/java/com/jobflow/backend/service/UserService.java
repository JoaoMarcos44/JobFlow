package com.jobflow.backend.service;

import com.jobflow.backend.dto.ChangeEmailRequest;
import com.jobflow.backend.dto.ChangePasswordRequest;
import com.jobflow.backend.dto.ProfileResponse;
import com.jobflow.backend.dto.ProfileUpdateRequest;
import com.jobflow.backend.model.User;
import com.jobflow.backend.model.UserSkill;
import com.jobflow.backend.repository.UserRepository;
import com.jobflow.backend.repository.UserSkillRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, UserSkillRepository userSkillRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userSkillRepository = userSkillRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<ProfileResponse> getProfileByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(this::toProfileResponse);
    }

    public Optional<ProfileResponse> updateProfile(String email, ProfileUpdateRequest request) {
        return getProfileByEmail(email);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public void changeEmail(String email, ChangeEmailRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Password is incorrect");
        }
        String newEmail = request.newEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new IllegalArgumentException("Email already in use");
        }
        user.setEmail(newEmail);
        userRepository.save(user);
    }

    public List<String> getSkills(UUID userId) {
        return userSkillRepository.findByUserIdOrderBySkillNameAsc(userId)
                .stream()
                .map(UserSkill::getSkillName)
                .collect(Collectors.toList());
    }

    public void addSkill(User user, String skillName) {
        String normalized = skillName.trim();
        if (normalized.isEmpty()) throw new IllegalArgumentException("Skill name required");
        if (userSkillRepository.existsByUserIdAndSkillNameIgnoreCase(user.getId(), normalized)) {
            throw new IllegalArgumentException("Skill already added");
        }
        userSkillRepository.save(new UserSkill(user, normalized));
    }

    public boolean removeSkill(User user, String skillName) {
        if (skillName == null || skillName.isBlank()) return false;
        userSkillRepository.deleteByUserIdAndSkillNameIgnoreCase(user.getId(), skillName.trim());
        return true;
    }

    private ProfileResponse toProfileResponse(User user) {
        List<String> skills = userSkillRepository.findByUserIdOrderBySkillNameAsc(user.getId())
                .stream().map(UserSkill::getSkillName).collect(Collectors.toList());
        return new ProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getEmail(),
                null,
                null,
                skills
        );
    }
}
