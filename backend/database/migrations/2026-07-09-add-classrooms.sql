IF OBJECT_ID(N'classrooms', N'U') IS NULL
BEGIN
    CREATE TABLE classrooms (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        join_code NVARCHAR(32) NOT NULL UNIQUE,
        created_by BIGINT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_classrooms_created_by FOREIGN KEY (created_by) REFERENCES users(id)
    );
END;
GO

IF OBJECT_ID(N'classroom_members', N'U') IS NULL
BEGIN
    CREATE TABLE classroom_members (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        classroom_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        status NVARCHAR(50) NOT NULL,
        joined_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT uq_classroom_members_classroom_user UNIQUE (classroom_id, user_id),
        CONSTRAINT fk_classroom_members_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
        CONSTRAINT fk_classroom_members_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
END;
GO

IF OBJECT_ID(N'classroom_exam_assignments', N'U') IS NULL
BEGIN
    CREATE TABLE classroom_exam_assignments (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        classroom_id BIGINT NOT NULL,
        exam_session_id BIGINT NOT NULL,
        assigned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT uq_classroom_exam_assignments_classroom_session UNIQUE (classroom_id, exam_session_id),
        CONSTRAINT fk_classroom_exam_assignments_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
        CONSTRAINT fk_classroom_exam_assignments_session FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id)
    );
END;
GO
