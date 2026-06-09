package com.grocerystore.module.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private Long categoryId;
    private String categoryName;
    private BigDecimal price;
    private String unit;
    private String sku;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
