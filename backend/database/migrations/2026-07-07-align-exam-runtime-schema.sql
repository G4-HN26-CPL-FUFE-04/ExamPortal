IF COL_LENGTH('exams', 'required_question_count') IS NULL
BEGIN
    ALTER TABLE exams ADD required_question_count INT NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'exams'
      AND COLUMN_NAME = 'required_question_count'
)
BEGIN
    UPDATE exams
    SET required_question_count = CASE
        WHEN counts.question_count > 0 THEN counts.question_count
        ELSE 1
    END
    FROM exams
    CROSS APPLY (
        SELECT COUNT(*) AS question_count
        FROM exam_questions
        WHERE exam_questions.exam_id = exams.id
    ) AS counts
    WHERE required_question_count IS NULL;

    ALTER TABLE exams ALTER COLUMN required_question_count INT NOT NULL;
END
GO

IF COL_LENGTH('exams', 'published') IS NULL
BEGIN
    ALTER TABLE exams ADD published BIT NOT NULL CONSTRAINT df_exams_published DEFAULT 0;
END
GO

IF COL_LENGTH('exam_sessions', 'shuffle_questions') IS NULL
BEGIN
    ALTER TABLE exam_sessions ADD shuffle_questions BIT NOT NULL CONSTRAINT df_exam_sessions_shuffle_questions DEFAULT 0;
END
GO

IF COL_LENGTH('exams', 'duration_minutes') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
        INNER JOIN sys.tables t ON t.object_id = c.object_id
        WHERE t.name = 'exams' AND c.name = 'duration_minutes'
    )
BEGIN
    ALTER TABLE exams ADD CONSTRAINT df_exams_duration_minutes DEFAULT 60 FOR duration_minutes;
END
GO

IF COL_LENGTH('exams', 'total_score') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
        INNER JOIN sys.tables t ON t.object_id = c.object_id
        WHERE t.name = 'exams' AND c.name = 'total_score'
    )
BEGIN
    ALTER TABLE exams ADD CONSTRAINT df_exams_total_score DEFAULT 10 FOR total_score;
END
GO

IF COL_LENGTH('exams', 'status') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
        INNER JOIN sys.tables t ON t.object_id = c.object_id
        WHERE t.name = 'exams' AND c.name = 'status'
    )
BEGIN
    ALTER TABLE exams ADD CONSTRAINT df_exams_status DEFAULT 'DRAFT' FOR status;
END
GO

IF OBJECT_ID(N'exam_session_questions', N'U') IS NULL
BEGIN
    CREATE TABLE exam_session_questions (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        exam_session_id BIGINT NOT NULL,
        source_question_id BIGINT NULL,
        content NVARCHAR(MAX) NOT NULL,
        display_order INT NOT NULL,
        CONSTRAINT fk_exam_session_questions_session FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id)
    );
END
GO

IF OBJECT_ID(N'exam_session_question_options', N'U') IS NULL
BEGIN
    CREATE TABLE exam_session_question_options (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        exam_session_question_id BIGINT NOT NULL,
        option_label NVARCHAR(1) NOT NULL,
        option_content NVARCHAR(MAX) NOT NULL,
        is_correct BIT NOT NULL,
        CONSTRAINT fk_exam_session_question_options_question FOREIGN KEY (exam_session_question_id) REFERENCES exam_session_questions(id)
    );
END
GO

IF COL_LENGTH('attempt_answers', 'exam_session_question_id') IS NULL
BEGIN
    ALTER TABLE attempt_answers ADD exam_session_question_id BIGINT NULL;
END
GO

IF COL_LENGTH('attempt_answers', 'selected_session_option_id') IS NULL
BEGIN
    ALTER TABLE attempt_answers ADD selected_session_option_id BIGINT NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'attempt_answers'
      AND COLUMN_NAME = 'question_id'
      AND IS_NULLABLE = 'NO'
)
BEGIN
    ALTER TABLE attempt_answers ALTER COLUMN question_id BIGINT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'fk_attempt_answers_session_question'
)
BEGIN
    ALTER TABLE attempt_answers
    ADD CONSTRAINT fk_attempt_answers_session_question
    FOREIGN KEY (exam_session_question_id) REFERENCES exam_session_questions(id);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'fk_attempt_answers_selected_option'
)
BEGIN
    ALTER TABLE attempt_answers
    ADD CONSTRAINT fk_attempt_answers_selected_option
    FOREIGN KEY (selected_session_option_id) REFERENCES exam_session_question_options(id);
END
GO

;WITH ordered_exam_questions AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY exam_id ORDER BY display_order, id) AS next_display_order
    FROM exam_questions
)
UPDATE exam_questions
SET display_order = ordered_exam_questions.next_display_order
FROM exam_questions
INNER JOIN ordered_exam_questions ON ordered_exam_questions.id = exam_questions.id;
GO
