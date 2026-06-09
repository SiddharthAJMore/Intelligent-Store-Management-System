package com.grocerystore.module.product;

import com.grocerystore.common.exception.ResourceNotFoundException;
import com.grocerystore.common.response.PageResponse;
import com.grocerystore.module.category.entity.Category;
import com.grocerystore.module.category.repository.CategoryRepository;
import com.grocerystore.module.product.dto.ProductRequest;
import com.grocerystore.module.product.dto.ProductResponse;
import com.grocerystore.module.product.entity.Product;
import com.grocerystore.module.product.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public PageResponse<ProductResponse> list(Long categoryId, Boolean active, String search, int page, int size, String sortBy, String direction) {
        Specification<Product> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("isActive"), active));
            }
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Page<Product> products = productRepository.findAll(specification, PageRequest.of(page, size, sort));
        return toPageResponse(products.map(this::toResponse));
    }

    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toResponse(product);
    }

    public ProductResponse create(ProductRequest request) {
        if (request.getSku() != null && !request.getSku().isBlank() && productRepository.existsBySku(request.getSku())) {
            throw new IllegalArgumentException("SKU already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = Product.builder()
            .name(request.getName())
            .category(category)
            .price(request.getPrice())
            .unit(request.getUnit())
            .sku(request.getSku())
            .isActive(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        return toResponse(productRepository.save(product));
    }

    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (request.getSku() != null && !request.getSku().isBlank() && productRepository.existsBySkuAndIdNot(request.getSku(), id)) {
            throw new IllegalArgumentException("SKU already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        product.setName(request.getName());
        product.setCategory(category);
        product.setPrice(request.getPrice());
        product.setUnit(request.getUnit());
        product.setSku(request.getSku());
        product.setUpdatedAt(LocalDateTime.now());
        return toResponse(productRepository.save(product));
    }

    public ProductResponse setStatus(Long id, boolean active) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setActive(active);
        product.setUpdatedAt(LocalDateTime.now());
        return toResponse(productRepository.save(product));
    }

    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
            .id(product.getId())
            .name(product.getName())
            .categoryId(product.getCategory().getId())
            .categoryName(product.getCategory().getName())
            .price(product.getPrice())
            .unit(product.getUnit())
            .sku(product.getSku())
            .active(product.isActive())
            .createdAt(product.getCreatedAt())
            .updatedAt(product.getUpdatedAt())
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
