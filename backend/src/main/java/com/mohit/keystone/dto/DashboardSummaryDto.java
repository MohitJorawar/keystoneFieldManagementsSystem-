package com.mohit.keystone.dto;

import java.util.Map;

public record DashboardSummaryDto(
    Map<String, Long> statusCounts,
    long overdueCount,
    double slaComplianceRate,
    Map<String, Long> technicianBreakdown,
    Map<String, Long> siteBreakdown
) {}
