package com.examportal.backend.dto;

import com.examportal.backend.entity.enums.AttemptStatus;
import com.examportal.backend.entity.enums.DifficultyLevel;
import com.examportal.backend.entity.enums.ExamStatus;
import com.examportal.backend.entity.enums.QuestionStatus;
import com.examportal.backend.entity.enums.RoleName;
import com.examportal.backend.entity.enums.SessionStatus;
import com.examportal.backend.entity.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {
    }

    public record OptionDto(Long id, String label, String content, boolean correct) {
    }

    public record QuestionSummaryDto(Long id, String content, DifficultyLevel difficulty, QuestionStatus status,
                                     String subjectName, String topicName) {
    }

    public record QuestionDetailDto(Long id, String content, DifficultyLevel difficulty, QuestionStatus status,
                                    String explanation, Long subjectId, Long topicId, List<OptionDto> options) {
    }

    public record QuestionPayload(
        @NotBlank String content,
        @NotNull Long subjectId,
        @NotNull Long topicId,
        @NotNull DifficultyLevel difficulty,
        QuestionStatus status,
        String explanation,
        @NotEmpty @Size(min = 4, max = 4) List<OptionPayload> options
    ) {
    }

    public record OptionPayload(
        @NotBlank String label,
        @NotBlank String content,
        boolean correct
    ) {
    }

    public record AuthRequest(@Email @NotBlank String email, @NotBlank String password) {
    }

    public record RegisterRequest(@NotBlank String fullName, @Email @NotBlank String email, @Size(min = 6) String password) {
    }

    public record ChangePasswordRequest(@Size(min = 6) String currentPassword, @Size(min = 6) String newPassword) {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    public record UserDto(Long id, String fullName, String email, RoleName role, UserStatus status) {
    }

    public record UserPayload(@NotBlank String fullName, @Email @NotBlank String email, @Size(min = 6) String password,
                              @NotNull RoleName role, UserStatus status) {
    }

    public record SubjectPayload(@NotBlank String name, String description) {
    }

    public record TopicPayload(@NotBlank String name, String description, @NotNull Long subjectId) {
    }

    public record SubjectDto(Long id, String name, String description) {
    }

    public record TopicDto(Long id, Long subjectId, String name, String description) {
    }

    public record ExamPayload(@NotBlank String title, String description, @NotNull Long subjectId, @Positive int durationMinutes,
                              @Positive double totalScore, @NotNull ExamStatus status, boolean showAnswersAfterSubmit) {
    }

    public record ExamQuestionPayload(@NotNull Long questionId, @Positive int displayOrder) {
    }

    public record ExamDto(Long id, String title, String description, Long subjectId, String subjectName,
                          int durationMinutes, double totalScore, ExamStatus status,
                          boolean showAnswersAfterSubmit, int questionCount) {
    }

    public record ExamSessionPayload(@NotNull Long examId, @NotBlank String title, @NotNull LocalDateTime openTime,
                                     @NotNull LocalDateTime closeTime, @Positive int durationMinutes,
                                     @Positive int maxAttempts, @NotNull SessionStatus status) {
    }

    public record ExamSessionDto(Long id, Long examId, String examTitle, String title, LocalDateTime openTime,
                                 LocalDateTime closeTime, int durationMinutes, int maxAttempts, SessionStatus status,
                                 int questionCount) {
    }

    public record AttemptAnswerPayload(@NotNull Long questionId, Long selectedOptionId) {
    }

    public record AttemptSubmitPayload(List<AttemptAnswerPayload> answers, boolean autoSubmitted) {
    }

    public record AttemptQuestionDto(Long questionId, String content, int index, List<OptionDto> options) {
    }

    public record AttemptDto(Long id, Long sessionId, String sessionTitle, String examTitle, int durationMinutes, AttemptStatus status,
                             LocalDateTime startedAt, LocalDateTime submittedAt, int totalQuestions, int correctAnswers,
                             int wrongAnswers, int unansweredAnswers, double score, long completionSeconds,
                             List<AttemptQuestionDto> questions, List<AttemptReviewDto> answerReview) {
    }

    public record AttemptReviewDto(Long questionId, String content, String selectedLabel, String correctLabel,
                                   boolean correct, String explanation) {
    }

    public record DashboardOverviewDto(long totalUsers, long totalStudents, long totalInstructors, long totalQuestions,
                                       long totalExams, long totalExamSessions, long totalAttempts) {
    }

    public record DashboardExamStatsDto(String sessionTitle, double averageScore, double highestScore,
                                        double lowestScore, long participationCount) {
    }

    public record DashboardQuestionStatsDto(long enabledQuestions, long disabledQuestions) {
    }
}
