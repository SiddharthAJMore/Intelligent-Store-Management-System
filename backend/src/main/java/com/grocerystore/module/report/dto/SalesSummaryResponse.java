package com.grocerystore.module.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class SalesSummaryResponse {
    private String period;
    private long invoiceCount;
    private BigDecimal totalAmount;
    private List<DailyBreakdown> breakdown;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class DailyBreakdown {
        private String label;
        private BigDecimal revenue;
        private long invoiceCount;
    }
}
