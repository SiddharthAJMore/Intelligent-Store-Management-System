package com.grocerystore.module.analytics;

import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.analytics.dto.AssociationRuleResponse;
import com.grocerystore.module.analytics.dto.RestockSuggestionResponse;
import com.grocerystore.module.analytics.entity.AssociationRule;
import com.grocerystore.module.analytics.entity.RestockSuggestion;
import com.grocerystore.module.analytics.repository.AssociationRuleRepository;
import com.grocerystore.module.analytics.repository.RestockSuggestionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AnalyticsService {

    private final JdbcTemplate jdbcTemplate;
    private final AssociationRuleRepository associationRuleRepository;
    private final RestockSuggestionRepository restockSuggestionRepository;

    public AnalyticsService(
        JdbcTemplate jdbcTemplate,
        AssociationRuleRepository associationRuleRepository,
        RestockSuggestionRepository restockSuggestionRepository
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.associationRuleRepository = associationRuleRepository;
        this.restockSuggestionRepository = restockSuggestionRepository;
    }

    @Transactional
    public void runAnalysis() {
        long startTime = System.currentTimeMillis();
        log.info("Starting analytics batch analysis...");
        
        log.debug("Clearing existing association rules...");
        associationRuleRepository.deleteAllInBatch();
        log.debug("Clearing existing restock suggestions...");
        restockSuggestionRepository.deleteAllInBatch();

        log.debug("Computing association rules from sales data...");
        jdbcTemplate.execute("""
            INSERT INTO association_rules (product_a_id, product_b_id, support, confidence, co_occurrence_count, computed_at)
            WITH invoice_products AS (
                SELECT DISTINCT invoice_id, product_id FROM sales_invoice_items
            ),
            pair_counts AS (
                SELECT a.product_id AS product_a_id,
                       b.product_id AS product_b_id,
                       COUNT(*) AS co_count
                FROM invoice_products a
                JOIN invoice_products b
                  ON a.invoice_id = b.invoice_id
                 AND a.product_id < b.product_id
                GROUP BY a.product_id, b.product_id
            ),
            product_counts AS (
                SELECT product_id, COUNT(DISTINCT invoice_id) AS product_count
                FROM invoice_products
                GROUP BY product_id
            ),
            totals AS (
                SELECT COUNT(*)::numeric AS total_invoices FROM sales_invoices
            )
            SELECT p.product_a_id,
                   p.product_b_id,
                   (p.co_count::numeric / NULLIF(t.total_invoices, 0))::numeric(8,4) AS support,
                   (p.co_count::numeric / NULLIF(pa.product_count, 0))::numeric(8,4) AS confidence,
                   p.co_count,
                   NOW()
            FROM pair_counts p
            CROSS JOIN totals t
            JOIN product_counts pa ON pa.product_id = p.product_a_id
            WHERE p.co_count > 0
            ORDER BY p.co_count DESC
            """);

        jdbcTemplate.execute("""
            INSERT INTO restock_suggestions (product_id, current_stock, avg_daily_sales, days_until_stockout, suggested_restock_qty, computed_at)
            WITH recent_sales AS (
                SELECT sii.product_id,
                       COALESCE(SUM(sii.quantity), 0)::numeric / 30 AS avg_daily_sales
                FROM sales_invoice_items sii
                JOIN sales_invoices si ON si.id = sii.invoice_id
                WHERE si.created_at >= (NOW() - INTERVAL '30 days')
                GROUP BY sii.product_id
            )
            SELECT i.product_id,
                   i.quantity AS current_stock,
                   COALESCE(rs.avg_daily_sales, 0)::numeric(8,2) AS avg_daily_sales,
                   CASE
                       WHEN COALESCE(rs.avg_daily_sales, 0) = 0 THEN NULL
                       ELSE ROUND((i.quantity::numeric / rs.avg_daily_sales)::numeric, 1)
                   END AS days_until_stockout,
                   CASE
                       WHEN COALESCE(rs.avg_daily_sales, 0) = 0 THEN 0
                       ELSE GREATEST(CEIL((rs.avg_daily_sales * 30) - i.quantity)::int, 0)
                   END AS suggested_restock_qty,
                   NOW()
            FROM inventory i
            LEFT JOIN recent_sales rs ON rs.product_id = i.product_id
            """);
    }

    public PageResponse<AssociationRuleResponse> getAssociationRules(int page, int size, String sortBy, String direction) {
        log.debug("Fetching association rules - Page: {}, Size: {}, Sort: {} {}", page, size, sortBy, direction);
        Page<AssociationRule> result = associationRuleRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sortBy)));
        log.debug("Found {} association rules", result.getTotalElements());
        return toPageResponse(result.map(rule -> AssociationRuleResponse.builder()
            .productAId(rule.getProductA().getId())
            .productAName(rule.getProductA().getName())
            .productBId(rule.getProductB().getId())
            .productBName(rule.getProductB().getName())
            .support(rule.getSupport())
            .confidence(rule.getConfidence())
            .coOccurrenceCount(rule.getCoOccurrenceCount())
            .computedAt(rule.getComputedAt())
            .build()));
    }

    public PageResponse<RestockSuggestionResponse> getRestockSuggestions(int page, int size, String sortBy, String direction) {
        log.debug("Fetching restock suggestions - Page: {}, Size: {}, Sort: {} {}", page, size, sortBy, direction);
        Page<RestockSuggestion> result = restockSuggestionRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), sortBy)));
        log.debug("Found {} restock suggestions", result.getTotalElements());
        return toPageResponse(result.map(s -> RestockSuggestionResponse.builder()
            .productId(s.getProduct().getId())
            .productName(s.getProduct().getName())
            .currentStock(s.getCurrentStock())
            .avgDailySales(s.getAvgDailySales())
            .daysUntilStockout(s.getDaysUntilStockout())
            .suggestedRestockQty(s.getSuggestedRestockQty())
            .computedAt(s.getComputedAt())
            .build()));
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
            .content(page.getContent())
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .first(page.isFirst())
            .last(page.isLast())
            .build();
    }
}
