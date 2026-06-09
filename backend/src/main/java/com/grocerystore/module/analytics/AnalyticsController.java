package com.grocerystore.module.analytics;

import com.grocerystore.common.response.ApiResponse;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.analytics.dto.AssociationRuleResponse;
import com.grocerystore.module.analytics.dto.RestockSuggestionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PostMapping("/run")
    public ResponseEntity<ApiResponse<Void>> run() {
        analyticsService.runAnalysis();
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .success(true)
            .message("Analytics completed")
            .build());
    }

    @GetMapping("/association-rules")
    public ResponseEntity<ApiResponse<PageResponse<AssociationRuleResponse>>> associationRules(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "coOccurrenceCount") String sortBy,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<AssociationRuleResponse>>builder()
            .success(true)
            .message("Association rules fetched")
            .data(analyticsService.getAssociationRules(page, size, sortBy, direction))
            .build());
    }

    @GetMapping("/restock-suggestions")
    public ResponseEntity<ApiResponse<PageResponse<RestockSuggestionResponse>>> restockSuggestions(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "daysUntilStockout") String sortBy,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<RestockSuggestionResponse>>builder()
            .success(true)
            .message("Restock suggestions fetched")
            .data(analyticsService.getRestockSuggestions(page, size, sortBy, direction))
            .build());
    }
}
