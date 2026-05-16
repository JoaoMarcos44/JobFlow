package com.jobflow.backend.service;

import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.MatchAnalysis;
import com.jobflow.backend.model.User;
import com.jobflow.backend.model.UserSkill;
import com.jobflow.backend.repository.MatchAnalysisRepository;
import com.jobflow.backend.repository.UserSkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MatchService {

    private final UserSkillRepository userSkills;
    private final MatchAnalysisRepository analyses;

    public MatchService(UserSkillRepository userSkills, MatchAnalysisRepository analyses) {
        this.userSkills = userSkills;
        this.analyses = analyses;
    }

    public int calculateMatchScore(User user, Job job) {
        return calculateMatchScore(skillNamesFor(user.getId()), job.getTechnologies());
    }

    public static int calculateMatchScore(List<String> userSkills, List<String> jobTechnologies) {
        if (jobTechnologies == null || jobTechnologies.isEmpty()) {
            return 0;
        }
        Set<String> normalizedUserSkills = userSkills.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        Set<String> normalizedJobTechs = jobTechnologies.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        long matched = normalizedJobTechs.stream().filter(normalizedUserSkills::contains).count();
        return (int) Math.round((matched * 100.0) / normalizedJobTechs.size());
    }

    public String generateMatchFeedback(List<String> userSkills, List<String> jobTechnologies, int matchScore) {
        List<String> missing = skillsMissingFromJob(userSkills, jobTechnologies);
        if (matchScore >= 70) {
            return "Ótimo match! Você possui " + matchScore + "% das tecnologias exigidas.";
        }
        if (matchScore >= 40) {
            return "Match intermediário (" + matchScore + "%). Faltam: " + String.join(", ", missing)
                    + ". Adicionar essas skills pode aumentar seu match.";
        }
        return "Match baixo (" + matchScore + "%). A vaga exige: " + String.join(", ", missing)
                + ". Considere estudar essas tecnologias.";
    }

    public MatchAnalysis getOrCreateAnalysis(User user, Job job) {
        return analyses.findFirstByUserIdAndJobIdOrderByCreatedAtDesc(user.getId(), job.getId())
                .orElseGet(() -> createAndSaveAnalysis(user, job));
    }

    private MatchAnalysis createAndSaveAnalysis(User user, Job job) {
        List<String> skills = skillNamesFor(user.getId());
        int score = calculateMatchScore(skills, job.getTechnologies());
        String feedback = generateMatchFeedback(skills, job.getTechnologies(), score);
        List<String> missing = skillsMissingFromJob(skills, job.getTechnologies());

        MatchAnalysis analysis = new MatchAnalysis(user, job, score);
        analysis.setAnalysisText(feedback);
        analysis.setMissingSkills(missing);
        return analyses.save(analysis);
    }

    private List<String> skillNamesFor(UUID userId) {
        return userSkills.findByUserIdOrderBySkillNameAsc(userId).stream()
                .map(UserSkill::getSkillName)
                .toList();
    }

    private static List<String> skillsMissingFromJob(List<String> userSkills, List<String> jobTechnologies) {
        if (jobTechnologies == null) {
            return List.of();
        }
        Set<String> normalizedUserSkills = userSkills.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        return jobTechnologies.stream()
                .filter(tech -> !normalizedUserSkills.contains(tech.toLowerCase()))
                .toList();
    }
}
