package com.jobflow.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "jobs", uniqueConstraints = {
        @UniqueConstraint(name = "uk_jobs_codante_id", columnNames = "codante_id")
})
public class Job {

    @Id
    @GeneratedValue
    private UUID id;

    /** ID na API Codante quando a vaga é importada ao guardar no feed. */
    @Column(name = "codante_id", unique = true)
    private Integer codanteId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 255)
    private String company;

    @Column(length = 255)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> technologies = new ArrayList<>();

    @Column(name = "source_url", length = 2048)
    private String sourceUrl;

    @Column(name = "posted_date")
    private LocalDate postedDate;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Job() {}

    public Job(String title, String company) {
        this.title = title;
        this.company = company;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public String getBenefits() { return benefits; }
    public void setBenefits(String benefits) { this.benefits = benefits; }
    public List<String> getTechnologies() { return technologies; }
    public void setTechnologies(List<String> technologies) { this.technologies = technologies != null ? technologies : new ArrayList<>(); }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public LocalDate getPostedDate() { return postedDate; }
    public void setPostedDate(LocalDate postedDate) { this.postedDate = postedDate; }
    public Instant getCreatedAt() { return createdAt; }

    public Integer getCodanteId() { return codanteId; }
    public void setCodanteId(Integer codanteId) { this.codanteId = codanteId; }
}
