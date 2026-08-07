package com.mohit.keystone.service;

import com.mohit.keystone.domain.Part;
import com.mohit.keystone.dto.PartDto;
import com.mohit.keystone.repository.PartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PartsService {

    private final PartRepository partRepository;

    public PartsService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    public List<PartDto> getAllParts() {
        return partRepository.findAll().stream()
                .map(p -> new PartDto(p.getId(), p.getName(), p.getSku(), p.getUnitCost(), p.getStockQty()))
                .collect(Collectors.toList());
    }
}
