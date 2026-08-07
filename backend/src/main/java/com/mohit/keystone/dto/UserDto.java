package com.mohit.keystone.dto;

import java.util.UUID;

public record UserDto(
    UUID id,
    String name,
    String email
) {}
