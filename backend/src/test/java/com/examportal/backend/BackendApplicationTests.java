package com.examportal.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.examportal.backend.dto.ApiDtos;
import com.examportal.backend.entity.Question;
import com.examportal.backend.entity.QuestionBank;
import com.examportal.backend.entity.Role;
import com.examportal.backend.entity.Subject;
import com.examportal.backend.entity.User;
import com.examportal.backend.entity.enums.RoleName;
import com.examportal.backend.entity.enums.UserStatus;
import com.examportal.backend.repository.QuestionBankRepository;
import com.examportal.backend.repository.QuestionRepository;
import com.examportal.backend.repository.RoleRepository;
import com.examportal.backend.repository.SubjectRepository;
import com.examportal.backend.repository.UserRepository;
import com.examportal.backend.service.PortalService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class BackendApplicationTests {
	@Autowired
	private PortalService portalService;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private SubjectRepository subjectRepository;

	@Autowired
	private QuestionBankRepository questionBankRepository;

	@Autowired
	private QuestionRepository questionRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void removeQuestionFromDraftRemovesSelectedExamQuestion() {
		Role instructorRole = roleRepository.findByName(RoleName.INSTRUCTOR).orElseGet(() -> roleRepository.save(new Role(RoleName.INSTRUCTOR)));

		User instructor = new User();
		instructor.setFullName("Instructor");
		instructor.setEmail("instructor@test.local");
		instructor.setPasswordHash("hashed");
		instructor.setRole(instructorRole);
		instructor.setStatus(UserStatus.ACTIVE);
		userRepository.save(instructor);

		SecurityContextHolder.getContext().setAuthentication(
			new UsernamePasswordAuthenticationToken(instructor.getEmail(), null)
		);

		Subject subject = new Subject();
		subject.setName("Subject 1");
		subject.setCreatedBy(instructor);
		subjectRepository.save(subject);

		QuestionBank bank = new QuestionBank();
		bank.setName("Bank 1");
		bank.setSubject(subject);
		bank.setCreatedBy(instructor);
		questionBankRepository.save(bank);

		Question question = new Question();
		question.setContent("Question 1");
		question.setQuestionBank(bank);
		question.setCreatedBy(instructor);
		questionRepository.save(question);

		ApiDtos.ExamDto exam = portalService.saveDraft(
			new ApiDtos.ExamPayload("Draft 1", null, subject.getId(), 5, false),
			null
		);

		ApiDtos.ExamDto draftWithQuestion = portalService.addQuestionToExam(
			exam.id(),
			new ApiDtos.ExamQuestionPayload(question.getId(), 1)
		);

		Long examQuestionId = draftWithQuestion.questions().get(0).id();
		assertEquals(1, draftWithQuestion.questions().size());

		portalService.removeQuestionFromExam(exam.id(), examQuestionId);

		ApiDtos.ExamDto refreshedDraft = portalService.getDraft(exam.id());
		assertEquals(0, refreshedDraft.questions().size());
		assertFalse(refreshedDraft.questions().stream().anyMatch(item -> item.id().equals(examQuestionId)));
	}

}
