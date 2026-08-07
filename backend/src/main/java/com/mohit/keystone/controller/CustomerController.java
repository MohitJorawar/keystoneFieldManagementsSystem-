package com.mohit.keystone.controller;

import com.mohit.keystone.dto.CustomerDto;
import com.mohit.keystone.dto.SiteDto;
import com.mohit.keystone.service.CustomerService;
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

@RestController
@RequestMapping("/api")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping("/customers")
    public ResponseEntity<Page<CustomerDto>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CustomerDto> customers = customerService.getCustomers(search, pageable);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/customers/{id}")
    public ResponseEntity<CustomerDto> getCustomerById(@PathVariable UUID id) {
        CustomerDto customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(customer);
    }

    @PostMapping("/customers")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<CustomerDto> createCustomer(@Valid @RequestBody CustomerDto customerDto) {
        CustomerDto created = customerService.createCustomer(customerDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/customers/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<CustomerDto> updateCustomer(@PathVariable UUID id,
            @Valid @RequestBody CustomerDto customerDto) {
        CustomerDto updated = customerService.updateCustomer(id, customerDto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/customers/{id}/sites")
    public ResponseEntity<Page<SiteDto>> getCustomerSites(
            @PathVariable UUID id,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SiteDto> sites = customerService.getSites(id, search, pageable);
        return ResponseEntity.ok(sites);
    }

    @GetMapping("/sites")
    public ResponseEntity<List<SiteDto>> getSitesList(@RequestParam(required = false) UUID customerId) {
        List<SiteDto> sites = customerService.getSitesList(customerId);
        return ResponseEntity.ok(sites);
    }

    @PostMapping("/customers/{id}/sites")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<SiteDto> createCustomerSite(@PathVariable UUID id, @Valid @RequestBody SiteDto siteDto) {
        SiteDto created = customerService.createSite(id, siteDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/sites/{siteId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<SiteDto> updateSite(@PathVariable UUID siteId, @Valid @RequestBody SiteDto siteDto) {
        SiteDto updated = customerService.updateSite(siteId, siteDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/customers/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sites/{siteId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteSite(@PathVariable UUID siteId) {
        customerService.deleteSite(siteId);
        return ResponseEntity.noContent().build();
    }
}
