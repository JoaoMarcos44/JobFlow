package com.jobflow.backend.service;

import com.jobflow.backend.model.Job;
import com.jobflow.backend.model.MatchAnalysis;
import com.jobflow.backend.model.User;
import com.jobflow.backend.model.UserSkill;
import com.jobflow.backend.repository.MatchAnalysisRepository;
import com.jobflow.backend.repository.UserSkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MatchService {

    private final UserSkillRepository userSkillRepository;
    private final MatchAnalysisRepository matchAnalysisRepository;

    public MatchService(UserSkillRepository userSkillRepository, MatchAnalysisRepository matchAnalysisRepository) {
        this.userSkillRepository = userSkillRepository;
        this.matchAnalysisRepository = matchAnalysisRepository;
    }

    public int calculateMatchScore(User user, Job job) {
        List<String> userSkills = userSkillRepository.findByUserIdOrderBySkillNameAsc(user.getId())
                .stream()
                .map(UserSkill::getSkillName)
                .collect(Collectors.toList());
        return calculateMatchScore(userSkills, job.getTechnologies());
    }

    public static int calculateMatchScore(List<String> userSkills, List<String> jobTechnologies) {
        if (jobTechnologies == null || jobTechnologies.isEmpty()) return 0;
        var userSet = userSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        var jobSet = jobTechnologies.stream().map(String::toLowerCase).collect(Collectors.toSet());
        long matched = jobSet.stream().filter(userSet::contains).count();
        return (int) Math.round((matched * 100.0) / jobSet.size());
    }

    public String generateMatchFeedback(List<String> userSkills, List<String> jobTechnologies, int matchScore) {
        var userSet = userSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        List<String> missing = jobTechnologies == null ? List.of() : jobTechnologies.stream()
                .filter(t -> !userSet.contains(t.toLowerCase()))
                .collect(Collectors.toList());

        if (matchScore >= 70) {
            return "Ótimo match! Você possui " + matchScore + "% das tecnologias exigidas.";
        } else if (matchScore >= 40) {
            return "Match intermediário (" + matchScore + "%). Faltam: " + String.join(", ", missing) + ". Adicionar essas skills pode aumentar seu match.";
        } else {
            return "Match baixo (" + matchScore + "%). A vaga exige: " + String.join(", ", missing) + ". Considere estudar essas tecnologias.";
        }
    }

    public MatchAnalysis getOrCreateAnalysis(User user, Job job) {
        return matchAnalysisRepository.findFirstByUserIdAndJobIdOrderByCreatedAtDesc(user.getId(), job.getId())
                .orElseGet(() -> createAndSaveAnalysis(user, job));
    }

    private MatchAnalysis createAndSaveAnalysis(User user, Job job) {
        int score = calculateMatchScore(user, job);
        List<String> userSkills = userSkillRepository.findByUserIdOrderBySkillNameAsc(user.getId())
                .stream().map(UserSkill::getSkillName).collect(Collectors.toList());
        String analysisText = generateMatchFeedback(userSkills, job.getTechnologies(), score);
        var userSet = userSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        List<String> missing = job.getTechnologies() == null ? List.of() : job.getTechnologies().stream()
                .filter(t -> !userSet.contains(t.toLowerCase()))
                .collect(Collectors.toList());

        MatchAnalysis a = new MatchAnalysis(user, job, score);
        a.setAnalysisText(analysisText);
        a.setMissingSkills(missing);
        return matchAnalysisRepository.save(a);
    }
}
