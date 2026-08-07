package com.mohit.keystone.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "part_usages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @Column(name = "qty_used", nullable = false)
    private Integer qtyUsed;

    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;
}
