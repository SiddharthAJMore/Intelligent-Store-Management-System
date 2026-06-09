package com.grocerystore.module.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long cashierId;
    private String cashierUsername;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private List<InvoiceItemResponse> items;
}
