package com.mohit.keystone.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PartLogRequest(
    @NotNull(message = "Part ID is required") UUID partId,
    @NotNull(message = "Quantity used is required") @Min(value = 1, message = "Quantity must be at least 1") Integer qtyUsed
) {}
