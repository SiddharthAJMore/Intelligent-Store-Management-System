package com.grocerystore.module.inventory.repository;

import com.grocerystore.module.inventory.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(Long productId);

    Page<StockMovement> findByProductId(Long productId, Pageable pageable);
}
