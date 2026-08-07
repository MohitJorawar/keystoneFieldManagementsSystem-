package com.mohit.keystone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SiteDto(
    UUID id,
    @NotNull(message = "Customer ID is required") UUID customerId,
    String customerName,
    @NotBlank(message = "Site name is required") String name,
    @NotBlank(message = "Site address is required") String address
) {}
