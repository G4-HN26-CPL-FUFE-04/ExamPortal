package com.examportal.backend.service;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.entity.Attempt;
import com.examportal.backend.entity.AttemptAnswer;
import com.examportal.backend.entity.Exam;
import com.examportal.backend.entity.ExamQuestion;
import com.examportal.backend.entity.ExamSession;
import com.examportal.backend.entity.Question;
import com.examportal.backend.entity.QuestionOption;
import com.examportal.backend.entity.Role;
import com.examportal.backend.entity.Subject;
import com.examportal.backend.entity.User;
import com.examportal.backend.entity.enums.AttemptStatus;
import com.examportal.backend.entity.enums.RoleName;
import com.examportal.backend.entity.enums.SessionStatus;
import com.examportal.backend.entity.enums.UserStatus;
import com.examportal.backend.exception.BadRequestException;
import com.examportal.backend.exception.NotFoundException;
import com.examportal.backend.repository.AttemptAnswerRepository;
import com.examportal.backend.repository.AttemptRepository;
import com.examportal.backend.repository.ExamQuestionRepository;
import com.examportal.backend.repository.ExamRepository;
import com.examportal.backend.repository.ExamSessionRepository;
import com.examportal.backend.repository.QuestionOptionRepository;
import com.examportal.backend.repository.QuestionRepository;
import com.examportal.backend.repository.RoleRepository;
import com.examportal.backend.repository.SubjectRepository;
import com.examportal.backend.repository.UserRepository;
import com.examportal.backend.security.JwtService;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PortalService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamSessionRepository examSessionRepository;
    private final AttemptRepository attemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public PortalService(UserRepository userRepository, RoleRepository roleRepository, SubjectRepository subjectRepository,
                         QuestionRepository questionRepository,
                         QuestionOptionRepository questionOptionRepository, ExamRepository examRepository,
                         ExamQuestionRepository examQuestionRepository, ExamSessionRepository examSessionRepository,
                         AttemptRepository attemptRepository, AttemptAnswerRepository attemptAnswerRepository,
                         PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,
                         JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.subjectRepository = subjectRepository;
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.examRepository = examRepository;
        this.examQuestionRepository = examQuestionRepository;
        this.examSessionRepository = examSessionRepository;
        this.attemptRepository = attemptRepository;
        this.attemptAnswerRepository = attemptAnswerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public ApiDtos.AuthResponse register(ApiDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already exists");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(getRole(RoleName.STUDENT));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    public ApiDtos.AuthResponse login(ApiDtos.AuthRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = getUserByEmail(request.email());
        return buildAuthResponse(user);
    }

    public ApiDtos.UserDto me() {
        return toUserDto(getCurrentUser());
    }

    public void changePassword(ApiDtos.ChangePasswordRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public List<ApiDtos.UserDto> getUsers(String keyword, UserStatus status) {
        List<User> users;
        if (keyword != null && !keyword.isBlank()) {
            users = userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, keyword);
        } else if (status != null) {
            users = userRepository.findByStatus(status);
        } else {
            users = userRepository.findAll();
        }
        return users.stream().map(this::toUserDto).toList();
    }

    public ApiDtos.UserDto getUser(Long id) {
        return toUserDto(findUser(id));
    }

    public ApiDtos.UserDto saveUser(ApiDtos.UserPayload payload, Long id) {
        User user = id == null ? new User() : findUser(id);
        if (id == null && userRepository.existsByEmail(payload.email())) {
            throw new BadRequestException("Email already exists");
        }
        user.setFullName(payload.fullName());
        user.setEmail(payload.email());
        if (payload.password() != null && !payload.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(payload.password()));
        } else if (user.getPasswordHash() == null) {
            throw new BadRequestException("Password is required");
        }
        user.setRole(getRole(payload.role()));
        user.setStatus(payload.status() == null ? UserStatus.ACTIVE : payload.status());
        return toUserDto(userRepository.save(user));
    }

    public ApiDtos.UserDto updateUserStatus(Long id, UserStatus status) {
        User user = findUser(id);
        user.setStatus(status);
        return toUserDto(userRepository.save(user));
    }

    public ApiDtos.UserDto updateUserRole(Long id, RoleName roleName) {
        User user = findUser(id);
        user.setRole(getRole(roleName));
        return toUserDto(userRepository.save(user));
    }

    public List<ApiDtos.SubjectDto> getSubjects() {
        return subjectRepository.findAll().stream()
            .map(subject -> new ApiDtos.SubjectDto(subject.getId(), subject.getName(), subject.getDescription()))
            .toList();
    }

    public ApiDtos.SubjectDto saveSubject(ApiDtos.SubjectPayload payload, Long id) {
        Subject subject = id == null ? new Subject() : findSubject(id);
        subject.setName(payload.name());
        subject.setDescription(payload.description());
        if (subject.getCreatedBy() == null) {
            subject.setCreatedBy(getCurrentUser());
        }
        Subject saved = subjectRepository.save(subject);
        return new ApiDtos.SubjectDto(saved.getId(), saved.getName(), saved.getDescription());
    }

    public void deleteSubject(Long id) {
        subjectRepository.delete(findSubject(id));
    }

    public List<ApiDtos.QuestionSummaryDto> getQuestions(String keyword, Long subjectId) {
        List<Question> questions;
        if (subjectId != null && keyword != null && !keyword.isBlank()) {
            questions = questionRepository.findBySubject_IdAndContentContainingIgnoreCase(subjectId, keyword);
        } else if (subjectId != null) {
            questions = questionRepository.findBySubject_Id(subjectId);
        } else if (keyword != null && !keyword.isBlank()) {
            questions = questionRepository.findByContentContainingIgnoreCase(keyword);
        } else {
            questions = questionRepository.findAll();
        }
        return questions.stream().map(this::toQuestionSummaryDto).toList();
    }

    public ApiDtos.QuestionDetailDto getQuestion(Long id) {
        return toQuestionDetailDto(findQuestion(id));
    }

    public ApiDtos.QuestionDetailDto saveQuestion(ApiDtos.QuestionPayload payload, Long id) {
        validateQuestionPayload(payload);

        Question question = id == null ? new Question() : findQuestion(id);
        Subject subject = findSubject(payload.subjectId());

        question.setContent(payload.content().trim());
        question.setSubject(subject);
        if (question.getCreatedBy() == null) {
            question.setCreatedBy(getCurrentUser());
        }
        Question saved = questionRepository.save(question);

        if (id != null) {
            questionOptionRepository.deleteAll(questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(id));
        }

        payload.options().forEach(optionPayload -> {
            QuestionOption option = new QuestionOption();
            option.setQuestion(saved);
            option.setOptionLabel(optionPayload.label().trim().toUpperCase());
            option.setOptionContent(optionPayload.content().trim());
            option.setCorrect(optionPayload.correct());
            questionOptionRepository.save(option);
        });

        return toQuestionDetailDto(saved);
    }

    public ApiDtos.QuestionImportPreviewDto previewQuestionImport(ApiDtos.QuestionImportPayload payload) {
        Subject subject = findSubject(payload.subjectId());
        ImportParseResult parseResult = parseQuestionImport(payload.rawText());
        return new ApiDtos.QuestionImportPreviewDto(
            subject.getId(),
            subject.getName(),
            parseResult.questions().size(),
            parseResult.errors().size(),
            parseResult.questions().stream().map(this::toImportPreviewQuestionDto).toList(),
            parseResult.errors()
        );
    }

    public ApiDtos.QuestionImportResultDto importQuestions(ApiDtos.QuestionImportPayload payload) {
        Subject subject = findSubject(payload.subjectId());
        ImportParseResult parseResult = parseQuestionImport(payload.rawText());
        if (!parseResult.errors().isEmpty()) {
            String errorMessage = parseResult.errors().stream()
                .map(error -> "Block " + error.blockNumber() + ": " + error.message())
                .collect(Collectors.joining(" | "));
            throw new BadRequestException(errorMessage);
        }

        parseResult.questions().forEach(questionData -> saveImportedQuestion(subject, questionData));
        return new ApiDtos.QuestionImportResultDto(parseResult.questions().size());
    }

    public void deleteQuestion(Long id) {
        questionOptionRepository.deleteAll(questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(id));
        questionRepository.delete(findQuestion(id));
    }

    public List<ApiDtos.ExamDto> getExams() {
        return examRepository.findAll().stream().map(this::toExamDto).toList();
    }

    public ApiDtos.ExamDto getExam(Long id) {
        return toExamDto(findExam(id));
    }

    public ApiDtos.ExamDto saveExam(ApiDtos.ExamPayload payload, Long id) {
        Exam exam = id == null ? new Exam() : findExam(id);
        exam.setTitle(payload.title());
        exam.setDescription(payload.description());
        exam.setSubject(findSubject(payload.subjectId()));
        exam.setDurationMinutes(payload.durationMinutes());
        exam.setTotalScore(payload.totalScore());
        exam.setStatus(payload.status());
        exam.setShowAnswersAfterSubmit(payload.showAnswersAfterSubmit());
        if (exam.getCreatedBy() == null) {
            exam.setCreatedBy(getCurrentUser());
        }
        if (payload.status().name().equals("PUBLISHED") && id != null && examQuestionRepository.countByExam_Id(id) < 1) {
            throw new BadRequestException("Exam must contain at least 1 question before publish");
        }
        return toExamDto(examRepository.save(exam));
    }

    public void deleteExam(Long id) {
        examRepository.delete(findExam(id));
    }

    public ApiDtos.ExamDto addQuestionToExam(Long examId, ApiDtos.ExamQuestionPayload payload) {
        ExamQuestion examQuestion = new ExamQuestion();
        examQuestion.setExam(findExam(examId));
        examQuestion.setQuestion(findQuestion(payload.questionId()));
        examQuestion.setDisplayOrder(payload.displayOrder());
        examQuestionRepository.save(examQuestion);
        return getExam(examId);
    }

    public void removeQuestionFromExam(Long examId, Long questionId) {
        examQuestionRepository.deleteByExam_IdAndQuestion_Id(examId, questionId);
    }

    public List<ApiDtos.ExamSessionDto> getExamSessions() {
        return examSessionRepository.findAll().stream().map(this::toSessionDto).toList();
    }

    public ApiDtos.ExamSessionDto getExamSession(Long id) {
        return toSessionDto(findExamSession(id));
    }

    public ApiDtos.ExamSessionDto saveExamSession(ApiDtos.ExamSessionPayload payload, Long id) {
        if (payload.closeTime().isBefore(payload.openTime()) || payload.closeTime().isEqual(payload.openTime())) {
            throw new BadRequestException("Close time must be after open time");
        }
        ExamSession session = id == null ? new ExamSession() : findExamSession(id);
        session.setExam(findExam(payload.examId()));
        session.setTitle(payload.title());
        session.setOpenTime(payload.openTime());
        session.setCloseTime(payload.closeTime());
        session.setDurationMinutes(payload.durationMinutes());
        session.setMaxAttempts(payload.maxAttempts());
        session.setStatus(payload.status());
        if (session.getCreatedBy() == null) {
            session.setCreatedBy(getCurrentUser());
        }
        return toSessionDto(examSessionRepository.save(session));
    }

    public void deleteExamSession(Long id) {
        examSessionRepository.delete(findExamSession(id));
    }

    public ApiDtos.ExamSessionDto updateExamSessionStatus(Long id, SessionStatus status) {
        ExamSession session = findExamSession(id);
        session.setStatus(status);
        return toSessionDto(examSessionRepository.save(session));
    }

    public ApiDtos.AttemptDto startAttempt(Long sessionId) {
        User student = getCurrentUser();
        ExamSession session = findExamSession(sessionId);
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BadRequestException("Session is not active");
        }
        if (LocalDateTime.now().isBefore(session.getOpenTime()) || LocalDateTime.now().isAfter(session.getCloseTime())) {
            throw new BadRequestException("Session is outside the allowed time window");
        }
        if (attemptRepository.countByStudent_IdAndExamSession_Id(student.getId(), sessionId) >= session.getMaxAttempts()) {
            throw new BadRequestException("Max attempts exceeded");
        }
        Attempt attempt = new Attempt();
        attempt.setExamSession(session);
        attempt.setStudent(student);
        attempt.setStatus(AttemptStatus.IN_PROGRESS);
        attempt.setTotalQuestions((int) examQuestionRepository.countByExam_Id(session.getExam().getId()));
        return toAttemptDto(attemptRepository.save(attempt), true);
    }

    public ApiDtos.AttemptDto submitAttempt(Long attemptId, ApiDtos.AttemptSubmitPayload payload) {
        Attempt attempt = findAttempt(attemptId);
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Attempt cannot be submitted twice");
        }

        attemptAnswerRepository.deleteAll(attemptAnswerRepository.findByAttempt_Id(attemptId));
        Map<Long, QuestionOption> optionMap = new HashMap<>();
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExam_IdOrderByDisplayOrderAsc(
            attempt.getExamSession().getExam().getId()
        );

        examQuestions.forEach(examQuestion -> questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(
            examQuestion.getQuestion().getId()
        ).forEach(option -> optionMap.put(option.getId(), option)));

        int correct = 0;
        int wrong = 0;
        int unanswered = 0;

        for (ExamQuestion examQuestion : examQuestions) {
            ApiDtos.AttemptAnswerPayload answerPayload = payload.answers() == null ? null :
                payload.answers().stream()
                    .filter(item -> item.questionId().equals(examQuestion.getQuestion().getId()))
                    .findFirst()
                    .orElse(null);

            QuestionOption selectedOption = answerPayload == null || answerPayload.selectedOptionId() == null
                ? null
                : optionMap.get(answerPayload.selectedOptionId());

            boolean isCorrect = selectedOption != null && selectedOption.isCorrect();

            AttemptAnswer answer = new AttemptAnswer();
            answer.setAttempt(attempt);
            answer.setQuestion(examQuestion.getQuestion());
            answer.setSelectedOption(selectedOption);
            answer.setCorrect(isCorrect);
            attemptAnswerRepository.save(answer);

            if (selectedOption == null) {
                unanswered++;
            } else if (isCorrect) {
                correct++;
            } else {
                wrong++;
            }
        }

        attempt.setCorrectAnswers(correct);
        attempt.setWrongAnswers(wrong);
        attempt.setUnansweredAnswers(unanswered);
        attempt.setScore(correct);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setCompletionSeconds(Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).toSeconds());
        attempt.setStatus(payload.autoSubmitted() ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.SUBMITTED);
        return toAttemptDto(attemptRepository.save(attempt), false);
    }

    public ApiDtos.AttemptDto getAttempt(Long id) {
        return toAttemptDto(findAttempt(id), false);
    }

    public List<ApiDtos.AttemptDto> getMyAttempts() {
        User user = getCurrentUser();
        return attemptRepository.findByStudent_IdOrderByStartedAtDesc(user.getId()).stream()
            .map(attempt -> toAttemptDto(attempt, false))
            .toList();
    }

    public List<ApiDtos.AttemptDto> getAttemptsBySession(Long sessionId) {
        return attemptRepository.findByExamSession_Id(sessionId).stream()
            .map(attempt -> toAttemptDto(attempt, false))
            .toList();
    }

    public ApiDtos.DashboardOverviewDto getDashboardOverview() {
        return new ApiDtos.DashboardOverviewDto(
            userRepository.count(),
            userRepository.countByRole_Name(RoleName.STUDENT),
            userRepository.countByRole_Name(RoleName.INSTRUCTOR),
            questionRepository.count(),
            examRepository.count(),
            examSessionRepository.count(),
            attemptRepository.count()
        );
    }

    public List<ApiDtos.DashboardExamStatsDto> getDashboardExamStats() {
        return examSessionRepository.findAll().stream().map(session -> {
            List<Attempt> attempts = attemptRepository.findByExamSession_Id(session.getId());
            double average = attempts.stream().mapToDouble(Attempt::getScore).average().orElse(0);
            double highest = attempts.stream().mapToDouble(Attempt::getScore).max().orElse(0);
            double lowest = attempts.stream().mapToDouble(Attempt::getScore).min().orElse(0);
            return new ApiDtos.DashboardExamStatsDto(session.getTitle(), average, highest, lowest, attempts.size());
        }).toList();
    }

    public ApiDtos.DashboardQuestionStatsDto getDashboardQuestionStats() {
        return new ApiDtos.DashboardQuestionStatsDto(
            questionRepository.count(),
            subjectRepository.count()
        );
    }

    private ApiDtos.AuthResponse buildAuthResponse(User user) {
        org.springframework.security.core.userdetails.User userDetails =
            new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                List.of(() -> "ROLE_" + user.getRole().getName().name())
            );
        return new ApiDtos.AuthResponse(jwtService.generateToken(userDetails), toUserDto(user));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return getUserByEmail(email);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Subject findSubject(Long id) {
        return subjectRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Subject not found"));
    }

    private Question findQuestion(Long id) {
        return questionRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Question not found"));
    }

    private Exam findExam(Long id) {
        return examRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Exam not found"));
    }

    private ExamSession findExamSession(Long id) {
        return examSessionRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Exam session not found"));
    }

    private Attempt findAttempt(Long id) {
        return attemptRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Attempt not found"));
    }

    private Role getRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
            .orElseThrow(() -> new NotFoundException("Role not found"));
    }

    private void validateQuestionPayload(ApiDtos.QuestionPayload payload) {
        long correctCount = payload.options().stream().filter(ApiDtos.OptionPayload::correct).count();
        if (correctCount != 1) {
            throw new BadRequestException("Exactly 1 correct option is required");
        }

        Set<String> labels = payload.options().stream()
            .map(option -> option.label().trim().toUpperCase())
            .collect(Collectors.toCollection(HashSet::new));

        Set<String> requiredLabels = new HashSet<>(Arrays.asList("A", "B", "C", "D"));
        if (!labels.equals(requiredLabels)) {
            throw new BadRequestException("Question options must be exactly A, B, C, and D");
        }
    }

    private ApiDtos.UserDto toUserDto(User user) {
        return new ApiDtos.UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole().getName(), user.getStatus());
    }

    private ApiDtos.QuestionSummaryDto toQuestionSummaryDto(Question question) {
        QuestionOption correctOption = questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(question.getId()).stream()
            .filter(QuestionOption::isCorrect)
            .findFirst()
            .orElse(null);

        return new ApiDtos.QuestionSummaryDto(
            question.getId(),
            question.getContent(),
            question.getSubject().getId(),
            question.getSubject().getName(),
            correctOption == null ? null : correctOption.getOptionLabel(),
            correctOption == null ? null : correctOption.getOptionContent()
        );
    }

    private ApiDtos.QuestionDetailDto toQuestionDetailDto(Question question) {
        List<ApiDtos.OptionDto> options = questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(question.getId()).stream()
            .map(option -> new ApiDtos.OptionDto(option.getId(), option.getOptionLabel(), option.getOptionContent(), option.isCorrect()))
            .toList();

        return new ApiDtos.QuestionDetailDto(
            question.getId(),
            question.getContent(),
            question.getSubject().getId(),
            question.getSubject().getName(),
            options
        );
    }

    private ApiDtos.ExamDto toExamDto(Exam exam) {
        return new ApiDtos.ExamDto(
            exam.getId(),
            exam.getTitle(),
            exam.getDescription(),
            exam.getSubject().getId(),
            exam.getSubject().getName(),
            exam.getDurationMinutes(),
            exam.getTotalScore(),
            exam.getStatus(),
            exam.isShowAnswersAfterSubmit(),
            (int) examQuestionRepository.countByExam_Id(exam.getId())
        );
    }

    private ApiDtos.ExamSessionDto toSessionDto(ExamSession session) {
        return new ApiDtos.ExamSessionDto(
            session.getId(),
            session.getExam().getId(),
            session.getExam().getTitle(),
            session.getTitle(),
            session.getOpenTime(),
            session.getCloseTime(),
            session.getDurationMinutes(),
            session.getMaxAttempts(),
            session.getStatus(),
            (int) examQuestionRepository.countByExam_Id(session.getExam().getId())
        );
    }

    private ApiDtos.AttemptDto toAttemptDto(Attempt attempt, boolean includeQuestions) {
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExam_IdOrderByDisplayOrderAsc(
            attempt.getExamSession().getExam().getId()
        );

        List<ApiDtos.AttemptQuestionDto> questions = includeQuestions
            ? examQuestions.stream().map(item -> new ApiDtos.AttemptQuestionDto(
                item.getQuestion().getId(),
                item.getQuestion().getContent(),
                item.getDisplayOrder(),
                questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(item.getQuestion().getId()).stream()
                    .map(option -> new ApiDtos.OptionDto(option.getId(), option.getOptionLabel(), option.getOptionContent(), false))
                    .toList()
            )).toList()
            : List.of();

        List<ApiDtos.AttemptReviewDto> review = new ArrayList<>();
        if (!includeQuestions) {
            review = attemptAnswerRepository.findByAttempt_Id(attempt.getId()).stream()
                .map(answer -> {
                    List<QuestionOption> options = questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(answer.getQuestion().getId());
                    String correctLabel = options.stream().filter(QuestionOption::isCorrect).findFirst().map(QuestionOption::getOptionLabel).orElse(null);
                    String selectedLabel = answer.getSelectedOption() == null ? null : answer.getSelectedOption().getOptionLabel();
                    return new ApiDtos.AttemptReviewDto(
                        answer.getQuestion().getId(),
                        answer.getQuestion().getContent(),
                        selectedLabel,
                        correctLabel,
                        answer.isCorrect()
                    );
                })
                .sorted(Comparator.comparing(ApiDtos.AttemptReviewDto::questionId))
                .collect(Collectors.toCollection(ArrayList::new));
        }

        return new ApiDtos.AttemptDto(
            attempt.getId(),
            attempt.getExamSession().getId(),
            attempt.getExamSession().getTitle(),
            attempt.getExamSession().getExam().getTitle(),
            attempt.getExamSession().getDurationMinutes(),
            attempt.getStatus(),
            attempt.getStartedAt(),
            attempt.getSubmittedAt(),
            attempt.getTotalQuestions(),
            attempt.getCorrectAnswers(),
            attempt.getWrongAnswers(),
            attempt.getUnansweredAnswers(),
            attempt.getScore(),
            attempt.getCompletionSeconds(),
            questions,
            review
        );
    }

    private ApiDtos.QuestionImportPreviewQuestionDto toImportPreviewQuestionDto(ImportedQuestionData questionData) {
        ApiDtos.OptionDto correctOption = questionData.options().stream()
            .filter(ApiDtos.OptionPayload::correct)
            .map(option -> new ApiDtos.OptionDto(null, option.label(), option.content(), true))
            .findFirst()
            .orElse(null);

        return new ApiDtos.QuestionImportPreviewQuestionDto(
            questionData.content(),
            correctOption == null ? null : correctOption.label(),
            correctOption == null ? null : correctOption.content(),
            questionData.options().stream()
                .map(option -> new ApiDtos.OptionDto(null, option.label(), option.content(), option.correct()))
                .toList()
        );
    }

    private void saveImportedQuestion(Subject subject, ImportedQuestionData questionData) {
        ApiDtos.QuestionPayload payload = new ApiDtos.QuestionPayload(questionData.content(), subject.getId(), questionData.options());
        validateQuestionPayload(payload);

        Question question = new Question();
        question.setContent(questionData.content());
        question.setSubject(subject);
        question.setCreatedBy(getCurrentUser());
        Question saved = questionRepository.save(question);

        questionData.options().forEach(optionPayload -> {
            QuestionOption option = new QuestionOption();
            option.setQuestion(saved);
            option.setOptionLabel(optionPayload.label().trim().toUpperCase());
            option.setOptionContent(optionPayload.content().trim());
            option.setCorrect(optionPayload.correct());
            questionOptionRepository.save(option);
        });
    }

    private ImportParseResult parseQuestionImport(String rawText) {
        String normalized = rawText == null ? "" : rawText.replace("\r\n", "\n").trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Import text is empty");
        }

        List<ImportedQuestionData> questions = new ArrayList<>();
        List<ApiDtos.QuestionImportErrorDto> errors = new ArrayList<>();
        String[] blocks = normalized.split("\\n\\s*\\n");

        for (int i = 0; i < blocks.length; i++) {
            String block = blocks[i].trim();
            if (block.isBlank()) {
                continue;
            }

            try {
                questions.add(parseQuestionBlock(block));
            } catch (BadRequestException exception) {
                errors.add(new ApiDtos.QuestionImportErrorDto(i + 1, exception.getMessage(), block));
            }
        }

        return new ImportParseResult(questions, errors);
    }

    private ImportedQuestionData parseQuestionBlock(String block) {
        List<String> lines = block.lines()
            .map(String::trim)
            .filter(line -> !line.isBlank())
            .toList();

        Map<String, String> values = new LinkedHashMap<>();
        Set<String> allowedKeys = Set.of("Q", "A", "B", "C", "D", "ANSWER");

        for (String line : lines) {
            int separatorIndex = line.indexOf(':');
            if (separatorIndex < 1) {
                throw new BadRequestException("Each line must use the format KEY: value");
            }

            String key = line.substring(0, separatorIndex).trim().toUpperCase();
            String value = line.substring(separatorIndex + 1).trim();

            if (!allowedKeys.contains(key)) {
                throw new BadRequestException("Unsupported line prefix: " + key);
            }
            if (values.containsKey(key)) {
                throw new BadRequestException("Duplicate line prefix: " + key);
            }
            if (value.isBlank()) {
                throw new BadRequestException("Line " + key + " cannot be empty");
            }

            values.put(key, value);
        }

        List<String> requiredKeys = List.of("Q", "A", "B", "C", "D", "ANSWER");
        for (String key : requiredKeys) {
            if (!values.containsKey(key)) {
                throw new BadRequestException("Missing required line: " + key + ":");
            }
        }

        String correctLabel = values.get("ANSWER").trim().toUpperCase();
        if (!Set.of("A", "B", "C", "D").contains(correctLabel)) {
            throw new BadRequestException("ANSWER must be one of A, B, C, or D");
        }

        return new ImportedQuestionData(
            values.get("Q").trim(),
            List.of(
                new ApiDtos.OptionPayload("A", values.get("A").trim(), "A".equals(correctLabel)),
                new ApiDtos.OptionPayload("B", values.get("B").trim(), "B".equals(correctLabel)),
                new ApiDtos.OptionPayload("C", values.get("C").trim(), "C".equals(correctLabel)),
                new ApiDtos.OptionPayload("D", values.get("D").trim(), "D".equals(correctLabel))
            )
        );
    }

    private record ImportedQuestionData(String content, List<ApiDtos.OptionPayload> options) {
    }

    private record ImportParseResult(
        List<ImportedQuestionData> questions,
        List<ApiDtos.QuestionImportErrorDto> errors
    ) {
    }
}
