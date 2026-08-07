package com.mohit.keystone.controller;

import com.mohit.keystone.domain.Customer;
import com.mohit.keystone.domain.Site;
import com.mohit.keystone.domain.User;
import com.mohit.keystone.domain.UserRole;
import com.mohit.keystone.dto.LoginRequest;
import com.mohit.keystone.dto.LoginResponse;
import com.mohit.keystone.dto.RegisterRequest;
import com.mohit.keystone.repository.CustomerRepository;
import com.mohit.keystone.repository.SiteRepository;
import com.mohit.keystone.repository.UserRepository;
import com.mohit.keystone.security.JwtTokenProvider;
import com.mohit.keystone.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider,
                          UserRepository userRepository, CustomerRepository customerRepository,
                          SiteRepository siteRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.email(),
                        loginRequest.password()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return ResponseEntity.ok(new LoginResponse(
                userPrincipal.getUser().getId(),
                jwt,
                userPrincipal.getUser().getName(),
                userPrincipal.getUsername(),
                userPrincipal.getRole()
        ));
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<LoginResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.findByEmail(registerRequest.email()).isPresent()) {
            throw new IllegalArgumentException("Email is already in use");
        }

        // 1. Create customer
        Customer customer = Customer.builder()
                .name(registerRequest.name())
                .contactEmail(registerRequest.email())
                .build();
        Customer savedCustomer = customerRepository.saveAndFlush(customer);

        // Create default Primary Site for the new Customer
        Site defaultSite = Site.builder()
                .customer(savedCustomer)
                .name("Primary Site")
                .address("123 Main Street, KeyStone City")
                .build();
        siteRepository.saveAndFlush(defaultSite);

        // 2. Create user
        User user = User.builder()
                .name(registerRequest.name())
                .email(registerRequest.email())
                .passwordHash(passwordEncoder.encode(registerRequest.password()))
                .role(UserRole.CUSTOMER)
                .customer(savedCustomer)
                .build();
        userRepository.saveAndFlush(user);

        // Return a response without a JWT token since the user wants to redirect to login page
        return ResponseEntity.ok(new LoginResponse(
                user.getId(),
                null,
                user.getName(),
                user.getEmail(),
                user.getRole()
        ));
    }
}
