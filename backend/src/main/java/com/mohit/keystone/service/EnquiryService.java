package com.mohit.keystone.service;

import com.mohit.keystone.domain.Enquiry;
import com.mohit.keystone.repository.EnquiryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class EnquiryService {

    private final EnquiryRepository enquiryRepository;

    public EnquiryService(EnquiryRepository enquiryRepository) {
        this.enquiryRepository = enquiryRepository;
    }

    @Transactional
    public Enquiry createEnquiry(String name, String email, String service, String message) {
        Enquiry enquiry = new Enquiry(name, email, service, message);
        return enquiryRepository.save(enquiry);
    }

    public List<Enquiry> getAllEnquiries() {
        return enquiryRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Enquiry markAsRead(UUID id) {
        Enquiry enquiry = enquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Enquiry not found"));
        enquiry.setStatus("READ");
        return enquiryRepository.save(enquiry);
    }
}
