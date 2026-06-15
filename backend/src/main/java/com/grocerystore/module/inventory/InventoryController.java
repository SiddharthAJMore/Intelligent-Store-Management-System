package com.grocerystore.module.inventory;

import com.grocerystore.common.response.ApiResponse;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.inventory.dto.InventoryResponse;
import com.grocerystore.module.inventory.dto.StockInRequest;
import com.grocerystore.module.inventory.dto.StockMovementResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public ResponseEntity<ApiResponse<PageResponse<InventoryResponse>>> getInventory(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "id") String sortBy,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<InventoryResponse>>builder()
            .success(true)
            .message("Inventory fetched")
            .data(inventoryService.getInventory(page, size, sortBy, direction))
            .build());
    }

    @GetMapping("/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.<InventoryResponse>builder()
            .success(true)
            .message("Inventory fetched")
            .data(inventoryService.getByProductId(productId))
            .build());
    }

    @PostMapping("/stock-in")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse>> stockIn(@Valid @RequestBody StockInRequest request) {
        return ResponseEntity.ok(ApiResponse.<InventoryResponse>builder()
            .success(true)
            .message("Stock added")
            .data(inventoryService.stockIn(request))
            .build());
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<InventoryResponse>>> lowStock(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "quantity") String sortBy,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<InventoryResponse>>builder()
            .success(true)
            .message("Low stock items fetched")
            .data(inventoryService.getLowStock(page, size, sortBy, direction))
            .build());
    }

    @GetMapping("/movements/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<StockMovementResponse>>> movements(
        @PathVariable Long productId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<StockMovementResponse>>builder()
            .success(true)
            .message("Stock movement history fetched")
            .data(inventoryService.getMovements(productId, page, size, sortBy, direction))
            .build());
    }
}
