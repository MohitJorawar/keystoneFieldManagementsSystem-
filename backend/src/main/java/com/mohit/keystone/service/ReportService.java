package com.mohit.keystone.service;

import com.mohit.keystone.domain.*;
import com.mohit.keystone.dto.DashboardSummaryDto;
import com.mohit.keystone.repository.WorkOrderRepository;
import com.mohit.keystone.repository.WorkOrderStatusHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;

    public ReportService(WorkOrderRepository workOrderRepository, WorkOrderStatusHistoryRepository historyRepository) {
        this.workOrderRepository = workOrderRepository;
        this.historyRepository = historyRepository;
    }

    public DashboardSummaryDto getDashboardSummary() {
        List<WorkOrder> allOrders = workOrderRepository.findAll();

        Map<String, Long> statusCounts = new HashMap<>();
        for (WorkOrderStatus status : WorkOrderStatus.values()) {
            statusCounts.put(status.name(), 0L);
        }

        long overdueCount = 0;
        long totalCompletedOrClosed = 0;
        long compliantCompletedOrClosed = 0;

        Map<String, Long> techBreakdown = new HashMap<>();
        Map<String, Long> siteBreakdown = new HashMap<>();

        LocalDateTime now = LocalDateTime.now();

        for (WorkOrder wo : allOrders) {
            statusCounts.put(wo.getStatus().name(), statusCounts.getOrDefault(wo.getStatus().name(), 0L) + 1);

            boolean isBreached = false;
            if (wo.getStatus() == WorkOrderStatus.COMPLETED || wo.getStatus() == WorkOrderStatus.CLOSED) {
                totalCompletedOrClosed++;
                Optional<WorkOrderStatusHistory> completionOpt = historyRepository.findByWorkOrderIdOrderByChangedAtAsc(wo.getId())
                        .stream()
                        .filter(h -> h.getToStatus() == WorkOrderStatus.COMPLETED)
                        .findFirst();
                if (completionOpt.isPresent()) {
                    if (completionOpt.get().getChangedAt().isAfter(wo.getSlaDueAt())) {
                        isBreached = true;
                    }
                } else {
                    isBreached = now.isAfter(wo.getSlaDueAt());
                }
                if (!isBreached) {
                    compliantCompletedOrClosed++;
                }
            } else if (wo.getStatus() != WorkOrderStatus.CANCELLED) {
                isBreached = now.isAfter(wo.getSlaDueAt());
                if (isBreached) {
                    overdueCount++;
                }
            }

            if (wo.getAssignedTo() != null) {
                String techName = wo.getAssignedTo().getName();
                techBreakdown.put(techName, techBreakdown.getOrDefault(techName, 0L) + 1);
            } else {
                techBreakdown.put("Unassigned", techBreakdown.getOrDefault("Unassigned", 0L) + 1);
            }

            String siteName = wo.getSite().getName() + " (" + wo.getCustomer().getName() + ")";
            siteBreakdown.put(siteName, siteBreakdown.getOrDefault(siteName, 0L) + 1);
        }

        double complianceRate = totalCompletedOrClosed == 0 ? 100.0 : ((double) compliantCompletedOrClosed / totalCompletedOrClosed) * 100.0;

        return new DashboardSummaryDto(
                statusCounts,
                overdueCount,
                complianceRate,
                techBreakdown,
                siteBreakdown
        );
    }
}
