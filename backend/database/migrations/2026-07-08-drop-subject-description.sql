IF COL_LENGTH('subjects', 'description') IS NOT NULL
BEGIN
    ALTER TABLE subjects DROP COLUMN description;
END
GO
