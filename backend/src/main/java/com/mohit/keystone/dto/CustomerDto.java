package com.mohit.keystone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CustomerDto(
        UUID id,
        @NotBlank(message = "Customer name is required") String name,
        @NotBlank(message = "Contact email is required") @Email(message = "Invalid email format") String contactEmail) {
}
