package com.mohit.keystone.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TimeLogDto(
    UUID id,
    String technicianName,
    Integer minutes,
    String note,
    LocalDateTime loggedAt
) {}
