import java.sql.*;

public class TestDB {
    public static void main(String[] args) throws Exception {
        Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/restaurant_erp?allowPublicKeyRetrieval=true&useSSL=false", "root", "2007@25thangam");
        
        System.out.println("--- USERS ---");
        ResultSet rs1 = con.createStatement().executeQuery("SELECT username, email, account_non_locked, failed_attempt FROM users");
        while(rs1.next()) {
            System.out.println(rs1.getString("username") + " | " + rs1.getString("email") + " | Locked=" + !rs1.getBoolean("account_non_locked") + " | Fails=" + rs1.getInt("failed_attempt"));
        }
        
        System.out.println("\n--- LOGIN HISTORIES ---");
        ResultSet rs2 = con.createStatement().executeQuery("SELECT username, status, failure_reason FROM login_histories ORDER BY id DESC LIMIT 5");
        while(rs2.next()) {
            System.out.println(rs2.getString("username") + " | " + rs2.getString("status") + " | " + rs2.getString("failure_reason"));
        }
    }
}
