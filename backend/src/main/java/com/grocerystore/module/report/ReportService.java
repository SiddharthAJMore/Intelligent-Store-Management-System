package com.grocerystore.module.report;

import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.inventory.entity.Inventory;
import com.grocerystore.module.inventory.repository.InventoryRepository;
import com.grocerystore.module.report.dto.SalesSummaryResponse;
import com.grocerystore.module.report.dto.TopProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class ReportService {

    private final InventoryRepository inventoryRepository;
    private final JdbcTemplate jdbcTemplate;

    public ReportService(
        InventoryRepository inventoryRepository,
        JdbcTemplate jdbcTemplate
    ) {
        this.inventoryRepository = inventoryRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public SalesSummaryResponse salesSummary(String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fromDate;
        LocalDateTime toDate = now;
        String normalized = period == null ? "daily" : period.toLowerCase();

        if ("weekly".equals(normalized)) {
            // Start of current week (Monday)
            fromDate = now.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                .withHour(0).withMinute(0).withSecond(0);
        } else if ("monthly".equals(normalized)) {
            // Start of current month
            fromDate = now.with(TemporalAdjusters.firstDayOfMonth())
                .withHour(0).withMinute(0).withSecond(0);
        } else {
            // Start of today
            fromDate = now.withHour(0).withMinute(0).withSecond(0);
            normalized = "daily";
        }

        Long invoiceCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sales_invoices WHERE created_at >= ? AND created_at < ?",
            Long.class,
            fromDate,
            toDate
        );

        BigDecimal total = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(total_amount), 0) FROM sales_invoices WHERE created_at >= ? AND created_at < ?",
            BigDecimal.class,
            fromDate,
            toDate
        );

        return SalesSummaryResponse.builder()
            .period(normalized)
            .invoiceCount(invoiceCount == null ? 0 : invoiceCount)
            .totalAmount(total == null ? BigDecimal.ZERO : total)
            .build();
    }

    public List<TopProductResponse> topProducts(int limit, int days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        return jdbcTemplate.query(
            """
                SELECT p.id, p.name, COALESCE(SUM(sii.quantity), 0) AS total_units
                FROM products p
                JOIN sales_invoice_items sii ON sii.product_id = p.id
                JOIN sales_invoices si ON si.id = sii.invoice_id
                WHERE si.created_at >= ?
                GROUP BY p.id, p.name
                ORDER BY total_units DESC
                LIMIT ?
                """,
            (rs, rowNum) -> TopProductResponse.builder()
                .productId(rs.getLong("id"))
                .productName(rs.getString("name"))
                .totalUnits(rs.getLong("total_units"))
                .build(),
            fromDate,
            limit
        );
    }

    public PageResponse<com.grocerystore.module.inventory.dto.InventoryResponse> lowStock(int page, int size) {
        Page<Inventory> result = inventoryRepository.findLowStock(PageRequest.of(page, size, Sort.by("quantity").ascending()));
        List<com.grocerystore.module.inventory.dto.InventoryResponse> content = result.stream()
            .map(i -> com.grocerystore.module.inventory.dto.InventoryResponse.builder()
                .productId(i.getProduct().getId())
                .productName(i.getProduct().getName())
                .quantity(i.getQuantity())
                .lowStockThreshold(i.getLowStockThreshold())
                .lowStock(true)
                .lastUpdated(i.getLastUpdated())
                .build())
            .toList();

        return PageResponse.<com.grocerystore.module.inventory.dto.InventoryResponse>builder()
            .content(content)
            .page(result.getNumber())
            .size(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .first(result.isFirst())
            .last(result.isLast())
            .build();
    }
}
