package com.mohit.keystone.controller;

import com.mohit.keystone.domain.User;
import com.mohit.keystone.domain.UserRole;
import com.mohit.keystone.dto.*;
import com.mohit.keystone.repository.UserRepository;
import com.mohit.keystone.service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/work-orders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final UserRepository userRepository;

    public WorkOrderController(WorkOrderService workOrderService, UserRepository userRepository) {
        this.workOrderService = workOrderService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Page<WorkOrderResponse>> getWorkOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<WorkOrderResponse> workOrders = workOrderService.getWorkOrders(pageable);
        return ResponseEntity.ok(workOrders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderResponse> getWorkOrderById(@PathVariable UUID id) {
        WorkOrderResponse wo = workOrderService.getWorkOrderById(id);
        return ResponseEntity.ok(wo);
    }

    @PostMapping
    public ResponseEntity<WorkOrderResponse> createWorkOrder(@Valid @RequestBody WorkOrderCreateRequest request) {
        WorkOrderResponse created = workOrderService.createWorkOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkOrderResponse> updateWorkOrder(
            @PathVariable UUID id,
            @Valid @RequestBody WorkOrderCreateRequest request) {
        WorkOrderResponse updated = workOrderService.updateWorkOrder(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<WorkOrderResponse> assignWorkOrder(
            @PathVariable UUID id,
            @RequestBody WorkOrderAssignRequest request) {
        WorkOrderResponse updated = workOrderService.assignWorkOrder(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<WorkOrderResponse> transitionStatus(
            @PathVariable UUID id,
            @Valid @RequestBody WorkOrderStatusRequest request) {
        WorkOrderResponse updated = workOrderService.transitionStatus(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/parts")
    public ResponseEntity<WorkOrderResponse> logPart(
            @PathVariable UUID id,
            @Valid @RequestBody PartLogRequest request) {
        WorkOrderResponse updated = workOrderService.logPart(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/time")
    public ResponseEntity<WorkOrderResponse> logTime(
            @PathVariable UUID id,
            @Valid @RequestBody TimeLogRequest request) {
        WorkOrderResponse updated = workOrderService.logTime(id, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<List<UserDto>> getTechnicians() {
        List<UserDto> techs = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.TECHNICIAN)
                .map(u -> new UserDto(u.getId(), u.getName(), u.getEmail()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(techs);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteWorkOrder(@PathVariable UUID id) {
        workOrderService.deleteWorkOrder(id);
        return ResponseEntity.noContent().build();
    }
}
