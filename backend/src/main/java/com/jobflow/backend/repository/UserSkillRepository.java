package com.jobflow.backend.repository;

import com.jobflow.backend.model.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSkillRepository extends JpaRepository<UserSkill, UUID> {
    List<UserSkill> findByUserIdOrderBySkillNameAsc(UUID userId);
    Optional<UserSkill> findByUserIdAndSkillNameIgnoreCase(UUID userId, String skillName);
    boolean existsByUserIdAndSkillNameIgnoreCase(UUID userId, String skillName);
    void deleteByUserIdAndSkillNameIgnoreCase(UUID userId, String skillName);
}
