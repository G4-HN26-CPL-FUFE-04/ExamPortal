import java.sql.*;
public class CheckDb {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:sqlserver://localhost:1433;databaseName=ExamPortal;encrypt=true;trustServerCertificate=true";
    try (Connection c = DriverManager.getConnection(url, "sa", "123")) {
      DatabaseMetaData md = c.getMetaData();
      try (ResultSet rs = md.getColumns(null, null, "attempt_answers", null)) {
        while (rs.next()) {
          System.out.println(rs.getString("COLUMN_NAME") + " " + rs.getString("TYPE_NAME"));
        }
      }
    }
  }
}
