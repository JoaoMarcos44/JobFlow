package com.jobflow.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "match_analyses")
public class MatchAnalysis {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "match_score", nullable = false)
    private Integer matchScore;

    @Column(name = "analysis_text", columnDefinition = "TEXT")
    private String analysisText;

    @Convert(converter = StringListConverter.class)
    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private List<String> missingSkills = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected MatchAnalysis() {}

    public MatchAnalysis(User user, Job job, int matchScore) {
        this.user = user;
        this.job = job;
        this.matchScore = matchScore;
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public Job getJob() { return job; }
    public Integer getMatchScore() { return matchScore; }
    public String getAnalysisText() { return analysisText; }
    public void setAnalysisText(String analysisText) { this.analysisText = analysisText; }
    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills != null ? missingSkills : new ArrayList<>(); }
    public Instant getCreatedAt() { return createdAt; }
}
