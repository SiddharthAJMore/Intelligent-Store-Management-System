package com.grocerystore.module.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TopProductResponse {
    private Long productId;
    private String productName;
    private long totalUnits;
}
