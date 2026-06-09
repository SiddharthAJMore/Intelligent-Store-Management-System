package com.grocerystore.module.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class RestockSuggestionResponse {
    private Long productId;
    private String productName;
    private Integer currentStock;
    private BigDecimal avgDailySales;
    private BigDecimal daysUntilStockout;
    private Integer suggestedRestockQty;
    private LocalDateTime computedAt;
}
