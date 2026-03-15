package com.jobflow.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resumes")
public class Resume {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Lob
    @Column(name = "file_content", nullable = false)
    private byte[] fileContent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Resume() {}

    public Resume(User user, String fileName, String contentType, byte[] fileContent) {
        this.user = user;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileContent = fileContent;
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getFileName() { return fileName; }
    public String getContentType() { return contentType; }
    public byte[] getFileContent() { return fileContent; }
    public Instant getCreatedAt() { return createdAt; }
}
