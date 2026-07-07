import java.sql.*;
public class InspectDb {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:sqlserver://localhost:1433;databaseName=ExamPortal;encrypt=true;trustServerCertificate=true";
    try (Connection c = DriverManager.getConnection(url, "sa", "123"); Statement s = c.createStatement()) {
      String[] tables = {"exam_session_questions", "exam_session_question_options", "attempt_answers", "attempts", "exam_sessions", "exam_questions"};
      for (String table : tables) {
        System.out.println("TABLE=" + table);
        try (ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM " + table)) {
          if (rs.next()) System.out.println("COUNT=" + rs.getInt(1));
        }
        DatabaseMetaData md = c.getMetaData();
        try (ResultSet cols = md.getColumns(null, null, table, null)) {
          while (cols.next()) {
            System.out.println("  " + cols.getString("COLUMN_NAME") + " " + cols.getString("TYPE_NAME"));
          }
        }
      }
    }
  }
}
