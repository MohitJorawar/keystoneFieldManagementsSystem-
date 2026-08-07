package com.mohit.keystone.repository;

import com.mohit.keystone.domain.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface SiteRepository extends JpaRepository<Site, UUID> {
    List<Site> findByCustomerId(UUID customerId);
    Page<Site> findByCustomerId(UUID customerId, Pageable pageable);
    Page<Site> findByNameContainingIgnoreCase(String name, Pageable pageable);
    Page<Site> findByCustomerIdAndNameContainingIgnoreCase(UUID customerId, String name, Pageable pageable);
}
