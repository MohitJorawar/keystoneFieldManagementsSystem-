package com.mohit.keystone.dto;

import com.mohit.keystone.domain.WorkOrderStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record WorkOrderStatusHistoryDto(
    UUID id,
    WorkOrderStatus fromStatus,
    WorkOrderStatus toStatus,
    String changedByName,
    LocalDateTime changedAt,
    String note
) {}
