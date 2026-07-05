package com.grocerystore.module.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class InventoryResponse {
    private Long productId;
    private String productName;
    private Long categoryId;
    private Integer quantity;
    private Integer lowStockThreshold;
    private boolean lowStock;
    private LocalDateTime lastUpdated;
}
