package com.examportal.backend.service;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.entity.Attempt;
import com.examportal.backend.entity.AttemptAnswer;
import com.examportal.backend.entity.Classroom;
import com.examportal.backend.entity.ClassroomExamAssignment;
import com.examportal.backend.entity.ClassroomMember;
import com.examportal.backend.entity.Exam;
import com.examportal.backend.entity.ExamQuestion;
import com.examportal.backend.entity.ExamSession;
import com.examportal.backend.entity.ExamSessionQuestion;
import com.examportal.backend.entity.ExamSessionQuestionOption;
import com.examportal.backend.entity.Question;
import com.examportal.backend.entity.QuestionBank;
import com.examportal.backend.entity.QuestionOption;
import com.examportal.backend.entity.Role;
import com.examportal.backend.entity.Subject;
import com.examportal.backend.entity.User;
import com.examportal.backend.entity.enums.AttemptStatus;
import com.examportal.backend.entity.enums.ClassroomMemberStatus;
import com.examportal.backend.entity.enums.RoleName;
import com.examportal.backend.entity.enums.SessionStatus;
import com.examportal.backend.entity.enums.UserStatus;
import com.examportal.backend.exception.BadRequestException;
import com.examportal.backend.exception.NotFoundException;
import com.examportal.backend.repository.AttemptAnswerRepository;
import com.examportal.backend.repository.AttemptRepository;
import com.examportal.backend.repository.ClassroomExamAssignmentRepository;
import com.examportal.backend.repository.ClassroomMemberRepository;
import com.examportal.backend.repository.ClassroomRepository;
import com.examportal.backend.repository.ExamQuestionRepository;
import com.examportal.backend.repository.ExamRepository;
import com.examportal.backend.repository.ExamSessionRepository;
import com.examportal.backend.repository.ExamSessionQuestionOptionRepository;
import com.examportal.backend.repository.ExamSessionQuestionRepository;
import com.examportal.backend.repository.QuestionBankRepository;
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
import java.util.Collections;
import java.util.concurrent.atomic.AtomicInteger;
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
    private final QuestionBankRepository questionBankRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamSessionRepository examSessionRepository;
    private final ExamSessionQuestionRepository examSessionQuestionRepository;
    private final ExamSessionQuestionOptionRepository examSessionQuestionOptionRepository;
    private final AttemptRepository attemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassroomMemberRepository classroomMemberRepository;
    private final ClassroomExamAssignmentRepository classroomExamAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public PortalService(UserRepository userRepository, RoleRepository roleRepository, SubjectRepository subjectRepository,
                         QuestionBankRepository questionBankRepository,
                         QuestionRepository questionRepository,
                         QuestionOptionRepository questionOptionRepository, ExamRepository examRepository,
                         ExamQuestionRepository examQuestionRepository, ExamSessionRepository examSessionRepository,
                         ExamSessionQuestionRepository examSessionQuestionRepository,
                         ExamSessionQuestionOptionRepository examSessionQuestionOptionRepository,
                         AttemptRepository attemptRepository, AttemptAnswerRepository attemptAnswerRepository,
                         ClassroomRepository classroomRepository, ClassroomMemberRepository classroomMemberRepository,
                         ClassroomExamAssignmentRepository classroomExamAssignmentRepository,
                         PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,
                         JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.subjectRepository = subjectRepository;
        this.questionBankRepository = questionBankRepository;
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.examRepository = examRepository;
        this.examQuestionRepository = examQuestionRepository;
        this.examSessionRepository = examSessionRepository;
        this.examSessionQuestionRepository = examSessionQuestionRepository;
        this.examSessionQuestionOptionRepository = examSessionQuestionOptionRepository;
        this.attemptRepository = attemptRepository;
        this.attemptAnswerRepository = attemptAnswerRepository;
        this.classroomRepository = classroomRepository;
        this.classroomMemberRepository = classroomMemberRepository;
        this.classroomExamAssignmentRepository = classroomExamAssignmentRepository;
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

    public List<ApiDtos.UserDto> getUsers(String keyword, UserStatus status, RoleName role) {
        List<User> users;
        if (keyword != null && !keyword.isBlank()) {
            users = userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, keyword);
        } else if (status != null) {
            users = userRepository.findByStatus(status);
        } else if (role != null) {
            users = userRepository.findByRole_Name(role);
        } else {
            users = userRepository.findAll();
        }
        return users.stream()
            .filter(user -> role == null || user.getRole().getName() == role)
            .filter(user -> status == null || user.getStatus() == status)
            .map(this::toUserDto)
            .toList();
    }

    public ApiDtos.UserDto getUser(Long id) {
        return toUserDto(findUser(id));
    }

    public ApiDtos.UserDto saveUser(ApiDtos.UserPayload payload, Long id) {
        User user = id == null ? new User() : findUser(id);
        if (id == null && userRepository.existsByEmail(payload.email())) {
            throw new BadRequestException("Email already exists");
        }
        if (id != null && userRepository.existsByEmailAndIdNot(payload.email(), id)) {
            throw new BadRequestException("Email already exists");
        }
        ensureAdminDoesNotDisableOwnAccount(user, payload.role(), payload.status());
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
        ensureAdminDoesNotDisableOwnAccount(user, user.getRole().getName(), status);
        user.setStatus(status);
        return toUserDto(userRepository.save(user));
    }

    public ApiDtos.UserDto updateUserRole(Long id, RoleName roleName) {
        User user = findUser(id);
        ensureAdminDoesNotDisableOwnAccount(user, roleName, user.getStatus());
        user.setRole(getRole(roleName));
        return toUserDto(userRepository.save(user));
    }

    public List<ApiDtos.SubjectDto> getSubjects() {
        return subjectRepository.findByCreatedBy_IdOrderByNameAsc(getCurrentUser().getId()).stream()
            .map(subject -> new ApiDtos.SubjectDto(
                subject.getId(),
                subject.getName(),
                questionBankRepository.countBySubject_Id(subject.getId()),
                questionRepository.countByQuestionBank_Subject_Id(subject.getId())
            ))
            .toList();
    }

    public ApiDtos.SubjectDto saveSubject(ApiDtos.SubjectPayload payload, Long id) {
        validateSubjectName(payload.name(), id);
        Subject subject = id == null ? new Subject() : findSubject(id);
        if (id != null) {
            ensureOwnedByCurrentUser(subject.getCreatedBy(), "Subject");
        }
        subject.setName(payload.name().trim());
        if (subject.getCreatedBy() == null) {
            subject.setCreatedBy(getCurrentUser());
        }
        Subject saved = subjectRepository.save(subject);
        return new ApiDtos.SubjectDto(
            saved.getId(),
            saved.getName(),
            questionBankRepository.countBySubject_Id(saved.getId()),
            questionRepository.countByQuestionBank_Subject_Id(saved.getId())
        );
    }

    public void deleteSubject(Long id) {
        Subject subject = findSubject(id);
        ensureOwnedByCurrentUser(subject.getCreatedBy(), "Subject");
        List<Exam> exams = examRepository.findBySubject_Id(id);
        exams.forEach(exam -> deleteExamDependencies(exam.getId()));
        if (!exams.isEmpty()) {
            examRepository.deleteBySubject_Id(id);
            examRepository.flush();
        }
        deleteQuestionBanksBySubjectId(id);
        subjectRepository.delete(subject);
        subjectRepository.flush();
    }

    public List<ApiDtos.ClassroomDto> getClassrooms() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole().getName() == RoleName.STUDENT) {
            return classroomMemberRepository.findByUser_IdOrderByJoinedAtDesc(currentUser.getId()).stream()
                .map(member -> toClassroomDto(member.getClassroom(), member.getStatus()))
                .toList();
        }

        List<Classroom> classrooms = classroomRepository.findByCreatedBy_IdOrderByCreatedAtDesc(currentUser.getId());
        return classrooms.stream()
            .map(classroom -> toClassroomDto(classroom, null))
            .toList();
    }

    public ApiDtos.ClassroomDto getClassroom(Long id) {
        User currentUser = getCurrentUser();
        Classroom classroom = findClassroom(id);
        if (currentUser.getRole().getName() == RoleName.STUDENT) {
            ClassroomMember member = findClassroomMember(id, currentUser.getId());
            return toClassroomDto(classroom, member.getStatus());
        }
        ensureClassroomManagementAccess(classroom);
        return toClassroomDto(classroom, null);
    }

    public ApiDtos.ClassroomDto saveClassroom(ApiDtos.ClassroomPayload payload, Long id) {
        Classroom classroom = id == null ? new Classroom() : findClassroom(id);
        if (id != null) {
            ensureClassroomManagementAccess(classroom);
        }

        classroom.setName(normalizeRequiredText(payload.name(), "Classroom name is required"));
        if (classroom.getCreatedBy() == null) {
            classroom.setCreatedBy(getCurrentUser());
            classroom.setJoinCode(generateJoinCode());
        }
        return toClassroomDto(classroomRepository.save(classroom), null);
    }

    public void deleteClassroom(Long id) {
        Classroom classroom = findClassroom(id);
        ensureClassroomManagementAccess(classroom);
        classroomExamAssignmentRepository.deleteByClassroom_Id(classroom.getId());
        classroomMemberRepository.deleteByClassroom_Id(classroom.getId());
        classroomRepository.delete(classroom);
    }

    public ApiDtos.ClassroomDto regenerateClassroomJoinCode(Long id) {
        Classroom classroom = findClassroom(id);
        ensureClassroomManagementAccess(classroom);
        classroom.setJoinCode(generateJoinCode());
        return toClassroomDto(classroomRepository.save(classroom), null);
    }

    public ApiDtos.ClassroomDto joinClassroom(ApiDtos.ClassroomJoinPayload payload) {
        User student = getCurrentUser();
        Classroom classroom = classroomRepository.findByJoinCodeIgnoreCase(normalizeRequiredText(payload.joinCode(), "Join code is required"))
            .orElseThrow(() -> new NotFoundException("Classroom not found"));

        classroomMemberRepository.findByClassroom_IdAndUser_Id(classroom.getId(), student.getId())
            .ifPresent(member -> {
                if (member.getStatus() == ClassroomMemberStatus.APPROVED) {
                    throw new BadRequestException("You have already joined this classroom");
                }
                throw new BadRequestException("Your join request is already pending approval");
            });

        ClassroomMember member = new ClassroomMember();
        member.setClassroom(classroom);
        member.setUser(student);
        member.setStatus(ClassroomMemberStatus.PENDING);
        classroomMemberRepository.save(member);
        return toClassroomDto(classroom, ClassroomMemberStatus.PENDING);
    }

    public List<ApiDtos.ClassroomMemberDto> getClassroomMembers(Long classroomId) {
        Classroom classroom = findClassroom(classroomId);
        ensureClassroomManagementAccess(classroom);
        return classroomMemberRepository.findByClassroom_IdOrderByStatusAscJoinedAtAsc(classroomId).stream()
            .map(this::toClassroomMemberDto)
            .toList();
    }

    public ApiDtos.ClassroomMemberDto approveClassroomMember(Long classroomId, Long memberId) {
        Classroom classroom = findClassroom(classroomId);
        ensureClassroomManagementAccess(classroom);
        ClassroomMember member = findClassroomMemberById(memberId);
        if (!member.getClassroom().getId().equals(classroom.getId())) {
            throw new NotFoundException("Classroom member not found");
        }
        member.setStatus(ClassroomMemberStatus.APPROVED);
        return toClassroomMemberDto(classroomMemberRepository.save(member));
    }

    public void removeClassroomMember(Long classroomId, Long memberId) {
        Classroom classroom = findClassroom(classroomId);
        ensureClassroomManagementAccess(classroom);
        ClassroomMember member = findClassroomMemberById(memberId);
        if (!member.getClassroom().getId().equals(classroom.getId())) {
            throw new NotFoundException("Classroom member not found");
        }
        classroomMemberRepository.delete(member);
    }

    public void leaveClassroom(Long classroomId) {
        User currentUser = getCurrentUser();
        ClassroomMember member = findClassroomMember(classroomId, currentUser.getId());
        classroomMemberRepository.delete(member);
    }

    public List<ApiDtos.ClassroomExamAssignmentDto> getClassroomAssignments(Long classroomId) {
        Classroom classroom = findClassroom(classroomId);
        ensureClassroomReadAccess(classroom);
        return classroomExamAssignmentRepository.findByClassroom_IdOrderByAssignedAtDesc(classroomId).stream()
            .map(this::toClassroomAssignmentDto)
            .toList();
    }

    public ApiDtos.ClassroomExamAssignmentDto assignExamSessionToClassroom(Long classroomId, ApiDtos.ClassroomExamAssignmentPayload payload) {
        Classroom classroom = findClassroom(classroomId);
        ensureClassroomManagementAccess(classroom);
        if (classroomExamAssignmentRepository.existsByClassroom_IdAndExamSession_Id(classroomId, payload.examSessionId())) {
            throw new BadRequestException("Exam session is already assigned to this classroom");
        }

        ClassroomExamAssignment assignment = new ClassroomExamAssignment();
        assignment.setClassroom(classroom);
        ExamSession session = findExamSession(payload.examSessionId());
        ensureOwnedByCurrentUser(session.getCreatedBy(), "Exam session");
        assignment.setExamSession(session);
        return toClassroomAssignmentDto(classroomExamAssignmentRepository.save(assignment));
    }

    public void removeClassroomAssignment(Long classroomId, Long assignmentId) {
        Classroom classroom = findClassroom(classroomId);
        ensureClassroomManagementAccess(classroom);
        ClassroomExamAssignment assignment = findClassroomAssignment(assignmentId);
        if (!assignment.getClassroom().getId().equals(classroom.getId())) {
            throw new NotFoundException("Classroom assignment not found");
        }
        classroomExamAssignmentRepository.delete(assignment);
    }

    public List<ApiDtos.QuestionBankDto> getQuestionBanks(Long subjectId) {
        ensureOwnedByCurrentUser(findSubject(subjectId).getCreatedBy(), "Subject");
        return questionBankRepository.findBySubject_IdOrderByNameAsc(subjectId).stream()
            .map(this::toQuestionBankDto)
            .toList();
    }

    public ApiDtos.QuestionBankDto saveQuestionBank(ApiDtos.QuestionBankPayload payload, Long id) {
        Subject subject = findSubject(payload.subjectId());
        ensureOwnedByCurrentUser(subject.getCreatedBy(), "Subject");
        validateQuestionBankName(subject.getId(), payload.name(), id);

        QuestionBank questionBank = id == null ? new QuestionBank() : findQuestionBank(id);
        if (id != null) {
            ensureOwnedByCurrentUser(questionBank.getCreatedBy(), "Question bank");
        }
        questionBank.setSubject(subject);
        questionBank.setName(payload.name().trim());
        questionBank.setDescription(normalizeOptionalText(payload.description()));
        if (questionBank.getCreatedBy() == null) {
            questionBank.setCreatedBy(getCurrentUser());
        }
        return toQuestionBankDto(questionBankRepository.save(questionBank));
    }

    public void deleteQuestionBank(Long id) {
        QuestionBank questionBank = findQuestionBank(id);
        ensureOwnedByCurrentUser(questionBank.getCreatedBy(), "Question bank");
        deleteQuestionsByBankId(id);
        questionBankRepository.deleteById(questionBank.getId());
        questionBankRepository.flush();
    }

    public List<ApiDtos.QuestionSummaryDto> getQuestions(String keyword, Long subjectId, Long questionBankId) {
        List<Question> questions;
        if (questionBankId != null && keyword != null && !keyword.isBlank()) {
            questions = questionRepository.findByQuestionBank_IdAndContentContainingIgnoreCase(questionBankId, keyword);
        } else if (questionBankId != null) {
            questions = questionRepository.findByQuestionBank_Id(questionBankId);
        } else if (subjectId != null && keyword != null && !keyword.isBlank()) {
            questions = questionRepository.findByQuestionBank_Subject_IdAndContentContainingIgnoreCase(subjectId, keyword);
        } else if (subjectId != null) {
            questions = questionRepository.findByQuestionBank_Subject_Id(subjectId);
        } else if (keyword != null && !keyword.isBlank()) {
            questions = questionRepository.findByContentContainingIgnoreCase(keyword);
        } else {
            questions = questionRepository.findAll();
        }
        Long currentUserId = getCurrentUser().getId();
        return questions.stream()
            .filter(question -> question.getCreatedBy() != null && question.getCreatedBy().getId().equals(currentUserId))
            .map(this::toQuestionSummaryDto)
            .toList();
    }

    public ApiDtos.QuestionDetailDto getQuestion(Long id) {
        Question question = findQuestion(id);
        ensureOwnedByCurrentUser(question.getCreatedBy(), "Question");
        return toQuestionDetailDto(question);
    }

    public ApiDtos.QuestionDetailDto saveQuestion(ApiDtos.QuestionPayload payload, Long id) {
        validateQuestionPayload(payload);

        Question question = id == null ? new Question() : findQuestion(id);
        QuestionBank questionBank = findQuestionBank(payload.questionBankId());
        ensureOwnedByCurrentUser(questionBank.getCreatedBy(), "Question bank");
        if (id != null) {
            ensureOwnedByCurrentUser(question.getCreatedBy(), "Question");
        }

        question.setContent(payload.content().trim());
        question.setQuestionBank(questionBank);
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
        QuestionBank questionBank = findQuestionBank(payload.questionBankId());
        ensureOwnedByCurrentUser(questionBank.getCreatedBy(), "Question bank");
        ImportParseResult parseResult = parseQuestionImport(payload.rawText());
        return new ApiDtos.QuestionImportPreviewDto(
            questionBank.getId(),
            questionBank.getName(),
            questionBank.getSubject().getId(),
            questionBank.getSubject().getName(),
            parseResult.questions().size(),
            parseResult.errors().size(),
            parseResult.questions().stream().map(this::toImportPreviewQuestionDto).toList(),
            parseResult.errors()
        );
    }

    public ApiDtos.QuestionImportResultDto importQuestions(ApiDtos.QuestionImportPayload payload) {
        QuestionBank questionBank = findQuestionBank(payload.questionBankId());
        ensureOwnedByCurrentUser(questionBank.getCreatedBy(), "Question bank");
        ImportParseResult parseResult = parseQuestionImport(payload.rawText());
        if (!parseResult.errors().isEmpty()) {
            String errorMessage = parseResult.errors().stream()
                .map(error -> "Block " + error.blockNumber() + ": " + error.message())
                .collect(Collectors.joining(" | "));
            throw new BadRequestException(errorMessage);
        }

        parseResult.questions().forEach(questionData -> saveImportedQuestion(questionBank, questionData));
        return new ApiDtos.QuestionImportResultDto(parseResult.questions().size());
    }

    public void deleteQuestion(Long id) {
        ensureOwnedByCurrentUser(findQuestion(id).getCreatedBy(), "Question");
        questionOptionRepository.deleteAll(questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(id));
        questionRepository.delete(findQuestion(id));
    }

    public List<ApiDtos.ExamDto> getDrafts() {
        return examRepository.findByCreatedBy_Id(getCurrentUser().getId()).stream().map(this::toExamDto).toList();
    }

    public ApiDtos.ExamDto getDraft(Long id) {
        Exam exam = findExam(id);
        ensureOwnedByCurrentUser(exam.getCreatedBy(), "Exam");
        return toExamDto(exam);
    }

    public ApiDtos.ExamDto saveDraft(ApiDtos.ExamPayload payload, Long id) {
        Exam exam = id == null ? new Exam() : findExam(id);
        ensureExamEditable(exam);
        ensureOwnedByCurrentUser(findSubject(payload.subjectId()).getCreatedBy(), "Subject");
        if (id != null && !exam.getSubject().getId().equals(payload.subjectId())
            && examQuestionRepository.countByExam_Id(id) > 0) {
            throw new BadRequestException("Cannot change subject while the exam still contains questions");
        }
        long questionCount = id == null ? 0 : examQuestionRepository.countByExam_Id(id);
        if (id != null && payload.requiredQuestionCount() < questionCount) {
            throw new BadRequestException("Required question count cannot be less than the current draft question count");
        }
        exam.setTitle(payload.title());
        exam.setDescription(payload.description());
        exam.setSubject(findSubject(payload.subjectId()));
        exam.setRequiredQuestionCount(payload.requiredQuestionCount());
        exam.setShowAnswersAfterSubmit(payload.showAnswersAfterSubmit());
        if (exam.getCreatedBy() == null) {
            exam.setCreatedBy(getCurrentUser());
        }
        return toExamDto(examRepository.save(exam));
    }

    public void deleteExam(Long id) {
        Exam exam = findExam(id);
        ensureExamEditable(exam);
        deleteExamDependencies(id);
        examRepository.delete(exam);
    }

    public ApiDtos.ExamDto addQuestionToExam(Long examId, ApiDtos.ExamQuestionPayload payload) {
        Exam exam = findExam(examId);
        ensureExamEditable(exam);
        ensureDraftHasCapacity(exam, 1);
        Question question = findQuestion(payload.questionId());
        ensureOwnedByCurrentUser(question.getCreatedBy(), "Question");
        if (!exam.getSubject().getId().equals(question.getQuestionBank().getSubject().getId())) {
            throw new BadRequestException("Question subject must match exam subject");
        }
        if (examQuestionRepository.existsByExam_IdAndQuestion_Id(examId, payload.questionId())) {
            throw new BadRequestException("Question already exists in this exam");
        }

        ExamQuestion examQuestion = new ExamQuestion();
        examQuestion.setExam(exam);
        examQuestion.setQuestion(question);
        examQuestion.setDisplayOrder((int) examQuestionRepository.countByExam_Id(examId) + 1);
        examQuestionRepository.save(examQuestion);
        return getDraft(examId);
    }

    public ApiDtos.ExamDto addQuestionsToExam(Long examId, ApiDtos.ExamBulkQuestionPayload payload) {
        Exam exam = findExam(examId);
        ensureExamEditable(exam);

        List<ExamQuestion> existingQuestions = examQuestionRepository.findByExam_IdOrderByDisplayOrderAscIdAsc(examId);
        Set<Long> existingQuestionIds = existingQuestions.stream()
            .map(item -> item.getQuestion().getId())
            .collect(Collectors.toSet());
        AtomicInteger nextOrder = new AtomicInteger(existingQuestions.size() + 1);
        long incomingUniqueCount = payload.questionIds().stream()
            .filter(questionId -> !existingQuestionIds.contains(questionId))
            .count();
        ensureDraftHasCapacity(exam, incomingUniqueCount);

        for (Long questionId : payload.questionIds()) {
            if (existingQuestionIds.contains(questionId)) {
                continue;
            }

            Question question = findQuestion(questionId);
            ensureOwnedByCurrentUser(question.getCreatedBy(), "Question");
            if (!exam.getSubject().getId().equals(question.getQuestionBank().getSubject().getId())) {
                throw new BadRequestException("Question subject must match exam subject");
            }

            ExamQuestion examQuestion = new ExamQuestion();
            examQuestion.setExam(exam);
            examQuestion.setQuestion(question);
            examQuestion.setDisplayOrder(nextOrder.getAndIncrement());
            examQuestionRepository.save(examQuestion);
            existingQuestionIds.add(questionId);
        }

        return getDraft(examId);
    }

    public void removeQuestionFromExam(Long examId, Long examQuestionOrQuestionId) {
        ensureExamEditable(findExam(examId));

        long deletedByExamQuestionId = examQuestionRepository.deleteByIdAndExam_Id(examQuestionOrQuestionId, examId);
        if (deletedByExamQuestionId > 0) {
            examQuestionRepository.flush();
            normalizeExamQuestionOrder(examId);
            return;
        }

        long deletedByQuestionId = examQuestionRepository.deleteByExam_IdAndQuestion_Id(examId, examQuestionOrQuestionId);
        if (deletedByQuestionId > 0) {
            examQuestionRepository.flush();
            normalizeExamQuestionOrder(examId);
            return;
        }

        throw new NotFoundException("Exam question not found");
    }

    public ApiDtos.ExamDto reorderExamQuestions(Long examId, ApiDtos.ExamQuestionReorderPayload payload) {
        ensureExamEditable(findExam(examId));
        List<ExamQuestion> currentQuestions = examQuestionRepository.findByExam_IdOrderByDisplayOrderAscIdAsc(examId);
        if (currentQuestions.size() != payload.examQuestionIds().size()) {
            throw new BadRequestException("Reorder payload must include every exam question");
        }
        if (new HashSet<>(payload.examQuestionIds()).size() != payload.examQuestionIds().size()) {
            throw new BadRequestException("Reorder payload contains duplicate questions");
        }

        Map<Long, ExamQuestion> questionMap = currentQuestions.stream()
            .collect(Collectors.toMap(ExamQuestion::getId, item -> item));

        for (Long examQuestionId : payload.examQuestionIds()) {
            if (!questionMap.containsKey(examQuestionId)) {
                throw new BadRequestException("Reorder payload contains a question outside this exam");
            }
        }

        for (int index = 0; index < payload.examQuestionIds().size(); index++) {
            ExamQuestion examQuestion = questionMap.get(payload.examQuestionIds().get(index));
            examQuestion.setDisplayOrder(index + 1);
        }

        examQuestionRepository.saveAll(currentQuestions);
        return getDraft(examId);
    }

    public List<ApiDtos.ExamSessionDto> getExamSessions() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole().getName() != RoleName.STUDENT) {
            return examSessionRepository.findByCreatedBy_Id(currentUser.getId()).stream().map(this::toSessionDto).toList();
        }

        List<Long> approvedClassroomIds = getApprovedClassroomIds(currentUser.getId());
        if (approvedClassroomIds.isEmpty()) {
            return List.of();
        }

        Map<Long, List<String>> classroomNamesBySessionId = new LinkedHashMap<>();
        for (ClassroomExamAssignment assignment : classroomExamAssignmentRepository.findByClassroom_IdIn(approvedClassroomIds)) {
            classroomNamesBySessionId.computeIfAbsent(assignment.getExamSession().getId(), unused -> new ArrayList<>())
                .add(assignment.getClassroom().getName());
        }

        return classroomNamesBySessionId.entrySet().stream()
            .map(entry -> toSessionDto(findExamSession(entry.getKey()), entry.getValue()))
            .toList();
    }

    public ApiDtos.ExamSessionDto getExamSession(Long id) {
        ExamSession session = findExamSession(id);
        ensureSessionAccess(session);
        return toSessionDto(session);
    }

    public ApiDtos.ExamSessionDto saveExamSession(ApiDtos.ExamSessionPayload payload, Long id) {
        if (payload.closeTime().isBefore(payload.openTime()) || payload.closeTime().isEqual(payload.openTime())) {
            throw new BadRequestException("Close time must be after open time");
        }
        if (Duration.between(payload.openTime(), payload.closeTime()).toMinutes() <= payload.durationMinutes()) {
            throw new BadRequestException("End time minus start time must be greater than duration");
        }
        ExamSession session = id == null ? new ExamSession() : findExamSession(id);
        Exam exam = findExam(payload.examId());
        ensureOwnedByCurrentUser(exam.getCreatedBy(), "Exam");
        if (id != null) {
            ensureOwnedByCurrentUser(session.getCreatedBy(), "Exam session");
        }
        long questionCount = examQuestionRepository.countByExam_Id(exam.getId());
        if (questionCount < 1) {
            throw new BadRequestException("Draft must contain at least 1 question before creating a session");
        }
        if (questionCount != exam.getRequiredQuestionCount()) {
            throw new BadRequestException("Draft question count must exactly match the required question count before creating a session");
        }
        session.setExam(exam);
        session.setTitle(payload.title());
        session.setOpenTime(payload.openTime());
        session.setCloseTime(payload.closeTime());
        session.setDurationMinutes(payload.durationMinutes());
        session.setMaxAttempts(payload.maxAttempts());
        session.setShuffleQuestions(payload.shuffleQuestions());
        session.setStatus(payload.status());
        if (session.getCreatedBy() == null) {
            session.setCreatedBy(getCurrentUser());
        }
        return toSessionDto(examSessionRepository.save(session));
    }

    public void deleteExamSession(Long id) {
        ensureOwnedByCurrentUser(findExamSession(id).getCreatedBy(), "Exam session");
        classroomExamAssignmentRepository.deleteByExamSession_Id(id);
        examSessionRepository.delete(findExamSession(id));
    }

    public ApiDtos.ExamSessionDto updateExamSessionStatus(Long id, SessionStatus status) {
        ExamSession session = findExamSession(id);
        ensureOwnedByCurrentUser(session.getCreatedBy(), "Exam session");
        session.setStatus(status);
        return toSessionDto(examSessionRepository.save(session));
    }

    public ApiDtos.AttemptDto startAttempt(Long sessionId) {
        User student = getCurrentUser();
        ExamSession session = findExamSession(sessionId);
        ensureSessionAccess(session);
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BadRequestException("Session is not active");
        }
        if (LocalDateTime.now().isBefore(session.getOpenTime()) || LocalDateTime.now().isAfter(session.getCloseTime())) {
            throw new BadRequestException("Session is outside the allowed time window");
        }
        if (attemptRepository.countByStudent_IdAndExamSession_Id(student.getId(), sessionId) >= session.getMaxAttempts()) {
            throw new BadRequestException("Max attempts exceeded");
        }
        ensureSessionSnapshot(session);
        Attempt attempt = new Attempt();
        attempt.setExamSession(session);
        attempt.setStudent(student);
        attempt.setStatus(AttemptStatus.IN_PROGRESS);
        attempt.setTotalQuestions((int) examSessionQuestionRepository.countByExamSession_Id(sessionId));
        return toAttemptDto(attemptRepository.save(attempt), true);
    }

    public ApiDtos.AttemptDto submitAttempt(Long attemptId, ApiDtos.AttemptSubmitPayload payload) {
        Attempt attempt = findAttempt(attemptId);
        ensureAttemptAccess(attempt);
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Attempt cannot be submitted twice");
        }

        attemptAnswerRepository.deleteAll(attemptAnswerRepository.findByAttempt_Id(attemptId));
        Map<Long, ExamSessionQuestionOption> optionMap = new HashMap<>();
        List<ExamSessionQuestion> examQuestions = examSessionQuestionRepository.findByExamSession_IdOrderByDisplayOrderAsc(
            attempt.getExamSession().getId()
        );

        examQuestions.forEach(examQuestion -> examSessionQuestionOptionRepository.findByExamSessionQuestion_IdOrderByOptionLabelAsc(
            examQuestion.getId()
        ).forEach(option -> optionMap.put(option.getId(), option)));

        int correct = 0;
        int wrong = 0;
        int unanswered = 0;

        for (ExamSessionQuestion examQuestion : examQuestions) {
            ApiDtos.AttemptAnswerPayload answerPayload = payload.answers() == null ? null :
                payload.answers().stream()
                    .filter(item -> item.questionId().equals(examQuestion.getId()))
                    .findFirst()
                    .orElse(null);

            ExamSessionQuestionOption selectedOption = answerPayload == null || answerPayload.selectedOptionId() == null
                ? null
                : optionMap.get(answerPayload.selectedOptionId());

            boolean isCorrect = selectedOption != null && selectedOption.isCorrect();

            AttemptAnswer answer = new AttemptAnswer();
            answer.setAttempt(attempt);
            answer.setExamSessionQuestion(examQuestion);
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
        double score = examQuestions.isEmpty() ? 0 : Math.round((correct * 10_00.0 / examQuestions.size())) / 100.0;
        attempt.setScore(score);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setCompletionSeconds(Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).toSeconds());
        attempt.setStatus(payload.autoSubmitted() ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.SUBMITTED);
        return toAttemptDto(attemptRepository.save(attempt), false);
    }

    public ApiDtos.AttemptDto getAttempt(Long id) {
        Attempt attempt = findAttempt(id);
        ensureAttemptAccess(attempt);
        return toAttemptDto(attempt, attempt.getStatus() == AttemptStatus.IN_PROGRESS);
    }

    public List<ApiDtos.AttemptDto> getMyAttempts() {
        User user = getCurrentUser();
        return attemptRepository.findByStudent_IdOrderByStartedAtDesc(user.getId()).stream()
            .map(attempt -> toAttemptDto(attempt, false))
            .toList();
    }

    public List<ApiDtos.AttemptDto> getAttemptsBySession(Long sessionId) {
        ensureOwnedByCurrentUser(findExamSession(sessionId).getCreatedBy(), "Exam session");
        return attemptRepository.findByExamSession_Id(sessionId).stream()
            .map(attempt -> toAttemptDto(attempt, false))
            .toList();
    }

    public ApiDtos.DashboardOverviewDto getDashboardOverview() {
        User teacher = getCurrentUser();
        List<Classroom> classrooms = classroomRepository.findByCreatedBy_IdOrderByCreatedAtDesc(teacher.getId());
        long studentCount = classrooms.stream()
            .flatMap(classroom -> classroomMemberRepository.findByClassroom_IdOrderByStatusAscJoinedAtAsc(classroom.getId()).stream())
            .filter(member -> member.getStatus() == ClassroomMemberStatus.APPROVED)
            .map(member -> member.getUser().getId())
            .distinct()
            .count();
        List<ExamSession> sessions = examSessionRepository.findByCreatedBy_Id(teacher.getId());
        long attemptCount = sessions.stream()
            .mapToLong(session -> attemptRepository.findByExamSession_Id(session.getId()).size())
            .sum();
        return new ApiDtos.DashboardOverviewDto(
            studentCount,
            studentCount,
            1,
            questionRepository.findAll().stream().filter(question -> isOwnedBy(question.getCreatedBy(), teacher)).count(),
            examRepository.findByCreatedBy_Id(teacher.getId()).size(),
            sessions.size(),
            attemptCount
        );
    }

    public List<ApiDtos.DashboardExamStatsDto> getDashboardExamStats() {
        return examSessionRepository.findByCreatedBy_Id(getCurrentUser().getId()).stream().map(session -> {
            List<Attempt> attempts = attemptRepository.findByExamSession_Id(session.getId());
            double average = attempts.stream().mapToDouble(Attempt::getScore).average().orElse(0);
            double highest = attempts.stream().mapToDouble(Attempt::getScore).max().orElse(0);
            double lowest = attempts.stream().mapToDouble(Attempt::getScore).min().orElse(0);
            return new ApiDtos.DashboardExamStatsDto(session.getTitle(), average, highest, lowest, attempts.size());
        }).toList();
    }

    public ApiDtos.DashboardQuestionStatsDto getDashboardQuestionStats() {
        User teacher = getCurrentUser();
        return new ApiDtos.DashboardQuestionStatsDto(
            questionRepository.findAll().stream().filter(question -> isOwnedBy(question.getCreatedBy(), teacher)).count(),
            subjectRepository.findByCreatedBy_IdOrderByNameAsc(teacher.getId()).size()
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

    private void ensureAdminDoesNotDisableOwnAccount(User target, RoleName roleName, UserStatus status) {
        if (target.getId() == null) {
            return;
        }
        User currentUser = getCurrentUser();
        if (target.getId().equals(currentUser.getId())
            && (roleName != RoleName.ADMIN || status == UserStatus.LOCKED)) {
            throw new BadRequestException("You cannot remove your own admin access or lock your own account");
        }
    }

    private Classroom findClassroom(Long id) {
        return classroomRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Classroom not found"));
    }

    private ClassroomMember findClassroomMember(Long classroomId, Long userId) {
        return classroomMemberRepository.findByClassroom_IdAndUser_Id(classroomId, userId)
            .orElseThrow(() -> new NotFoundException("Classroom membership not found"));
    }

    private ClassroomMember findClassroomMemberById(Long id) {
        return classroomMemberRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Classroom member not found"));
    }

    private ClassroomExamAssignment findClassroomAssignment(Long id) {
        return classroomExamAssignmentRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Classroom assignment not found"));
    }

    private Subject findSubject(Long id) {
        return subjectRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Subject not found"));
    }

    private QuestionBank findQuestionBank(Long id) {
        return questionBankRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Question bank not found"));
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

    private void validateSubjectName(String name, Long id) {
        String normalized = normalizeRequiredText(name, "Subject name is required");
        boolean exists = id == null
            ? subjectRepository.existsByNameIgnoreCase(normalized)
            : subjectRepository.existsByNameIgnoreCaseAndIdNot(normalized, id);
        if (exists) {
            throw new BadRequestException("Subject name already exists");
        }
    }

    private void validateQuestionBankName(Long subjectId, String name, Long id) {
        String normalized = normalizeRequiredText(name, "Question bank name is required");
        boolean exists = id == null
            ? questionBankRepository.existsBySubject_IdAndNameIgnoreCase(subjectId, normalized)
            : questionBankRepository.existsBySubject_IdAndNameIgnoreCaseAndIdNot(subjectId, normalized, id);
        if (exists) {
            throw new BadRequestException("Question bank name already exists in this subject");
        }
    }

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }

    private String generateJoinCode() {
        String characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        String candidate = "";
        do {
            StringBuilder builder = new StringBuilder();
            for (int index = 0; index < 8; index++) {
                int charIndex = (int) (Math.random() * characters.length());
                builder.append(characters.charAt(charIndex));
            }
            candidate = builder.toString();
        } while (classroomRepository.existsByJoinCodeIgnoreCase(candidate));
        return candidate;
    }

    private void ensureClassroomManagementAccess(Classroom classroom) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole().getName() != RoleName.TEACHER || !classroom.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new NotFoundException("Classroom not found");
        }
    }

    private void ensureClassroomReadAccess(Classroom classroom) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole().getName() == RoleName.STUDENT) {
            ClassroomMember member = findClassroomMember(classroom.getId(), currentUser.getId());
            if (member.getStatus() != ClassroomMemberStatus.APPROVED) {
                throw new NotFoundException("Classroom not found");
            }
            return;
        }
        ensureClassroomManagementAccess(classroom);
    }

    private void ensureSessionAccess(ExamSession session) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole().getName() == RoleName.TEACHER) {
            ensureOwnedByCurrentUser(session.getCreatedBy(), "Exam session");
            return;
        }
        if (currentUser.getRole().getName() != RoleName.STUDENT) {
            throw new NotFoundException("Exam session not found");
        }

        List<Long> approvedClassroomIds = getApprovedClassroomIds(currentUser.getId());
        if (approvedClassroomIds.isEmpty()
            || !classroomExamAssignmentRepository.existsByExamSession_IdAndClassroom_IdIn(session.getId(), approvedClassroomIds)) {
            throw new NotFoundException("Exam session not found");
        }
    }

    private List<Long> getApprovedClassroomIds(Long userId) {
        return classroomMemberRepository.findByUser_IdAndStatusOrderByJoinedAtDesc(userId, ClassroomMemberStatus.APPROVED).stream()
            .map(member -> member.getClassroom().getId())
            .distinct()
            .toList();
    }

    private ApiDtos.UserDto toUserDto(User user) {
        return new ApiDtos.UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole().getName(), user.getStatus());
    }

    private ApiDtos.ClassroomDto toClassroomDto(Classroom classroom, ClassroomMemberStatus membershipStatus) {
        return new ApiDtos.ClassroomDto(
            classroom.getId(),
            classroom.getName(),
            classroom.getJoinCode(),
            classroomMemberRepository.countByClassroom_IdAndStatus(classroom.getId(), ClassroomMemberStatus.APPROVED),
            classroomMemberRepository.countByClassroom_IdAndStatus(classroom.getId(), ClassroomMemberStatus.PENDING),
            membershipStatus,
            classroom.getCreatedAt()
        );
    }

    private ApiDtos.ClassroomMemberDto toClassroomMemberDto(ClassroomMember member) {
        return new ApiDtos.ClassroomMemberDto(
            member.getId(),
            member.getUser().getId(),
            member.getUser().getFullName(),
            member.getUser().getEmail(),
            member.getStatus(),
            member.getJoinedAt()
        );
    }

    private ApiDtos.ClassroomExamAssignmentDto toClassroomAssignmentDto(ClassroomExamAssignment assignment) {
        return new ApiDtos.ClassroomExamAssignmentDto(
            assignment.getId(),
            assignment.getExamSession().getId(),
            assignment.getExamSession().getTitle(),
            assignment.getExamSession().getExam().getTitle(),
            assignment.getExamSession().getStatus(),
            assignment.getExamSession().getOpenTime(),
            assignment.getExamSession().getCloseTime()
        );
    }

    private ApiDtos.QuestionBankDto toQuestionBankDto(QuestionBank questionBank) {
        return new ApiDtos.QuestionBankDto(
            questionBank.getId(),
            questionBank.getName(),
            questionBank.getDescription(),
            questionBank.getSubject().getId(),
            questionBank.getSubject().getName(),
            questionRepository.countByQuestionBank_Id(questionBank.getId())
        );
    }

    private ApiDtos.QuestionSummaryDto toQuestionSummaryDto(Question question) {
        QuestionOption correctOption = questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(question.getId()).stream()
            .filter(QuestionOption::isCorrect)
            .findFirst()
            .orElse(null);

        return new ApiDtos.QuestionSummaryDto(
            question.getId(),
            question.getContent(),
            question.getQuestionBank().getId(),
            question.getQuestionBank().getName(),
            question.getQuestionBank().getSubject().getId(),
            question.getQuestionBank().getSubject().getName(),
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
            question.getQuestionBank().getId(),
            question.getQuestionBank().getName(),
            question.getQuestionBank().getSubject().getId(),
            question.getQuestionBank().getSubject().getName(),
            options
        );
    }

    private ApiDtos.ExamDto toExamDto(Exam exam) {
        List<ApiDtos.ExamQuestionDto> questions = examQuestionRepository.findByExam_IdOrderByDisplayOrderAscIdAsc(exam.getId()).stream()
            .map(item -> new ApiDtos.ExamQuestionDto(
                item.getId(),
                item.getQuestion().getId(),
                item.getQuestion().getContent(),
                item.getDisplayOrder()
            ))
            .toList();

        return new ApiDtos.ExamDto(
            exam.getId(),
            exam.getTitle(),
            exam.getDescription(),
            exam.getSubject().getId(),
            exam.getSubject().getName(),
            exam.getRequiredQuestionCount(),
            exam.isShowAnswersAfterSubmit(),
            exam.isPublished(),
            questions.size(),
            questions
        );
    }

    private void normalizeExamQuestionOrder(Long examId) {
        List<ExamQuestion> questions = examQuestionRepository.findByExam_IdOrderByDisplayOrderAscIdAsc(examId);
        for (int index = 0; index < questions.size(); index++) {
            questions.get(index).setDisplayOrder(index + 1);
        }
        examQuestionRepository.saveAll(questions);
    }

    private void ensureDraftHasCapacity(Exam exam, long incomingQuestionCount) {
        long currentCount = exam.getId() == null ? 0 : examQuestionRepository.countByExam_Id(exam.getId());
        if (currentCount + incomingQuestionCount > exam.getRequiredQuestionCount()) {
            throw new BadRequestException("Draft cannot contain more questions than the required question count");
        }
    }

    private void deleteExamDependencies(Long examId) {
        List<ExamSession> sessions = examSessionRepository.findByExam_Id(examId);

        for (ExamSession session : sessions) {
            classroomExamAssignmentRepository.deleteByExamSession_Id(session.getId());
            List<Attempt> attempts = attemptRepository.findByExamSession_Id(session.getId());
            if (!attempts.isEmpty()) {
                List<Long> attemptIds = attempts.stream().map(Attempt::getId).toList();
                attemptAnswerRepository.deleteAll(attemptAnswerRepository.findByAttempt_IdIn(attemptIds));
                attemptRepository.deleteAll(attempts);
            }

            List<ExamSessionQuestion> snapshotQuestions = examSessionQuestionRepository
                .findByExamSession_IdOrderByDisplayOrderAsc(session.getId());
            if (!snapshotQuestions.isEmpty()) {
                List<Long> snapshotQuestionIds = snapshotQuestions.stream().map(ExamSessionQuestion::getId).toList();
                examSessionQuestionOptionRepository.deleteAll(
                    examSessionQuestionOptionRepository.findByExamSessionQuestion_IdIn(snapshotQuestionIds)
                );
                examSessionQuestionRepository.deleteAll(snapshotQuestions);
            }
        }

        if (!sessions.isEmpty()) {
            examSessionRepository.deleteAll(sessions);
            examSessionRepository.flush();
        }

        List<ExamQuestion> examQuestions = examQuestionRepository.findByExam_IdOrderByDisplayOrderAscIdAsc(examId);
        if (!examQuestions.isEmpty()) {
            examQuestionRepository.deleteAll(examQuestions);
            examQuestionRepository.flush();
        }
    }

    private void deleteQuestionBanksBySubjectId(Long subjectId) {
        List<QuestionBank> questionBanks = questionBankRepository.findBySubject_Id(subjectId);
        for (QuestionBank questionBank : questionBanks) {
            deleteQuestionsByBankId(questionBank.getId());
        }
        if (!questionBanks.isEmpty()) {
            questionBankRepository.deleteBySubject_Id(subjectId);
            questionBankRepository.flush();
        }
    }

    private void deleteQuestionsByBankId(Long questionBankId) {
        List<Question> questions = questionRepository.findByQuestionBank_Id(questionBankId);
        if (questions.isEmpty()) {
            return;
        }

        List<Long> questionIds = questions.stream().map(Question::getId).toList();
        List<ExamQuestion> examQuestions = examQuestionRepository.findByQuestion_IdIn(questionIds);
        if (!examQuestions.isEmpty()) {
            examQuestionRepository.deleteByQuestion_IdIn(questionIds);
            examQuestionRepository.flush();
        }

        List<QuestionOption> questionOptions = questionOptionRepository.findByQuestion_IdIn(questionIds);
        if (!questionOptions.isEmpty()) {
            questionOptionRepository.deleteByQuestion_IdIn(questionIds);
            questionOptionRepository.flush();
        }

        questionRepository.deleteByQuestionBank_Id(questionBankId);
        questionRepository.flush();
    }

    private ApiDtos.ExamSessionDto toSessionDto(ExamSession session) {
        List<String> classroomNames = classroomExamAssignmentRepository.findByExamSession_Id(session.getId()).stream()
            .map(assignment -> assignment.getClassroom().getName())
            .distinct()
            .toList();
        return toSessionDto(session, classroomNames);
    }

    private ApiDtos.ExamSessionDto toSessionDto(ExamSession session, List<String> classroomNames) {
        long questionCount = examSessionQuestionRepository.existsByExamSession_Id(session.getId())
            ? examSessionQuestionRepository.countByExamSession_Id(session.getId())
            : examQuestionRepository.countByExam_Id(session.getExam().getId());
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
            (int) questionCount,
            session.isShuffleQuestions(),
            session.getExam().isShowAnswersAfterSubmit(),
            classroomNames
        );
    }

    private ApiDtos.AttemptDto toAttemptDto(Attempt attempt, boolean includeQuestions) {
        ensureSessionSnapshot(attempt.getExamSession());
        List<ExamSessionQuestion> examQuestions = examSessionQuestionRepository.findByExamSession_IdOrderByDisplayOrderAsc(
            attempt.getExamSession().getId()
        );

        List<ApiDtos.AttemptQuestionDto> questions = includeQuestions
            ? examQuestions.stream().map(item -> new ApiDtos.AttemptQuestionDto(
                item.getId(),
                item.getContent(),
                item.getDisplayOrder(),
                examSessionQuestionOptionRepository.findByExamSessionQuestion_IdOrderByOptionLabelAsc(item.getId()).stream()
                    .map(option -> new ApiDtos.OptionDto(option.getId(), option.getOptionLabel(), option.getOptionContent(), false))
                    .toList()
            )).toList()
            : List.of();

        boolean showAnswersAfterSubmit = attempt.getExamSession().getExam().isShowAnswersAfterSubmit();
        List<ApiDtos.AttemptReviewDto> review = new ArrayList<>();
        if (!includeQuestions && showAnswersAfterSubmit) {
            review = attemptAnswerRepository.findByAttempt_Id(attempt.getId()).stream()
                .map(answer -> {
                    List<ExamSessionQuestionOption> options = examSessionQuestionOptionRepository
                        .findByExamSessionQuestion_IdOrderByOptionLabelAsc(answer.getExamSessionQuestion().getId());
                    String correctLabel = options.stream().filter(ExamSessionQuestionOption::isCorrect).findFirst()
                        .map(ExamSessionQuestionOption::getOptionLabel).orElse(null);
                    String selectedLabel = answer.getSelectedOption() == null ? null : answer.getSelectedOption().getOptionLabel();
                    return new ApiDtos.AttemptReviewDto(
                        answer.getExamSessionQuestion().getId(),
                        answer.getExamSessionQuestion().getContent(),
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
            review,
            showAnswersAfterSubmit
        );
    }

    private void ensureAttemptAccess(Attempt attempt) {
        User currentUser = getCurrentUser();
        RoleName roleName = currentUser.getRole().getName();
        if (roleName == RoleName.STUDENT && !attempt.getStudent().getId().equals(currentUser.getId())) {
            throw new NotFoundException("Attempt not found");
        }
        if (roleName == RoleName.TEACHER) {
            ensureOwnedByCurrentUser(attempt.getExamSession().getCreatedBy(), "Attempt");
        }
        if (roleName == RoleName.ADMIN) {
            throw new NotFoundException("Attempt not found");
        }
    }

    private void ensureExamEditable(Exam exam) {
        if (exam.getId() == null) {
            return;
        }
        ensureOwnedByCurrentUser(exam.getCreatedBy(), "Exam");
        if (examSessionRepository.existsByExam_IdAndOpenTimeLessThanEqual(exam.getId(), LocalDateTime.now())) {
            throw new BadRequestException("Exam is locked because at least one session has reached its start time");
        }
    }

    private void ensureOwnedByCurrentUser(User owner, String resourceName) {
        User currentUser = getCurrentUser();
        if (owner == null || !owner.getId().equals(currentUser.getId())) {
            throw new NotFoundException(resourceName + " not found");
        }
    }

    private boolean isOwnedBy(User owner, User user) {
        return owner != null && owner.getId().equals(user.getId());
    }

    private void ensureSessionSnapshot(ExamSession session) {
        if (examSessionQuestionRepository.existsByExamSession_Id(session.getId())) {
            return;
        }

        List<ExamQuestion> sourceQuestions = examQuestionRepository.findByExam_IdOrderByDisplayOrderAscIdAsc(session.getExam().getId());
        if (sourceQuestions.isEmpty()) {
            throw new BadRequestException("Session exam has no questions to snapshot");
        }

        List<ExamQuestion> orderedQuestions = new ArrayList<>(sourceQuestions);
        if (session.isShuffleQuestions()) {
            Collections.shuffle(orderedQuestions);
        }

        for (int index = 0; index < orderedQuestions.size(); index++) {
            ExamQuestion sourceQuestion = orderedQuestions.get(index);
            ExamSessionQuestion snapshotQuestion = new ExamSessionQuestion();
            snapshotQuestion.setExamSession(session);
            snapshotQuestion.setSourceQuestionId(sourceQuestion.getQuestion().getId());
            snapshotQuestion.setContent(sourceQuestion.getQuestion().getContent());
            snapshotQuestion.setDisplayOrder(index + 1);
            ExamSessionQuestion savedQuestion = examSessionQuestionRepository.save(snapshotQuestion);

            List<QuestionOption> sourceOptions = questionOptionRepository.findByQuestion_IdOrderByOptionLabelAsc(
                sourceQuestion.getQuestion().getId()
            );
            for (QuestionOption sourceOption : sourceOptions) {
                ExamSessionQuestionOption snapshotOption = new ExamSessionQuestionOption();
                snapshotOption.setExamSessionQuestion(savedQuestion);
                snapshotOption.setOptionLabel(sourceOption.getOptionLabel());
                snapshotOption.setOptionContent(sourceOption.getOptionContent());
                snapshotOption.setCorrect(sourceOption.isCorrect());
                examSessionQuestionOptionRepository.save(snapshotOption);
            }
        }
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

    private void saveImportedQuestion(QuestionBank questionBank, ImportedQuestionData questionData) {
        ApiDtos.QuestionPayload payload = new ApiDtos.QuestionPayload(questionData.content(), questionBank.getId(), questionData.options());
        validateQuestionPayload(payload);

        Question question = new Question();
        question.setContent(questionData.content());
        question.setQuestionBank(questionBank);
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
            .map(line -> line.replace("\r", ""))
            .map(String::strip)
            .filter(line -> !line.isBlank())
            .toList();

        Map<String, String> values = new LinkedHashMap<>();
        Set<String> allowedKeys = Set.of("Q", "A", "B", "C", "D", "ANSWER");
        String currentKey = null;

        for (String line : lines) {
            int separatorIndex = line.indexOf(':');
            if (separatorIndex < 1) {
                if (currentKey == null || "ANSWER".equals(currentKey)) {
                    throw new BadRequestException("Each line must use the format KEY: value");
                }

                values.put(currentKey, values.get(currentKey) + "\n" + line.trim());
                continue;
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
            currentKey = key;
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
