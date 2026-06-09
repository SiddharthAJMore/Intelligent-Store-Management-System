package com.grocerystore.module.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class SalesSummaryResponse {
    private String period;
    private long invoiceCount;
    private BigDecimal totalAmount;
}
