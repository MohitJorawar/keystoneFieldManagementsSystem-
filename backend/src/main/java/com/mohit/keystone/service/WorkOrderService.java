package com.mohit.keystone.service;

import com.mohit.keystone.domain.*;
import com.mohit.keystone.dto.*;
import com.mohit.keystone.repository.*;
import com.mohit.keystone.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final PartRepository partRepository;
    private final PartUsageRepository partUsageRepository;
    private final TimeLogRepository timeLogRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;

    public WorkOrderService(
            WorkOrderRepository workOrderRepository,
            CustomerRepository customerRepository,
            SiteRepository siteRepository,
            UserRepository userRepository,
            PartRepository partRepository,
            PartUsageRepository partUsageRepository,
            TimeLogRepository timeLogRepository,
            WorkOrderStatusHistoryRepository historyRepository) {
        this.workOrderRepository = workOrderRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.userRepository = userRepository;
        this.partRepository = partRepository;
        this.partUsageRepository = partUsageRepository;
        this.timeLogRepository = timeLogRepository;
        this.historyRepository = historyRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new AccessDeniedException("User not authenticated");
        }
        return ((UserPrincipal) auth.getPrincipal()).getUser();
    }

    private synchronized String generateWorkOrderCode() {
        Optional<WorkOrder> latestOpt = workOrderRepository.findFirstByOrderByCreatedAtDesc();
        if (latestOpt.isPresent()) {
            String lastCode = latestOpt.get().getCode();
            try {
                if (lastCode.startsWith("WO-")) {
                    int num = Integer.parseInt(lastCode.substring(3));
                    return String.format("WO-%04d", num + 1);
                }
            } catch (NumberFormatException ignored) {}
        }
        return "WO-1001";
    }

    private LocalDateTime calculateSlaDueAt(WorkOrderPriority priority, LocalDateTime createdTime) {
        return switch (priority) {
            case EMERGENCY -> createdTime.plusHours(4);
            case HIGH -> createdTime.plusHours(24);
            case MEDIUM -> createdTime.plusHours(72);
            case LOW -> createdTime.plusHours(168);
        };
    }

    public WorkOrderResponse createWorkOrder(WorkOrderCreateRequest request) {
        User currentUser = getCurrentUser();

        // Enforce customer restriction
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            if (currentUser.getCustomer() == null || !currentUser.getCustomer().getId().equals(request.customerId())) {
                throw new AccessDeniedException("You can only create work orders for your own organization.");
            }
        }

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Site site = siteRepository.findById(request.siteId())
                .orElseThrow(() -> new IllegalArgumentException("Site not found"));

        if (!site.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("Site does not belong to the selected customer.");
        }

        LocalDateTime now = LocalDateTime.now();
        WorkOrder workOrder = WorkOrder.builder()
                .code(generateWorkOrderCode())
                .title(request.title())
                .description(request.description())
                .priority(request.priority())
                .status(WorkOrderStatus.NEW)
                .slaDueAt(calculateSlaDueAt(request.priority(), now))
                .customer(customer)
                .site(site)
                .createdAt(now)
                .build();

        WorkOrder saved = workOrderRepository.save(workOrder);

        // Record status history
        historyRepository.save(WorkOrderStatusHistory.builder()
                .workOrder(saved)
                .fromStatus(null)
                .toStatus(WorkOrderStatus.NEW)
                .changedBy(currentUser)
                .changedAt(now)
                .note("Work Order Created")
                .build());

        return getWorkOrderDetails(saved.getId());
    }

    public Page<WorkOrderResponse> getWorkOrders(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<WorkOrder> ordersPage;

        if (currentUser.getRole() == UserRole.CUSTOMER) {
            UUID customerId = currentUser.getCustomer() != null ? currentUser.getCustomer().getId() : UUID.randomUUID();
            ordersPage = workOrderRepository.findByCustomerId(customerId, pageable);
        } else if (currentUser.getRole() == UserRole.TECHNICIAN) {
            ordersPage = workOrderRepository.findByAssignedToId(currentUser.getId(), pageable);
        } else {
            ordersPage = workOrderRepository.findAll(pageable);
        }

        return ordersPage.map(wo -> mapToResponse(wo, false));
    }

    public WorkOrderResponse getWorkOrderById(UUID id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));

        User currentUser = getCurrentUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            if (currentUser.getCustomer() == null || !currentUser.getCustomer().getId().equals(wo.getCustomer().getId())) {
                throw new AccessDeniedException("You do not have permission to view this work order.");
            }
        } else if (currentUser.getRole() == UserRole.TECHNICIAN) {
            if (wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You do not have permission to view this work order.");
            }
        }

        return mapToResponse(wo, true);
    }

    public WorkOrderResponse updateWorkOrder(UUID id, WorkOrderCreateRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.MANAGER && currentUser.getRole() != UserRole.DISPATCHER) {
            throw new AccessDeniedException("Only Managers and Dispatchers can update work orders.");
        }

        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));

        if (wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot update a closed or cancelled work order.");
        }

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Site site = siteRepository.findById(request.siteId())
                .orElseThrow(() -> new IllegalArgumentException("Site not found"));

        wo.setTitle(request.title());
        wo.setDescription(request.description());
        if (wo.getPriority() != request.priority()) {
            wo.setPriority(request.priority());
            wo.setSlaDueAt(calculateSlaDueAt(request.priority(), wo.getCreatedAt()));
        }
        wo.setCustomer(customer);
        wo.setSite(site);

        WorkOrder saved = workOrderRepository.save(wo);
        return getWorkOrderDetails(saved.getId());
    }

    public WorkOrderResponse assignWorkOrder(UUID id, WorkOrderAssignRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.MANAGER && currentUser.getRole() != UserRole.DISPATCHER) {
            throw new AccessDeniedException("Only Managers and Dispatchers can assign work orders.");
        }

        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));

        if (wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot assign a closed or cancelled work order.");
        }

        User technician = null;
        if (request.assignedToId() != null) {
            technician = userRepository.findById(request.assignedToId())
                    .orElseThrow(() -> new IllegalArgumentException("Technician user not found"));
            if (technician.getRole() != UserRole.TECHNICIAN) {
                throw new IllegalArgumentException("Selected user is not a technician.");
            }
        }

        User oldAssignee = wo.getAssignedTo();
        wo.setAssignedTo(technician);

        WorkOrderStatus oldStatus = wo.getStatus();
        WorkOrderStatus newStatus = oldStatus;
        if (technician != null && oldStatus == WorkOrderStatus.NEW) {
            newStatus = WorkOrderStatus.ASSIGNED;
            wo.setStatus(newStatus);
        } else if (technician == null && oldStatus == WorkOrderStatus.ASSIGNED) {
            newStatus = WorkOrderStatus.NEW;
            wo.setStatus(newStatus);
        }

        WorkOrder saved = workOrderRepository.save(wo);

        String note = (technician != null) ? "Assigned to " + technician.getName() : "Unassigned";

        if (oldStatus != newStatus || oldAssignee != technician) {
            historyRepository.save(WorkOrderStatusHistory.builder()
                    .workOrder(saved)
                    .fromStatus(oldStatus)
                    .toStatus(newStatus)
                    .changedBy(currentUser)
                    .changedAt(LocalDateTime.now())
                    .note(note)
                    .build());
        }

        return getWorkOrderDetails(saved.getId());
    }

    public WorkOrderResponse transitionStatus(UUID id, WorkOrderStatusRequest request) {
        User currentUser = getCurrentUser();
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));

        WorkOrderStatus currentStatus = wo.getStatus();
        WorkOrderStatus nextStatus = request.status();

        if (currentStatus == nextStatus) {
            return getWorkOrderDetails(wo.getId());
        }

        // Validate overall terminal state restriction
        if (currentStatus == WorkOrderStatus.CLOSED || currentStatus == WorkOrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Terminal state work orders cannot transition further.");
        }

        // Enforce role-based transition controls
        validateRoleStateTransition(currentUser, wo, currentStatus, nextStatus);

        // Validate permissible state transitions path
        validateLifecyclePath(currentStatus, nextStatus);

        wo.setStatus(nextStatus);
        WorkOrder saved = workOrderRepository.save(wo);

        historyRepository.save(WorkOrderStatusHistory.builder()
                .workOrder(saved)
                .fromStatus(currentStatus)
                .toStatus(nextStatus)
                .changedBy(currentUser)
                .changedAt(LocalDateTime.now())
                .note(request.note() != null ? request.note() : "Status updated to " + nextStatus)
                .build());

        return getWorkOrderDetails(saved.getId());
    }

    private void validateRoleStateTransition(User user, WorkOrder wo, WorkOrderStatus from, WorkOrderStatus to) {
        UserRole role = user.getRole();

        // Managers can do everything
        if (role == UserRole.MANAGER) {
            return;
        }

        // Customer can only cancel their own order and only if it is NEW
        if (role == UserRole.CUSTOMER) {
            if (to == WorkOrderStatus.CANCELLED && from == WorkOrderStatus.NEW && wo.getCustomer().getId().equals(user.getCustomer().getId())) {
                return;
            }
            throw new AccessDeniedException("Customers can only cancel their own work orders in NEW status.");
        }

        // Dispatchers can do everything except close
        if (role == UserRole.DISPATCHER) {
            if (to == WorkOrderStatus.CLOSED) {
                throw new AccessDeniedException("Only Managers can close work orders.");
            }
            return;
        }

        // Technicians can only act on their assigned work orders
        if (role == UserRole.TECHNICIAN) {
            if (wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(user.getId())) {
                throw new AccessDeniedException("Technicians can only transition work orders assigned to them.");
            }
            if (to == WorkOrderStatus.CLOSED) {
                throw new AccessDeniedException("Technicians cannot close work orders.");
            }
            // Technicians cannot cancel jobs, only start, hold, resume, complete, or reopen
            if (to == WorkOrderStatus.CANCELLED) {
                throw new AccessDeniedException("Technicians cannot cancel work orders.");
            }
        }
    }

    private void validateLifecyclePath(WorkOrderStatus from, WorkOrderStatus to) {
        boolean valid = switch (from) {
            case NEW -> (to == WorkOrderStatus.ASSIGNED || to == WorkOrderStatus.CANCELLED);
            case ASSIGNED -> (to == WorkOrderStatus.IN_PROGRESS || to == WorkOrderStatus.CANCELLED || to == WorkOrderStatus.NEW);
            case IN_PROGRESS -> (to == WorkOrderStatus.ON_HOLD || to == WorkOrderStatus.COMPLETED || to == WorkOrderStatus.CANCELLED);
            case ON_HOLD -> (to == WorkOrderStatus.IN_PROGRESS || to == WorkOrderStatus.CANCELLED);
            case COMPLETED -> (to == WorkOrderStatus.CLOSED || to == WorkOrderStatus.IN_PROGRESS); // IN_PROGRESS means reopen
            case CLOSED, CANCELLED -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException("Illegal state transition from " + from + " to " + to);
        }
    }

    public WorkOrderResponse logPart(UUID id, PartLogRequest request) {
        User currentUser = getCurrentUser();
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));

        // Tech and Manager/Dispatcher can log parts
        if (currentUser.getRole() == UserRole.TECHNICIAN) {
            if (wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You can only log parts on your assigned work orders.");
            }
        } else if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Customers cannot log parts.");
        }

        if (wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot log parts on a closed or cancelled work order.");
        }

        Part part = partRepository.findById(request.partId())
                .orElseThrow(() -> new IllegalArgumentException("Part not found"));

        if (part.getStockQty() < request.qtyUsed()) {
            throw new IllegalArgumentException("Insufficient stock. Requested: " + request.qtyUsed() + ", Available: " + part.getStockQty());
        }

        // Decrement stock
        part.setStockQty(part.getStockQty() - request.qtyUsed());
        partRepository.save(part);

        // Record usage
        partUsageRepository.save(PartUsage.builder()
                .workOrder(wo)
                .part(part)
                .qtyUsed(request.qtyUsed())
                .loggedAt(LocalDateTime.now())
                .build());

        return getWorkOrderDetails(wo.getId());
    }

    public WorkOrderResponse logTime(UUID id, TimeLogRequest request) {
        User currentUser = getCurrentUser();
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));

        if (currentUser.getRole() == UserRole.TECHNICIAN) {
            if (wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You can only log time on your assigned work orders.");
            }
        } else if (currentUser.getRole() == UserRole.CUSTOMER) {
            throw new AccessDeniedException("Customers cannot log time.");
        }

        if (wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot log time on a closed or cancelled work order.");
        }

        timeLogRepository.save(TimeLog.builder()
                .workOrder(wo)
                .technician(currentUser)
                .minutes(request.minutes())
                .note(request.note())
                .loggedAt(LocalDateTime.now())
                .build());

        return getWorkOrderDetails(wo.getId());
    }

    private WorkOrderResponse getWorkOrderDetails(UUID id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));
        return mapToResponse(wo, true);
    }

    private WorkOrderResponse mapToResponse(WorkOrder wo, boolean includeDetails) {
        List<WorkOrderStatusHistoryDto> history = new ArrayList<>();
        List<PartUsageDto> partsUsed = new ArrayList<>();
        List<TimeLogDto> timeLogs = new ArrayList<>();
        BigDecimal partsCost = BigDecimal.ZERO;
        int laborTimeMinutes = 0;

        if (includeDetails) {
            history = historyRepository.findByWorkOrderIdOrderByChangedAtAsc(wo.getId())
                    .stream()
                    .map(h -> new WorkOrderStatusHistoryDto(
                            h.getId(),
                            h.getFromStatus(),
                            h.getToStatus(),
                            h.getChangedBy().getName(),
                            h.getChangedAt(),
                            h.getNote()
                    ))
                    .collect(Collectors.toList());

            List<PartUsage> usages = partUsageRepository.findByWorkOrderId(wo.getId());
            partsUsed = usages.stream()
                    .map(u -> new PartUsageDto(
                            u.getId(),
                            u.getPart().getId(),
                            u.getPart().getName(),
                            u.getPart().getSku(),
                            u.getPart().getUnitCost(),
                            u.getQtyUsed(),
                            u.getLoggedAt()
                    ))
                    .collect(Collectors.toList());

            for (PartUsage u : usages) {
                partsCost = partsCost.add(u.getPart().getUnitCost().multiply(BigDecimal.valueOf(u.getQtyUsed())));
            }

            List<TimeLog> logs = timeLogRepository.findByWorkOrderId(wo.getId());
            timeLogs = logs.stream()
                    .map(l -> new TimeLogDto(
                            l.getId(),
                            l.getTechnician().getName(),
                            l.getMinutes(),
                            l.getNote(),
                            l.getLoggedAt()
                    ))
                    .collect(Collectors.toList());

            for (TimeLog l : logs) {
                laborTimeMinutes += l.getMinutes();
            }
        }

        // Determine if SLA is breached
        boolean isSlaBreached = false;
        if (wo.getStatus() == WorkOrderStatus.COMPLETED || wo.getStatus() == WorkOrderStatus.CLOSED) {
            // Find when it transitioned to COMPLETED
            Optional<WorkOrderStatusHistory> completionOpt = historyRepository.findByWorkOrderIdOrderByChangedAtAsc(wo.getId())
                    .stream()
                    .filter(h -> h.getToStatus() == WorkOrderStatus.COMPLETED)
                    .findFirst();
            if (completionOpt.isPresent()) {
                isSlaBreached = completionOpt.get().getChangedAt().isAfter(wo.getSlaDueAt());
            }
        } else if (wo.getStatus() != WorkOrderStatus.CANCELLED) {
            isSlaBreached = LocalDateTime.now().isAfter(wo.getSlaDueAt());
        }

        return new WorkOrderResponse(
                wo.getId(),
                wo.getCode(),
                wo.getTitle(),
                wo.getDescription(),
                wo.getPriority(),
                wo.getStatus(),
                wo.getSlaDueAt(),
                wo.getCustomer().getId(),
                wo.getCustomer().getName(),
                wo.getSite().getId(),
                wo.getSite().getName(),
                wo.getSite().getAddress(),
                wo.getAssignedTo() != null ? wo.getAssignedTo().getId() : null,
                wo.getAssignedTo() != null ? wo.getAssignedTo().getName() : null,
                wo.getCreatedAt(),
                partsCost,
                laborTimeMinutes,
                isSlaBreached,
                history,
                partsUsed,
                timeLogs
        );
    }

    public void deleteWorkOrder(UUID id) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.MANAGER) {
            throw new AccessDeniedException("Only managers can delete work orders");
        }
        workOrderRepository.deleteById(id);
    }
}
