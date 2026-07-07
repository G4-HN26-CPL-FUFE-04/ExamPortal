IF DB_ID(N'ExamPortal') IS NULL
BEGIN
    CREATE DATABASE ExamPortal;
END;
GO

USE ExamPortal;
GO

IF OBJECT_ID(N'attempt_answers', N'U') IS NOT NULL DROP TABLE attempt_answers;
IF OBJECT_ID(N'attempts', N'U') IS NOT NULL DROP TABLE attempts;
IF OBJECT_ID(N'exam_sessions', N'U') IS NOT NULL DROP TABLE exam_sessions;
IF OBJECT_ID(N'exam_questions', N'U') IS NOT NULL DROP TABLE exam_questions;
IF OBJECT_ID(N'question_options', N'U') IS NOT NULL DROP TABLE question_options;
IF OBJECT_ID(N'questions', N'U') IS NOT NULL DROP TABLE questions;
IF OBJECT_ID(N'exams', N'U') IS NOT NULL DROP TABLE exams;
IF OBJECT_ID(N'subjects', N'U') IS NOT NULL DROP TABLE subjects;
IF OBJECT_ID(N'users', N'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID(N'roles', N'U') IS NOT NULL DROP TABLE roles;
GO

CREATE TABLE roles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    status NVARCHAR(50) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE subjects (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000) NULL,
    created_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_subjects_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE questions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_questions_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
    CONSTRAINT fk_questions_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE question_options (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    question_id BIGINT NOT NULL,
    option_label NVARCHAR(1) NOT NULL,
    option_content NVARCHAR(MAX) NOT NULL,
    is_correct BIT NOT NULL,
    CONSTRAINT fk_question_options_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE exams (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000) NULL,
    subject_id BIGINT NOT NULL,
    duration_minutes INT NOT NULL,
    total_score FLOAT NOT NULL,
    status NVARCHAR(50) NOT NULL,
    show_answers_after_submit BIT NOT NULL,
    created_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_exams_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
    CONSTRAINT fk_exams_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE exam_questions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    display_order INT NOT NULL,
    CONSTRAINT fk_exam_questions_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
    CONSTRAINT fk_exam_questions_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE exam_sessions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    open_time DATETIME2 NOT NULL,
    close_time DATETIME2 NOT NULL,
    duration_minutes INT NOT NULL,
    max_attempts INT NOT NULL,
    status NVARCHAR(50) NOT NULL,
    created_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_exam_sessions_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
    CONSTRAINT fk_exam_sessions_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE attempts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    exam_session_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    submitted_at DATETIME2 NULL,
    completion_seconds BIGINT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    wrong_answers INT NOT NULL DEFAULT 0,
    unanswered_answers INT NOT NULL DEFAULT 0,
    score FLOAT NOT NULL DEFAULT 0,
    status NVARCHAR(50) NOT NULL,
    CONSTRAINT fk_attempts_exam_session FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id),
    CONSTRAINT fk_attempts_student FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE attempt_answers (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    attempt_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    selected_option_id BIGINT NULL,
    is_correct BIT NOT NULL,
    CONSTRAINT fk_attempt_answers_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id),
    CONSTRAINT fk_attempt_answers_question FOREIGN KEY (question_id) REFERENCES questions(id),
    CONSTRAINT fk_attempt_answers_selected_option FOREIGN KEY (selected_option_id) REFERENCES question_options(id)
);
GO
