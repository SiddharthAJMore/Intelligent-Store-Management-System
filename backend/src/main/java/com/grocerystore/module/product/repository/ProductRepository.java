package com.grocerystore.module.product.repository;

import com.grocerystore.module.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySku(String sku);

    List<Product> findByIsActiveTrue();

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    long countByCategoryId(Long categoryId);
}
