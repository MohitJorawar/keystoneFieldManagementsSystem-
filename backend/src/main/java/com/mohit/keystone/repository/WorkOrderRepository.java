package com.mohit.keystone.repository;

import com.mohit.keystone.domain.WorkOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {
    
    // Scopes queries to a specific assigned technician (role: TECHNICIAN)
    Page<WorkOrder> findByAssignedToId(UUID assignedToId, Pageable pageable);
    
    // Scopes queries to a specific customer organization (role: CUSTOMER)
    Page<WorkOrder> findByCustomerId(UUID customerId, Pageable pageable);
    
    // Finds the latest generated work order to read its sequential code prefix
    Optional<WorkOrder> findFirstByOrderByCreatedAtDesc();
}
