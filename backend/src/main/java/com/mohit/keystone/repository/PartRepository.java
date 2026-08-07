package com.mohit.keystone.repository;

import com.mohit.keystone.domain.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PartRepository extends JpaRepository<Part, UUID> {
    Optional<Part> findBySku(String sku);
}
