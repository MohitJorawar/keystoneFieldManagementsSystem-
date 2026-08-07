package com.mohit.keystone.controller;

import com.mohit.keystone.dto.DashboardSummaryDto;
import com.mohit.keystone.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {
        DashboardSummaryDto summary = reportService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }
}
