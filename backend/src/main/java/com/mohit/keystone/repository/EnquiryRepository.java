package com.mohit.keystone.repository;

import com.mohit.keystone.domain.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, UUID> {
    List<Enquiry> findAllByOrderByCreatedAtDesc();
}
