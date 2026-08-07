package com.mohit.keystone.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PartUsageDto(
    UUID id,
    UUID partId,
    String partName,
    String partSku,
    BigDecimal unitCost,
    Integer qtyUsed,
    LocalDateTime loggedAt
) {}
