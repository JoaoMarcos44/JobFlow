package com.jobflow.backend.config;

import com.jobflow.backend.model.Job;
import com.jobflow.backend.repository.JobRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@Profile("!test")
public class JobDataLoader implements ApplicationRunner {

    private final JobRepository jobRepository;

    public JobDataLoader(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (jobRepository.count() > 0) {
            return;
        }

        List<Job> seedJobs = List.of(
                buildSeedJob("Desenvolvedor Frontend Angular Pleno", "Gupy", "Remoto", List.of("Angular", "TypeScript", "RxJS"), "via Extensão JobFlow"),
                buildSeedJob("Full Stack Engineer (Java/Angular)", "LinkedIn", "São Paulo", List.of("Java", "Spring Boot", "Angular"), "via API Oficial"),
                buildSeedJob("Software Engineer - Backend", "Nubank", "Remoto", List.of("Java", "PostgreSQL", "Kafka"), "via Portal"),
                buildSeedJob("Desenvolvedor React Senior", "iFood", "São Paulo", List.of("React", "TypeScript", "Node.js"), null),
                buildSeedJob("Engenheiro de Dados", "Mercado Livre", "Remoto", List.of("Python", "Spark", "SQL", "AWS"), null),
                buildSeedJob("DevOps Engineer", "Stone", "Rio de Janeiro", List.of("Kubernetes", "Terraform", "AWS", "Go"), null)
        );
        jobRepository.saveAll(seedJobs);
    }

    private static Job buildSeedJob(
            String title,
            String company,
            String location,
            List<String> technologies,
            String sourceNote
    ) {
        Job job = new Job(title, company);
        job.setLocation(location);
        job.setTechnologies(technologies);
        job.setPostedDate(LocalDate.now().minusDays(technologies.size()));
        job.setDescription("Descrição da vaga " + title);
        job.setRequirements("Requisitos para " + title);
        if (sourceNote != null) {
            String slug = company.toLowerCase().replace(" ", "-");
            job.setSourceUrl("https://example.com/" + slug);
        }
        return job;
    }
}
