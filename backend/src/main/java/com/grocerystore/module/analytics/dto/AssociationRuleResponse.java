package com.grocerystore.module.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AssociationRuleResponse {
    private Long productAId;
    private String productAName;
    private Long productBId;
    private String productBName;
    private BigDecimal support;
    private BigDecimal confidence;
    private Integer coOccurrenceCount;
    private LocalDateTime computedAt;
}
