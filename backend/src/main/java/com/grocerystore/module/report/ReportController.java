package com.grocerystore.module.report;

import com.grocerystore.common.response.ApiResponse;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.inventory.dto.InventoryResponse;
import com.grocerystore.module.report.dto.SalesSummaryResponse;
import com.grocerystore.module.report.dto.TopProductResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales-summary")
    public ResponseEntity<ApiResponse<SalesSummaryResponse>> salesSummary(@RequestParam(defaultValue = "daily") String period) {
        return ResponseEntity.ok(ApiResponse.<SalesSummaryResponse>builder()
            .success(true)
            .message("Sales summary fetched")
            .data(reportService.salesSummary(period))
            .build());
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<List<TopProductResponse>>> topProducts(
        @RequestParam(defaultValue = "10") int limit,
        @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(ApiResponse.<List<TopProductResponse>>builder()
            .success(true)
            .message("Top products fetched")
            .data(reportService.topProducts(limit, days))
            .build());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<PageResponse<InventoryResponse>>> lowStock(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<InventoryResponse>>builder()
            .success(true)
            .message("Low stock fetched")
            .data(reportService.lowStock(page, size))
            .build());
    }
}
