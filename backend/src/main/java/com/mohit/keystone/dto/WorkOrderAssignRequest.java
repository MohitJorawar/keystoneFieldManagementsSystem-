package com.mohit.keystone.dto;

import java.util.UUID;

public record WorkOrderAssignRequest(
    UUID assignedToId
) {}
