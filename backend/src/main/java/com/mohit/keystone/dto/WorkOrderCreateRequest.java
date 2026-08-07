package com.mohit.keystone.dto;

import com.mohit.keystone.domain.WorkOrderPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record WorkOrderCreateRequest(
    @NotBlank(message = "Title is required") String title,
    @NotBlank(message = "Description is required") String description,
    @NotNull(message = "Priority is required") WorkOrderPriority priority,
    @NotNull(message = "Customer ID is required") UUID customerId,
    @NotNull(message = "Site ID is required") UUID siteId
) {}
