package com.mohit.keystone.repository;

import com.mohit.keystone.domain.PartUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PartUsageRepository extends JpaRepository<PartUsage, UUID> {
    List<PartUsage> findByWorkOrderId(UUID workOrderId);
}
