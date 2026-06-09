package com.grocerystore.module.analytics.entity;

import com.grocerystore.module.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "restock_suggestions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestockSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock;

    @Column(name = "avg_daily_sales", nullable = false, precision = 8, scale = 2)
    private BigDecimal avgDailySales;

    @Column(name = "days_until_stockout", precision = 6, scale = 1)
    private BigDecimal daysUntilStockout;

    @Column(name = "suggested_restock_qty")
    private Integer suggestedRestockQty;

    @Column(name = "computed_at", nullable = false)
    private LocalDateTime computedAt;
}
