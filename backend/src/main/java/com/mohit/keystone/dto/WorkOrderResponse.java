package com.mohit.keystone.dto;

import com.mohit.keystone.domain.WorkOrderPriority;
import com.mohit.keystone.domain.WorkOrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record WorkOrderResponse(
    UUID id,
    String code,
    String title,
    String description,
    WorkOrderPriority priority,
    WorkOrderStatus status,
    LocalDateTime slaDueAt,
    UUID customerId,
    String customerName,
    UUID siteId,
    String siteName,
    String siteAddress,
    UUID assignedToId,
    String assignedToName,
    LocalDateTime createdAt,
    BigDecimal partsCost,
    Integer laborTimeMinutes,
    Boolean isSlaBreached,
    List<WorkOrderStatusHistoryDto> history,
    List<PartUsageDto> partsUsed,
    List<TimeLogDto> timeLogs
) {}
