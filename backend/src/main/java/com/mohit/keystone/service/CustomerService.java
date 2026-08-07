package com.mohit.keystone.service;

import com.mohit.keystone.domain.Customer;
import com.mohit.keystone.domain.Site;
import com.mohit.keystone.domain.User;
import com.mohit.keystone.domain.UserRole;
import com.mohit.keystone.dto.CustomerDto;
import com.mohit.keystone.dto.SiteDto;
import com.mohit.keystone.repository.CustomerRepository;
import com.mohit.keystone.repository.SiteRepository;
import com.mohit.keystone.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;

    public CustomerService(CustomerRepository customerRepository, SiteRepository siteRepository) {
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new AccessDeniedException("User not authenticated");
        }
        return ((UserPrincipal) auth.getPrincipal()).getUser();
    }

    public Page<CustomerDto> getCustomers(String search, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            if (currentUser.getCustomer() == null) {
                return Page.empty();
            }
            Customer c = currentUser.getCustomer();
            return customerRepository.findById(c.getId())
                    .map(this::mapToCustomerDto)
                    .map(dto -> (Page<CustomerDto>) new PageImpl<>(List.of(dto), pageable, 1))
                    .orElseGet(Page::empty);
        }

        Page<Customer> customers;
        if (search != null && !search.trim().isEmpty()) {
            customers = customerRepository.findByNameContainingIgnoreCase(search, pageable);
        } else {
            customers = customerRepository.findAll(pageable);
        }
        return customers.map(this::mapToCustomerDto);
    }

    public CustomerDto getCustomerById(UUID id) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            if (currentUser.getCustomer() == null || !currentUser.getCustomer().getId().equals(id)) {
                throw new AccessDeniedException("You do not have access to this customer");
            }
        }
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return mapToCustomerDto(customer);
    }

    public CustomerDto createCustomer(CustomerDto dto) {
        Customer customer = Customer.builder()
                .name(dto.name())
                .contactEmail(dto.contactEmail())
                .build();
        Customer saved = customerRepository.save(customer);
        return mapToCustomerDto(saved);
    }

    public CustomerDto updateCustomer(UUID id, CustomerDto dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        customer.setName(dto.name());
        customer.setContactEmail(dto.contactEmail());
        Customer saved = customerRepository.save(customer);
        return mapToCustomerDto(saved);
    }

    public Page<SiteDto> getSites(UUID customerId, String search, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            if (currentUser.getCustomer() == null
                    || (customerId != null && !currentUser.getCustomer().getId().equals(customerId))) {
                throw new AccessDeniedException("You do not have access to this customer's sites");
            }
            customerId = currentUser.getCustomer().getId();
        }

        Page<Site> sites;
        if (customerId != null) {
            if (search != null && !search.trim().isEmpty()) {
                sites = siteRepository.findByCustomerIdAndNameContainingIgnoreCase(customerId, search, pageable);
            } else {
                sites = siteRepository.findByCustomerId(customerId, pageable);
            }
        } else {
            if (search != null && !search.trim().isEmpty()) {
                sites = siteRepository.findByNameContainingIgnoreCase(search, pageable);
            } else {
                sites = siteRepository.findAll(pageable);
            }
        }
        return sites.map(this::mapToSiteDto);
    }

    public List<SiteDto> getSitesList(UUID customerId) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            customerId = currentUser.getCustomer() != null ? currentUser.getCustomer().getId() : null;
        }
        if (customerId == null) {
            return siteRepository.findAll().stream().map(this::mapToSiteDto).collect(Collectors.toList());
        }
        return siteRepository.findByCustomerId(customerId).stream().map(this::mapToSiteDto)
                .collect(Collectors.toList());
    }

    public SiteDto createSite(UUID customerId, SiteDto dto) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        Site site = Site.builder()
                .customer(customer)
                .name(dto.name())
                .address(dto.address())
                .build();
        Site saved = siteRepository.save(site);
        return mapToSiteDto(saved);
    }

    public SiteDto updateSite(UUID siteId, SiteDto dto) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new IllegalArgumentException("Site not found"));
        site.setName(dto.name());
        site.setAddress(dto.address());
        Site saved = siteRepository.save(site);
        return mapToSiteDto(saved);
    }

    public void deleteCustomer(UUID id) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.MANAGER) {
            throw new AccessDeniedException("Only managers can delete customers");
        }
        customerRepository.deleteById(id);
    }

    public void deleteSite(UUID siteId) {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.MANAGER) {
            throw new AccessDeniedException("Only managers can delete sites");
        }
        siteRepository.deleteById(siteId);
    }

    private CustomerDto mapToCustomerDto(Customer customer) {
        return new CustomerDto(customer.getId(), customer.getName(), customer.getContactEmail());
    }

    private SiteDto mapToSiteDto(Site site) {
        return new SiteDto(site.getId(), site.getCustomer().getId(), site.getCustomer().getName(), site.getName(),
                site.getAddress());
    }
}
