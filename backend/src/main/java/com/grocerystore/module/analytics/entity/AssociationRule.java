package com.grocerystore.module.analytics.entity;

import com.grocerystore.module.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "association_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssociationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_a_id", nullable = false)
    private Product productA;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_b_id", nullable = false)
    private Product productB;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal support;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal confidence;

    @Column(name = "co_occurrence_count", nullable = false)
    private Integer coOccurrenceCount;

    @Column(name = "computed_at", nullable = false)
    private LocalDateTime computedAt;
}
