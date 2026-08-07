package com.mohit.keystone;

import com.mohit.keystone.repository.UserRepository;
import com.mohit.keystone.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class KeystoneApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportService reportService;

    @Test
    void contextLoads() {
        System.out.println("DIAGNOSTIC - All users count: " + userRepository.count());
        userRepository.findAll().forEach(u -> {
            System.out.println("DIAGNOSTIC - User: " + u.getName() + " Role: " + u.getRole());
        });
        System.out.println("DIAGNOSTIC - Summary call start");
        try {
            reportService.getDashboardSummary();
            System.out.println("DIAGNOSTIC - Summary call success");
        } catch (Exception e) {
            System.out.println("DIAGNOSTIC - Summary call failed!");
            e.printStackTrace();
            throw e;
        }
    }
}
