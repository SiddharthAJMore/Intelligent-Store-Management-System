package com.grocerystore.module.category;

import com.grocerystore.common.response.ApiResponse;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.category.dto.CategoryRequest;
import com.grocerystore.module.category.dto.CategoryResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public ResponseEntity<ApiResponse<PageResponse<CategoryResponse>>> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "id") String sortBy,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<CategoryResponse>>builder()
            .success(true)
            .message("Categories fetched")
            .data(categoryService.list(page, size, sortBy, direction))
            .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.<CategoryResponse>builder()
            .success(true)
            .message("Category created")
            .data(categoryService.create(request))
            .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.<CategoryResponse>builder()
            .success(true)
            .message("Category updated")
            .data(categoryService.update(id, request))
            .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .success(true)
            .message("Category deleted")
            .build());
    }
}
