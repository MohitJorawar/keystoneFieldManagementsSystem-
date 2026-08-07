package com.mohit.keystone.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PartDto(
    UUID id,
    String name,
    String sku,
    BigDecimal unitCost,
    Integer stockQty
) {}
