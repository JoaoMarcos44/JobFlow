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
        if (jobRepository.count() > 0) return;

        List<Job> jobs = List.of(
                job("Desenvolvedor Frontend Angular Pleno", "Gupy", "Remoto", List.of("Angular", "TypeScript", "RxJS"), "via Extensão JobFlow"),
                job("Full Stack Engineer (Java/Angular)", "LinkedIn", "São Paulo", List.of("Java", "Spring Boot", "Angular"), "via API Oficial"),
                job("Software Engineer - Backend", "Nubank", "Remoto", List.of("Java", "PostgreSQL", "Kafka"), "via Portal"),
                job("Desenvolvedor React Senior", "iFood", "São Paulo", List.of("React", "TypeScript", "Node.js"), null),
                job("Engenheiro de Dados", "Mercado Livre", "Remoto", List.of("Python", "Spark", "SQL", "AWS"), null),
                job("DevOps Engineer", "Stone", "Rio de Janeiro", List.of("Kubernetes", "Terraform", "AWS", "Go"), null)
        );
        jobRepository.saveAll(jobs);
    }

    private static Job job(String title, String company, String location, List<String> techs, String sourceNote) {
        Job j = new Job(title, company);
        j.setLocation(location);
        j.setTechnologies(techs);
        j.setPostedDate(LocalDate.now().minusDays(techs.size()));
        j.setDescription("Descrição da vaga " + title);
        j.setRequirements("Requisitos para " + title);
        if (sourceNote != null) j.setSourceUrl("https://example.com/" + company.toLowerCase().replace(" ", "-"));
        return j;
    }
}
