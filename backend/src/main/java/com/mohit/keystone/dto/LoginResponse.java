package com.mohit.keystone.dto;

import com.mohit.keystone.domain.UserRole;
import java.util.UUID;

public record LoginResponse(
    UUID id,
    String token,
    String name,
    String email,
    UserRole role
) {}
