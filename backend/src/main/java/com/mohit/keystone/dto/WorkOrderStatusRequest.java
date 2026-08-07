package com.mohit.keystone.dto;

import com.mohit.keystone.domain.WorkOrderStatus;
import jakarta.validation.constraints.NotNull;

public record WorkOrderStatusRequest(
    @NotNull(message = "Status is required") WorkOrderStatus status,
    String note
) {}
