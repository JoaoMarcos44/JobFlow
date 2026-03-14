package com.jobflow.backend.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "user_skills", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_skills_user_skill", columnNames = {"user_id", "skill_name"})
})
public class UserSkill {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    protected UserSkill() {}

    public UserSkill(User user, String skillName) {
        this.user = user;
        this.skillName = skillName;
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
}
