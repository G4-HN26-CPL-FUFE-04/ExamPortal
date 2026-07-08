IF OBJECT_ID(N'question_banks', N'U') IS NULL
BEGIN
    CREATE TABLE question_banks (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        subject_id BIGINT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(1000) NULL,
        created_by BIGINT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_question_banks_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
        CONSTRAINT fk_question_banks_created_by FOREIGN KEY (created_by) REFERENCES users(id)
    );
END
GO

IF COL_LENGTH('questions', 'question_bank_id') IS NULL
BEGIN
    ALTER TABLE questions ADD question_bank_id BIGINT NULL;
END
GO

INSERT INTO question_banks (subject_id, name, description, created_by, created_at)
SELECT
    subjects.id,
    N'Default Bank',
    N'Migrated default bank for existing subject questions',
    subjects.created_by,
    COALESCE(subjects.created_at, SYSUTCDATETIME())
FROM subjects
WHERE NOT EXISTS (
    SELECT 1
    FROM question_banks
    WHERE question_banks.subject_id = subjects.id
);
GO

UPDATE questions
SET question_bank_id = banks.id
FROM questions
INNER JOIN (
    SELECT
        question_banks.subject_id,
        MIN(question_banks.id) AS id
    FROM question_banks
    GROUP BY question_banks.subject_id
) AS banks ON banks.subject_id = questions.subject_id
WHERE questions.question_bank_id IS NULL;
GO

IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'questions'
      AND COLUMN_NAME = 'question_bank_id'
      AND IS_NULLABLE = 'YES'
)
BEGIN
    ALTER TABLE questions ALTER COLUMN question_bank_id BIGINT NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'fk_questions_question_bank'
)
BEGIN
    ALTER TABLE questions
    ADD CONSTRAINT fk_questions_question_bank FOREIGN KEY (question_bank_id) REFERENCES question_banks(id);
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'fk_questions_subject'
)
BEGIN
    ALTER TABLE questions DROP CONSTRAINT fk_questions_subject;
END
GO

IF COL_LENGTH('questions', 'subject_id') IS NOT NULL
BEGIN
    ALTER TABLE questions DROP COLUMN subject_id;
END
GO
