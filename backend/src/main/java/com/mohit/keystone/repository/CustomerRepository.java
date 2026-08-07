package com.mohit.keystone.repository;

import com.mohit.keystone.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Page<Customer> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
