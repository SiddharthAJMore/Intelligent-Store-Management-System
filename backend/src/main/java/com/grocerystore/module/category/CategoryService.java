package com.grocerystore.module.category;

import com.grocerystore.common.exception.ResourceNotFoundException;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.category.dto.CategoryRequest;
import com.grocerystore.module.category.dto.CategoryResponse;
import com.grocerystore.module.category.entity.Category;
import com.grocerystore.module.category.repository.CategoryRepository;
import com.grocerystore.module.product.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public PageResponse<CategoryResponse> list(int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Page<Category> categories = categoryRepository.findAll(PageRequest.of(page, size, sort));
        return toPageResponse(categories.map(this::toResponse));
    }

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Category already exists");
        }
        Category category = Category.builder()
            .name(request.getName())
            .description(request.getDescription())
            .createdAt(LocalDateTime.now())
            .build();
        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new IllegalArgumentException("Category already exists");
        }
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        return toResponse(categoryRepository.save(category));
    }

    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (productRepository.countByCategoryId(id) > 0) {
            throw new IllegalArgumentException("Cannot delete category with linked products");
        }
        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
            .id(category.getId())
            .name(category.getName())
            .description(category.getDescription())
            .createdAt(category.getCreatedAt())
            .build();
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
