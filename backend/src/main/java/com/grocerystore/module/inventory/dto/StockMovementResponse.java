package com.grocerystore.module.inventory.dto;

import com.grocerystore.module.inventory.entity.MovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class StockMovementResponse {
    private Long id;
    private Long productId;
    private MovementType movementType;
    private Integer quantityChange;
    private Long referenceId;
    private String notes;
    private LocalDateTime createdAt;
}
