package com.mohit.keystone.controller;

import com.mohit.keystone.dto.PartDto;
import com.mohit.keystone.service.PartsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
public class PartController {

    private final PartsService partsService;

    public PartController(PartsService partsService) {
        this.partsService = partsService;
    }

    @GetMapping
    public ResponseEntity<List<PartDto>> getAllParts() {
        List<PartDto> parts = partsService.getAllParts();
        return ResponseEntity.ok(parts);
    }
}
