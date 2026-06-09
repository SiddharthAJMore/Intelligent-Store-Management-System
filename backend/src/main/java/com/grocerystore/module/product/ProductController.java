package com.grocerystore.module.product;

import com.grocerystore.common.response.ApiResponse;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.product.dto.ProductRequest;
import com.grocerystore.module.product.dto.ProductResponse;
import com.grocerystore.module.product.dto.ProductStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> list(
        @RequestParam(required = false) Long category,
        @RequestParam(required = false) Boolean active,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "id") String sortBy,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<ProductResponse>>builder()
            .success(true)
            .message("Products fetched")
            .data(productService.list(category, active, search, page, size, sortBy, direction))
            .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public ResponseEntity<ApiResponse<ProductResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
            .success(true)
            .message("Product fetched")
            .data(productService.getById(id))
            .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
            .success(true)
            .message("Product created")
            .data(productService.create(request))
            .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
            .success(true)
            .message("Product updated")
            .data(productService.update(id, request))
            .build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> setStatus(@PathVariable Long id, @RequestBody ProductStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
            .success(true)
            .message("Product status updated")
            .data(productService.setStatus(id, request.isActive()))
            .build());
    }
}
