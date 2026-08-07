package com.mohit.keystone.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TimeLogRequest(
    @NotNull(message = "Minutes are required") @Min(value = 1, message = "Minutes must be at least 1") Integer minutes,
    String note
) {}
