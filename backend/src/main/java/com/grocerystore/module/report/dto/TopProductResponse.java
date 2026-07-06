package com.grocerystore.module.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class TopProductResponse {
    private Long productId;
    private String productName;
    private Long categoryId;
    private long totalUnits;
    private BigDecimal totalRevenue;
}
