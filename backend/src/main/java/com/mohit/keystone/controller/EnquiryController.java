package com.mohit.keystone.controller;

import com.mohit.keystone.domain.Enquiry;
import com.mohit.keystone.service.EnquiryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/enquiries")
public class EnquiryController {

    private final EnquiryService enquiryService;

    public EnquiryController(EnquiryService enquiryService) {
        this.enquiryService = enquiryService;
    }

    @PostMapping
    public ResponseEntity<Enquiry> createEnquiry(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String email = payload.get("email");
        String service = payload.get("service");
        String message = payload.get("message");

        if (name == null || email == null || message == null) {
            return ResponseEntity.badRequest().build();
        }

        Enquiry enquiry = enquiryService.createEnquiry(name, email, service != null ? service : "General Enquiry", message);
        return ResponseEntity.ok(enquiry);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<List<Enquiry>> getAllEnquiries() {
        return ResponseEntity.ok(enquiryService.getAllEnquiries());
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<Enquiry> markAsRead(@PathVariable UUID id) {
        return ResponseEntity.ok(enquiryService.markAsRead(id));
    }
}
