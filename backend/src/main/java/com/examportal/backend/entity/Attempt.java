package com.examportal.backend.entity;

import com.examportal.backend.entity.enums.AttemptStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "attempts")
public class Attempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_session_id")
    private ExamSession examSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private long completionSeconds;
    private int totalQuestions;
    private int correctAnswers;
    private int wrongAnswers;
    private int unansweredAnswers;
    private double score;

    @Enumerated(EnumType.STRING)
    private AttemptStatus status;

    @PrePersist
    void onCreate() {
        startedAt = LocalDateTime.now();
    }
}
